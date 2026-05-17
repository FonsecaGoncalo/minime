from __future__ import annotations

import base64
import logging
from collections.abc import Callable
from queue import Queue
from threading import Thread

from haystack.components.agents import Agent
from haystack.dataclasses import ChatMessage
from haystack_integrations.components.generators.anthropic import AnthropicChatGenerator

import agents.prompts as prompts
from memory.memory import MemoryManager
from services import tts
from tools import time
from tools.scheduler import schedule_meeting
from tools.search_docs import make_search_docs
from tools.user_info import make_update_user_info_tool
from tracing_utils import log_ctx

logger = logging.getLogger(__name__)

MAX_TOKENS_RESPONSE = 400

_VOICE_STOP = object()


class _VoiceWorker:
    """Consumes sentence-sized text chunks on a worker thread, emits base64 mp3 via on_audio."""

    def __init__(
            self,
            on_audio: Callable[[str, bool], None],
            is_alive: Callable[[], bool] | None = None,
    ) -> None:
        self._on_audio = on_audio
        self._is_alive = is_alive or (lambda: True)
        self._queue: Queue = Queue()
        self._thread = Thread(target=self._run, daemon=True)
        self._thread.start()

    def _run(self) -> None:
        while True:
            sentence = self._queue.get()
            if sentence is _VOICE_STOP:
                if self._is_alive():
                    self._on_audio("", True)
                return
            if not self._is_alive():
                continue
            audio = tts.synthesize(sentence)
            if audio and self._is_alive():
                self._on_audio(base64.b64encode(audio).decode("ascii"), False)

    def submit(self, sentence: str) -> None:
        self._queue.put(sentence)

    def close(self) -> None:
        self._queue.put(_VOICE_STOP)
        self._thread.join(timeout=60)


def chat(
        session_id: str,
        message: str,
        on_stream: Callable[[str], None],
        on_tool: Callable[[str], None] | None = None,
        on_audio: Callable[[str, bool], None] | None = None,
        is_alive: Callable[[], bool] | None = None,
) -> str:
    logger.info("inside chat: %s", message)
    mem = MemoryManager(
        session_id=session_id,
    )

    memory_snapshot = mem.get_memory()
    logger.info(f"memory snapshot {memory_snapshot}")

    messages = _map_messages(memory_snapshot["conversation"])
    messages.append(ChatMessage.from_user(prompts.llm_prompt(message)))

    logger.info("Messages: %s", messages, **log_ctx(session_id=session_id))

    alive = is_alive or (lambda: True)
    voice_worker = _VoiceWorker(on_audio, alive) if on_audio else None
    sentence_buf = tts.SentenceBuffer() if voice_worker else None

    def streaming_callback(chunk):
        if not alive():
            return
        if chunk.content:
            on_stream(chunk.content)
            if sentence_buf is not None:
                for sentence in sentence_buf.feed(chunk.content):
                    voice_worker.submit(sentence)
        if on_tool and chunk.tool_calls:
            for tc in chunk.tool_calls:
                if tc.tool_name:
                    on_tool(tc.tool_name)

    llm = AnthropicChatGenerator(
        model="claude-sonnet-4-6",
        streaming_callback=streaming_callback,
        generation_kwargs={
            "temperature": 0.7,
            "max_tokens": MAX_TOKENS_RESPONSE,
        },
    )

    try:
        result = Agent(
            chat_generator=llm,
            system_prompt=prompts.system_prompt(memory_snapshot),
            tools=[
                make_update_user_info_tool(mem),
                schedule_meeting,
                make_search_docs(session_id, memory_snapshot),
                time.convert_time,
                time.get_current_time
            ]).run(messages=messages)
    finally:
        if voice_worker:
            if alive():
                tail = sentence_buf.flush()
                if tail:
                    voice_worker.submit(tail)
            voice_worker.close()

    assistant_response = result["messages"][-1].text
    mem.save_turn(user_msg=message, assistant_msg=assistant_response)
    logger.info("Messages sent: %s", assistant_response, **log_ctx(session_id=session_id))

    return assistant_response


def _map_messages(messages):
    chat_messages = []
    for m in messages:
        if m["role"] == "user":
            chat_messages.append(ChatMessage.from_user(m["message"]))
        else:
            chat_messages.append(ChatMessage.from_assistant(m["message"]))
    return chat_messages
