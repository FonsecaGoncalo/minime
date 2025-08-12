from __future__ import annotations

import logging
from collections.abc import Callable

from haystack.components.agents import Agent
from haystack.components.generators.chat import OpenAIChatGenerator
from haystack.dataclasses import ChatMessage

import llm_provider
from llm_provider import Model
from memory.memory import MemoryManager
from prompts import build_messages
from tools import time
from tools.scheduler import schedule_meeting
from tools.search_docs import make_search_docs
from tools.user_info import make_update_user_info_tool
from tracing_utils import log_ctx

logger = logging.getLogger(__name__)

SUMMARIZATION_MODEL = Model.NOVA_MICRO
MAX_TOKENS_RESPONSE = 512


def chat(session_id: str, message: str, on_stream: Callable[[str], None]) -> str:
    logger.info("inside chat: %s", message)
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

    messages = _map_messages(build_messages(
        memory_snapshot, message
    ))

    logger.info("Messages: %s", messages, **log_ctx(session_id=session_id))

    llm = OpenAIChatGenerator(
        model="gpt-5",
        streaming_callback=lambda chunk: on_stream(chunk.content) if chunk.content else None,
        generation_kwargs={"reasoning_effort": "minimal"},
        tools=[make_update_user_info_tool(mem), schedule_meeting]
        # generation_kwargs={"temperature": 0.7, "top_p": 0.9},
    )

    time_tools = time.TimeTools()
    result = Agent(
        chat_generator=llm,
        tools=[
            make_update_user_info_tool(mem),
            schedule_meeting,
            make_search_docs(session_id, memory_snapshot),
            time_tools.convert_time,
            time_tools.get_current_time
        ]).run(messages=messages)

    assistant_response = result["messages"][-1].text
    mem.save_turn(user_msg=message, assistant_msg=assistant_response)
    logger.info("Messages sent: %s", assistant_response, **log_ctx(session_id=session_id))

    return assistant_response


def _map_messages(messages):
    chat_messages = []
    for m in messages:
        if m["role"] == "system":
            chat_messages.append(ChatMessage.from_system(m["content"]))
        elif m["role"] == "user":
            chat_messages.append(ChatMessage.from_user(m["content"]))
        else:
            chat_messages.append(ChatMessage.from_assistant(m["content"]))
    return chat_messages
