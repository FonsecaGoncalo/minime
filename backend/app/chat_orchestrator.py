from __future__ import annotations

import logging
from collections.abc import Callable

from haystack.components.agents import Agent
from haystack.components.generators.chat import OpenAIChatGenerator
from haystack.dataclasses import ChatMessage

import llm_provider
from llm_provider import Model
from memory import MemoryManager
from prompts import build_messages
from rag import search as rag_search, format_results, rewrite_with_history
from tools.scheduler import ScheduleMeeting
from tools.user_info import UpdateUserInfo
from tracing_utils import span, log_ctx

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

        logger.info("Create client")
        llm = OpenAIChatGenerator(
            model="gpt-5",
            streaming_callback=_stream_cb,
            generation_kwargs={"reasoning_effort": "minimal"},
            # generation_kwargs={"temperature": 0.7, "top_p": 0.9},
        )

        result = Agent(
            chat_generator=llm,
            tools=[UpdateUserInfo(mem), ScheduleMeeting()]
        ).run(messages=chat_messages)

        assistant_response = result["messages"][-1].text
        mem.save_turn(user_msg=message, assistant_msg=assistant_response)
        logger.info("Messages sent: %s", assistant_response, **log_ctx(session_id=session_id))

        return assistant_response
