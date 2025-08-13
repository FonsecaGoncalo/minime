import json
import logging
import os
from typing import Any, Dict, Iterable, List, Optional

from haystack.dataclasses import ChatMessage
from haystack_integrations.components.generators.amazon_bedrock import (
    AmazonBedrockChatGenerator,
)

from memory.conversation_store import ConversationStore
from services import email
from tracing import init_tracing, tracer

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
init_tracing("conversation_summary_handler")

MODEL_ID = "eu.amazon.nova-micro-v1:0"
TEMPERATURE = 0.3
TOP_P = 0.9
EMAIL_SUBJECT = "Conversation Summary"
MAX_PROMPT_CHARS = 24000


def _parse_session_id(event: Dict[str, Any]) -> Optional[str]:
    records = event.get("Records", [])
    if not records:
        logger.warning("No records in event: %s", event)
        return None
    try:
        payload = json.loads(records[0].get("body", "{}"))
    except Exception as exc:
        logger.warning("Failed to parse SQS message body: %s", exc, exc_info=True)
        return None
    return payload.get("detail", {}).get("session_id")


def _format_ts(ts: Any) -> str:
    try:
        return ts.isoformat()  # datetime-like
    except Exception:
        return str(ts) if ts is not None else "N/A"


def _iter_conversation_lines(
    base_summary: str, messages: Iterable[ChatMessage]
) -> Iterable[str]:
    if base_summary:
        yield base_summary
    for m in messages:
        role = getattr(m, "role", "unknown")
        content = getattr(m, "content", "")
        yield f"{role}: {content}"


def _build_text_block(
    base_summary: str, messages: List[ChatMessage], max_chars: int
) -> str:
    joined = "\n".join(_iter_conversation_lines(base_summary, messages))
    if len(joined) <= max_chars:
        return joined
    return joined[-max_chars:]


def _build_prompt(text_block: str) -> str:
    return (
        "Summarise the following conversation in 3-4 sentences, "
        "preserving key facts and decisions:\n\n" + text_block
    )


def _run_bedrock(prompt: str) -> str:
    generator = AmazonBedrockChatGenerator(
        model=MODEL_ID,
    )
    result = generator.run(messages=[ChatMessage.from_user(prompt)])
    replies: List[ChatMessage] = result.get("replies", [])
    if not replies:
        raise RuntimeError("No replies returned by the model")
    return getattr(replies[-1], "content", replies[-1].text)


def _format_meta(session_id: str, messages: List[ChatMessage], user_info: Any) -> str:
    start_time = _format_ts(messages[0].timestamp) if messages else "N/A"
    end_time = _format_ts(messages[-1].timestamp) if messages else "N/A"

    meta_lines = [f"Session ID: {session_id}"]

    if user_info:
        if getattr(user_info, "name", None):
            meta_lines.append(f"Name: {user_info.name}")
        if getattr(user_info, "company", None):
            meta_lines.append(f"Company: {user_info.company}")
        if getattr(user_info, "role", None):
            meta_lines.append(f"Role: {user_info.role}")

        # Location block
        loc_parts = []
        city = getattr(user_info, "city", None)
        country = getattr(user_info, "country", None)
        ip = getattr(user_info, "ip", None)

        if city:
            loc_parts.append(city)
        if country:
            loc_parts.append(country)

        location = ", ".join(loc_parts)
        if ip:
            location = f"{location} (IP: {ip})" if location else f"IP: {ip}"
        if location:
            meta_lines.append(f"Location: {location}")

        if getattr(user_info, "postal_code", None):
            meta_lines.append(f"Postal Code: {user_info.postal_code}")
        if getattr(user_info, "time_zone", None):
            meta_lines.append(f"Time Zone: {user_info.time_zone}")

    meta_lines.append(f"Start: {start_time}")
    meta_lines.append(f"End: {end_time}")
    return "\n".join(meta_lines)


def _compose_email_body(meta_text: str, summary_text: str) -> str:
    return f"{meta_text}\n\nSummary:\n{summary_text.strip()}"


def _get_env_var(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return val


def handler(event, context):
    """Generate a conversation summary and send via email."""
    with tracer.start_as_current_span("handler"):
        session_id = _parse_session_id(event)
        if not session_id:
            return {"statusCode": 400}

        store = ConversationStore(session_id)
        messages = store.get_conversation() or []
        base_summary = store.get_summary() or ""
        user_info = store.get_user_info()

        if not messages:
            logger.info("No conversation messages found for session_id=%s", session_id)
            return {"statusCode": 200}

        try:
            text_block = _build_text_block(base_summary, messages, MAX_PROMPT_CHARS)
            prompt = _build_prompt(text_block)
            summary_text = _run_bedrock(prompt)
        except Exception as exc:
            logger.warning("Failed to generate summary: %s", exc, exc_info=True)
            return {"statusCode": 500}

        meta_text = _format_meta(session_id, messages, user_info)
        email_body = _compose_email_body(meta_text, summary_text)

        try:
            from_addr = _get_env_var("SES_FROM_EMAIL")
            to_addr = _get_env_var("SES_TO_EMAIL")
            email.send_email(from_addr, to_addr, EMAIL_SUBJECT, email_body)
        except Exception as exc:
            logger.error("Failed to send email summary: %s", exc, exc_info=True)
            return {"statusCode": 200}

        return {"statusCode": 200}
