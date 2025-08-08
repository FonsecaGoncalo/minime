from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import List

from conversation_store import ConversationStore
from llm_provider import ChatProvider
from types import ChatMessage

logger = logging.getLogger(__name__)

MAX_WINDOW_TOKENS = 3_000
SUMMARY_TRIGGER_TOKENS = 1_500


def approx_tokens(text: str) -> int:
    """Crude token estimator (4chars ≈1token)."""
    return max(1, len(text) // 4)


@dataclass
class MemoryManager:
    """Window+running summary memory for a chat session."""

    session_id: str
    llm: ChatProvider
    store: ConversationStore = field(init=False)
    summary: str = field(default="")
    window: List[ChatMessage] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.store = ConversationStore(self.session_id)
        self.summary = self.store.get_summary() or ""
        self.window = self._build_window()

    def get_memory(self) -> dict:
        """Return memory as a ``dict`` with summary and conversation list."""
        return {
            "summary": self.summary,
            "conversation": [{"role": m.role, "message": m.content} for m in self.window],
        }

    def save_turn(self, user_msg: str, assistant_msg: str) -> None:
        """Persist new messages, update summary, prune window."""
        self.store.add_message("user", user_msg)
        self.store.add_message("assistant", assistant_msg)

        self.window.append(ChatMessage(role="user", content=user_msg))
        self.window.append(ChatMessage(role="assistant", content=assistant_msg))
        self._trim_window()

        while self._window_tokens() > SUMMARY_TRIGGER_TOKENS:
            self._roll_oldest_into_summary()

        self.store.save_summary(self.summary)

    def _build_window(self) -> List[ChatMessage]:
        """Return the most recent messages up to MAX_WINDOW_TOKENS."""
        raw = self.store.get_conversation()  # oldest→newest
        total = 0
        window: List[ChatMessage] = []
        for m in reversed(raw):
            tkn = approx_tokens(m.content)
            if total + tkn > MAX_WINDOW_TOKENS:
                break
            window.insert(0, ChatMessage(role=m.role, content=m.content))
            total += tkn
        return window

    def _window_tokens(self) -> int:
        return sum(approx_tokens(m.content) for m in self.window)

    def _trim_window(self) -> None:
        total = self._window_tokens()
        while self.window and total > MAX_WINDOW_TOKENS:
            removed = self.window.pop(0)
            total -= approx_tokens(removed.content)

    def _roll_oldest_into_summary(self) -> None:
        """Summarise the oldest 25% of the window into running summary."""
        if not self.window:
            return
        cut = max(1, len(self.window) // 4)
        to_summarise = self.window[:cut]
        self.window = self.window[cut:]

        text_block = "\n".join(f"{m.role}: {m.content}" for m in to_summarise)
        summary_instruction = (
            "Summarise the following dialogue in 3–4 sentences, "
            "preserving key facts and decisions:\n\n" + text_block
        )
        try:
            new_summary = self.llm.invoke(
                [{"role": "user", "content": summary_instruction}],
                max_tokens=128,
                temperature=0.3,
                top_p=0.9,
            )
            if self.summary:
                self.summary = f"{self.summary}\n{new_summary}"
            else:
                self.summary = new_summary
        except Exception as e:
            logger.warning("Summary generation failed–keeping old summary. %s", e)
