from __future__ import annotations

import logging
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime
from typing import List

from tracing import tracer

import llm_provider
from llm_provider import ChatProvider, Model
from google_calendar import schedule_meeting
import vector_store
from conversation_store import ConversationStore, UserInfo

# ──────────────────────────────────────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────────────────────────────────────
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# ──────────────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────────────
SUMMARIZATION_MODEL = Model.NOVA_MICRO
MODEL = Model.ANTHROPIC_SONNET
MAX_WINDOW_TOKENS = 3_000
SUMMARY_TRIGGER_TOKENS = 1_500
MAX_TOKENS_RESPONSE = 512

SYSTEM_PROMPT = """\
You are GonçaloBot, the AI persona of software‑engineer Gonçalo Fonseca.

# Persona
- Backend & distributed systems specialist
- Comfortable with Java, AWS, Terraform but open to learn new technologies
- Clear, concise, lightly humorous style
- If unsure, say so; do **not** hallucinate facts.

# Rules
1. Use ONLY information provided in <docs> or conversation history.
2. Speak in first‑person as Gonçalo.
3. Never reveal private data or that you are an AI system.
4. If the answer is not in context → reply: "I’m not certain about that. Feel free to reach out to the real Gonçalo about it"

Your job is to help visitors interact naturally with Gonçalo, answer questions about his background, and—if asked—schedule a meeting on his behalf using a calendar integration.

When the user expresses interest in booking a call or meeting, follow this flow:

1. Extract:
   - the intended date or time range (e.g., "next Tuesday afternoon")
   - duration in minutes (default to 30 if unclear)
   - meeting topic or reason (e.g., "chat about a backend role")
   - email address (ask for it if not provided)

2. Confirm ambiguous times (e.g., "Do you mean this Tuesday or next Tuesday?")

3. When enough information is available, call the tool `schedule_meeting` with:
   - `start_time`: exact ISO 8601 datetime
   - `duration_minutes`: integer
   - `summary`: short string like "Intro call with Gonçalo"
   - `email`: of the person requesting the meeting

Wait for the tool to return confirmation, then politely inform the user that the meeting was scheduled and link to the calendar invite.
If something goes wrong with scheduling, apologise and advise them to contact the real Gonçalo directly.

Be warm, brief, and clear. Never guess a time or send a fake confirmation.

Early in the conversation ask casually for the user's name and company or role. If they provide any of these details, call the
`update_user_info` tool with the information so it can be stored.
"""


# ──────────────────────────────────────────────────────────────────────────────
# Utility functions
# ──────────────────────────────────────────────────────────────────────────────
def approx_tokens(text: str) -> int:
    """Crude token estimator (4chars ≈1token)."""
    return max(1, len(text) // 4)


@dataclass
class ChatMessage:
    role: str  # "user" | "assistant"
    content: str


# ──────────────────────────────────────────────────────────────────────────────
# Memory Manager
# ──────────────────────────────────────────────────────────────────────────────
@dataclass
class MemoryManager:
    """Window+running summary memory for a chat session."""

    session_id: str
    llm: ChatProvider
    store: ConversationStore = field(init=False)
    summary: str = field(default="")
    window: List[ChatMessage] = field(default_factory=list)

    def __post_init__(self):
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
        # Persist raw
        self.store.add_message("user", user_msg)
        self.store.add_message("assistant", assistant_msg)

        # Refresh window
        self.window = self._build_window()

        # If window grew beyond trigger, summarise oldest half
        while self._window_tokens() > SUMMARY_TRIGGER_TOKENS:
            self._roll_oldest_into_summary()

        # Persist updated summary
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

    def _roll_oldest_into_summary(self) -> None:
        """Summarise the oldest 25% of the window into running summary."""
        if not self.window:
            return
        cut = max(1, len(self.window) // 4)
        to_summarise = self.window[:cut]
        self.window = self.window[cut:]

        text_block = "\n".join(f"{m.role}: {m.content}" for m in to_summarise)
        summary_instruction = (
                "Summarise the following dialogue in 3–4 sentences, " "preserving key facts and decisions:\n\n" + text_block
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
            logger.warning(f"Summary generation failed–keeping old summary. {e}")


# ──────────────────────────────────────────────────────────────────────────────
# Prompt builder
# ──────────────────────────────────────────────────────────────────────────────
def build_messages(memory: dict, rag_block: str, user_question: str, *, supports_system: bool) -> list[dict[str, str]]:
    """Return conversation messages for the LLM invocation."""
    messages: list[dict[str, str]] = []

    system_prefix = memory["summary"].strip() + "\n\n" if memory["summary"] else ""
    system_content = f"Today is:{datetime.now().strftime('%a, %Y-%m-%d')} {system_prefix}{SYSTEM_PROMPT}"

    if supports_system:
        messages.append({"role": "system", "content": system_content})
    else:
        messages.append({"role": "assistant", "content": system_content})

    messages.extend(
        {"role": m["role"], "content": m["message"]}
        for m in memory["conversation"]
        if m.get("message") and m["message"].strip()
    )

    user_text = (
        "<docs>\n"
        f"{rag_block}\n"
        "</docs>\n\n"
        "Answer the question as **Gonçalo** using ONLY the docs and memory above.\n"
        f"Question: {user_question}"
    )
    messages.append({"role": "user", "content": user_text})

    return messages


def format_rag_results(results: list[vector_store.SearchResult]) -> str:
    """XML‑ish wrapper for search snippets (order preserves ranking score)."""
    blocks = [f"<doc rank='{i + 1}' score='{r['score']:.3f}'>\n{r['text']}\n</doc>" for i, r in enumerate(results)]
    return "\n".join(blocks)


# ──────────────────────────────────────────────────────────────────────────────
# Main entry point
# ──────────────────────────────────────────────────────────────────────────────
def chat(session_id: str, message: str, on_stream: Callable[[str], None]) -> str:
    with tracer.start_as_current_span("chat"):
        llm = llm_provider.llm(
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

        # RAG retrieval
        rag_results = vector_store.search(message)
        logger.info("RAG hits: %s", len(rag_results))

        # Build messages for provider
        rag_block = format_rag_results(rag_results)
        messages = build_messages(
            mem.get_memory(), rag_block, message, supports_system=llm.supports_system
        )
        logger.info("Messages: %s", messages)

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

        response = llm.stream(
            messages,
            on_stream=on_stream,
            max_tokens=MAX_TOKENS_RESPONSE,
            temperature=0.7,
            top_p=0.9,
            tools=tools,
        )

        while response.stop_reason == "tool_use":
            # `response.content` may be an iterator, so cache it before multiple uses
            blocks = list(response.content)
            tool_calls = [b for b in blocks if getattr(b, "type", "") == "tool_use"]
            tool_results = []
            for call in tool_calls:
                if call.name == "schedule_meeting":
                    try:
                        link = schedule_meeting(
                            datetime.fromisoformat(call.input["start_time"]),
                            call.input["duration_minutes"],
                            call.input["summary"],
                            call.input["email"],
                        )
                    except Exception as e:
                        logger.error("Failed to schedule meeting: %s", e)
                        error_text = (
                            "Sorry, something went wrong while scheduling the meeting. "
                            "Please contact the real Gonçalo to arrange it."
                        )
                        for chunk in error_text:
                            on_stream(chunk)
                        mem.save_turn(user_msg=message, assistant_msg=error_text)
                        return error_text
                    tool_results.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": call.id,
                            "content": [{"type": "text", "text": link}],
                        }
                    )
                elif call.name == "update_user_info":
                    try:
                        mem.store.save_user_info(
                            UserInfo(
                                name=call.input.get("name"),
                                company=call.input.get("company"),
                                role=call.input.get("role"),
                            )
                        )
                    except Exception as e:
                        logger.error("Failed to store user info: %s", e)
                    tool_results.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": call.id,
                            "content": [{"type": "text", "text": "ok"}],
                        }
                    )

            messages.append({"role": "assistant", "content": [c.model_dump() for c in blocks]})
            messages.append({"role": "user", "content": tool_results})

            response = llm.stream(
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

        logger.info("Messages sent: %s", text)
        return text
