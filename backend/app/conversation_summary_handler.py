import json
import logging
import os

from memory.conversation_store import ConversationStore
import llm_provider
from llm_provider import Model
from services import email
from tracing import init_tracing, tracer

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
init_tracing("conversation_summary_handler")


def handler(event, context):
    """Generate a conversation summary and send via email"""
    with tracer.start_as_current_span("handler"):
        records = event.get("Records", [])
        if not records:
            logger.warning("No records in event: %s", event)
            return {"statusCode": 400}

        try:
            payload = json.loads(records[0]["body"])
        except Exception as exc:
            logger.warning("Failed to parse SQS message: %s", exc)
            return {"statusCode": 400}

        session_id = payload.get("detail", {}).get("session_id")
        if not session_id:
            logger.warning("Event missing session_id: %s", payload)
            return {"statusCode": 400}

        store = ConversationStore(session_id)
        messages = store.get_conversation()
        base_summary = store.get_summary() or ""
        user_info = store.get_user_info()

        if messages is None or len(messages) == 0:
            logger.info("No conversation messages found")
            return {"statusCode": 200}

        convo_parts = []
        if base_summary:
            convo_parts.append(base_summary)
        convo_parts.extend(f"{m.role}: {m.content}" for m in messages)
        text_block = "\n".join(convo_parts)

        prompt = (
                "Summarise the following conversation in 3-4 sentences, "
                "preserving key facts and decisions:\n\n" + text_block
        )

        llm = llm_provider.llm(
            Model.NOVA_MICRO, max_tokens=128, temperature=0.3, top_p=0.9
        )
        try:
            summary = llm.invoke(
                [{"role": "user", "content": prompt}],
                max_tokens=128,
                temperature=0.3,
                top_p=0.9,
            )
        except Exception as exc:
            logger.warning("Failed to generate summary: %s", exc)
            return {"statusCode": 500}

        start_time = messages[0].timestamp if messages else "N/A"
        end_time = messages[-1].timestamp if messages else "N/A"

        meta_lines = [f"Session ID: {session_id}"]
        if user_info:
            if user_info.name:
                meta_lines.append(f"Name: {user_info.name}")
            if user_info.company:
                meta_lines.append(f"Company: {user_info.company}")
            if user_info.role:
                meta_lines.append(f"Role: {user_info.role}")
            loc_parts = []
            if user_info.city:
                loc_parts.append(user_info.city)
            if user_info.country:
                loc_parts.append(user_info.country)
            location = ", ".join(loc_parts)
            if user_info.ip:
                location += f" (IP: {user_info.ip})" if location else f"IP: {user_info.ip}"
            if location:
                meta_lines.append(f"Location: {location}")
            if user_info.postal_code:
                meta_lines.append(f"Postal Code: {user_info.postal_code}")
            if user_info.time_zone:
                meta_lines.append(f"Time Zone: {user_info.time_zone}")
        meta_lines.append(f"Start: {start_time}")
        meta_lines.append(f"End: {end_time}")
        meta_text = "\n".join(meta_lines)

        email_body = f"{meta_text}\n\nSummary:\n{summary}"

        try:
            from_addr = os.environ.get("SES_FROM_EMAIL")
            to_addr = os.environ.get("SES_TO_EMAIL")

            if not from_addr or not to_addr:
                logger.error("SES environment variables not fully configured")
                return {"statusCode": 500}

            email.send_email(from_addr, to_addr, "Conversation Summary", email_body)
        except Exception as exc:
            logger.error("Failed to send email summary: %s", exc)

        return {"statusCode": 200}
