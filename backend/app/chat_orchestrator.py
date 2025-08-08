from __future__ import annotations

import logging
from collections.abc import Callable

import llm_provider
from llm_provider import Model

from memory import MemoryManager
from prompts import build_messages
from rag import search as rag_search, format_results
from tracing_utils import span, log_ctx
from tools import scheduler, user_info

logger = logging.getLogger(__name__)

SUMMARIZATION_MODEL = Model.NOVA_MICRO
MODEL = Model.ANTHROPIC_SONNET
MAX_TOKENS_RESPONSE = 512


def chat(session_id: str, message: str, on_stream: Callable[[str], None]) -> str:
    with span("chat"):
        chat_llm = llm_provider.llm(
            MODEL,
            max_tokens=MAX_TOKENS_RESPONSE,
            temperature=0.7,
            top_p=0.9,
        )
        mem = MemoryManager(
            session_id=session_id,
            llm=llm_provider.llm(
                SUMMARIZATION_MODEL,
                max_tokens=128,
                temperature=0.3,
                top_p=0.9,
            ),
        )

        with span("rag.search"):
            results = rag_search(message)
            logger.info("RAG hits: %s", len(results), **log_ctx(session_id=session_id))
        rag_block = format_results(results)
        messages = build_messages(
            mem.get_memory(), rag_block, message, supports_system=chat_llm.supports_system
        )
        logger.info("Messages: %s", messages, **log_ctx(session_id=session_id))

        tools = [
            {
                "name": "schedule_meeting",
                "description": "Schedule a meeting via google calendar",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "start_time": {"type": "string", "format": "date-time"},
                        "duration_minutes": {"type": "integer"},
                        "summary": {"type": "string"},
                        "email": {"type": "string"},
                    },
                    "required": ["start_time", "duration_minutes", "summary", "email"],
                },
            },
            {
                "name": "update_user_info",
                "description": "Store the user's name, company or role for future reference",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "company": {"type": "string"},
                        "role": {"type": "string"},
                    },
                },
            },
        ]

        with span("llm.stream"):
            response = chat_llm.stream(
                messages,
                on_stream=on_stream,
                max_tokens=MAX_TOKENS_RESPONSE,
                temperature=0.7,
                top_p=0.9,
                tools=tools,
            )

        while response.stop_reason == "tool_use":
            blocks = list(response.content)
            tool_calls = [b for b in blocks if getattr(b, "type", "") == "tool_use"]
            tool_results = []
            for call in tool_calls:
                if call.name == "schedule_meeting":
                    result = scheduler.call(call, on_stream, mem, message)
                    if result is None:
                        return "tool_error"
                    tool_results.append(result)
                elif call.name == "update_user_info":
                    tool_results.append(user_info.call(call, mem))

            messages.append({"role": "assistant", "content": [c.model_dump() for c in blocks]})
            messages.append({"role": "user", "content": tool_results})

            with span("llm.stream.followup"):
                response = chat_llm.stream(
                    messages,
                    on_stream=on_stream,
                    max_tokens=MAX_TOKENS_RESPONSE,
                    temperature=0.7,
                    top_p=0.9,
                    tools=tools,
                )

        text = "".join(
            b.text for b in response.content if getattr(b, "type", "") == "text"
        )
        mem.save_turn(user_msg=message, assistant_msg=text)
        logger.info("Messages sent: %s", text, **log_ctx(session_id=session_id))
        return text
