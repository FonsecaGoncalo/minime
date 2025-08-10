from __future__ import annotations

import logging
from collections.abc import Callable

from haystack.components.generators.chat import OpenAIChatGenerator

import llm_provider
from llm_provider import Model
from haystack.dataclasses import ChatMessage
from haystack.tools import Tool

from memory import MemoryManager
from prompts import build_messages
from rag import search as rag_search, format_results, rewrite_with_history
from tracing_utils import span, log_ctx
from tools import scheduler, user_info

logger = logging.getLogger(__name__)

SUMMARIZATION_MODEL = Model.NOVA_MICRO
MAX_TOKENS_RESPONSE = 512


def chat(session_id: str, message: str, on_stream: Callable[[str], None]) -> str:
    logger.info("inside chat: %s", message)
    with span("chat"):
        mem = MemoryManager(
            session_id=session_id,
            llm=llm_provider.llm(
                SUMMARIZATION_MODEL,
                max_tokens=128,
                temperature=0.3,
                top_p=0.9,
            ),
        )
        memory_snapshot = mem.get_memory()
        logger.info(f"memory snapshot {memory_snapshot}")

        with span("rag.search"):
            search_query = rewrite_with_history(memory_snapshot, message)
            logger.info(f"RAG search query: {search_query}", **log_ctx(session_id=session_id))
            results = rag_search(search_query)
            logger.info("RAG hits: %s", len(results), **log_ctx(session_id=session_id))
        rag_block = format_results(results)

        messages = build_messages(
            memory_snapshot, rag_block, message, supports_system=True
        )

        logger.info("Messages: %s", messages, **log_ctx(session_id=session_id))

        chat_messages = []
        for m in messages:
            if m["role"] == "system":
                chat_messages.append(ChatMessage.from_system(m["content"]))
            elif m["role"] == "user":
                chat_messages.append(ChatMessage.from_user(m["content"]))
            else:
                chat_messages.append(ChatMessage.from_assistant(m["content"]))

        def _stream_cb(chunk):
            if chunk.content:
                on_stream(chunk.content)

        llm = OpenAIChatGenerator(
            model="gpt-5",
            streaming_callback=_stream_cb,
            # generation_kwargs={"temperature": 0.7, "top_p": 0.9},
        )

        class _Call:
            def __init__(self, args):
                self.id = None
                self.input = args

        def _schedule_tool(start_time: str, duration_minutes: int, summary: str, email: str) -> str:
            call = _Call(
                {
                    "start_time": start_time,
                    "duration_minutes": duration_minutes,
                    "summary": summary,
                    "email": email,
                }
            )
            result = scheduler.call(call, on_stream, mem, message)
            if result is None:
                raise RuntimeError("tool_error")
            return result["content"][0]["text"]

        def _update_user_info_tool(name: str | None = None, company: str | None = None, role: str | None = None) -> str:
            call = _Call({"name": name, "company": company, "role": role})
            result = user_info.call(call, mem)
            return result["content"][0]["text"]

        schedule_tool = Tool(
            name="schedule_meeting",
            description="Schedule a meeting via google calendar",
            parameters={
                "type": "object",
                "properties": {
                    "start_time": {"type": "string", "format": "date-time"},
                    "duration_minutes": {"type": "integer"},
                    "summary": {"type": "string"},
                    "email": {"type": "string"},
                },
                "required": ["start_time", "duration_minutes", "summary", "email"],
            },
            function=_schedule_tool,
        )

        update_tool = Tool(
            name="update_user_info",
            description="Store the user's name, company or role for future reference",
            parameters={
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "company": {"type": "string"},
                    "role": {"type": "string"},
                },
            },
            function=_update_user_info_tool,
        )

        tools = {t.name: t for t in [schedule_tool, update_tool]}

        while True:
            with span("llm.run"):
                response = llm.run(chat_messages, tools=list(tools.values()))

            reply = response["replies"][0]
            if reply.tool_calls:
                tool_msgs = []
                for tc in reply.tool_calls:
                    tool = tools.get(tc.tool_name)
                    if not tool:
                        continue
                    try:
                        res_text = tool.invoke(**tc.arguments)
                    except Exception:
                        res_text = "tool_error"
                    tool_msgs.append(ChatMessage.from_tool(res_text, origin=tc))
                chat_messages.append(reply)
                chat_messages.extend(tool_msgs)
            else:
                text = reply.text or ""
                mem.save_turn(user_msg=message, assistant_msg=text)
                logger.info("Messages sent: %s", text, **log_ctx(session_id=session_id))
                return text
