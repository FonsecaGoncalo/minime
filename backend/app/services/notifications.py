import json
import logging
import os

import boto3

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_eventbridge = boto3.client("events")

def send_conversation_end_event(session_id: str) -> None:
    """Emit an EventBridge event when a conversation ends."""
    bus_name = os.environ.get("EVENT_BUS_NAME", "default")
    try:
        _eventbridge.put_events(
            Entries=[
                {
                    "EventBusName": bus_name,
                    "Source": "minime.chat",
                    "DetailType": "ConversationEnded",
                    "Detail": json.dumps({"session_id": session_id}),
                }
            ]
        )
        logger.info("Sent conversation end event for %s", session_id)
    except Exception as exc:
        logger.warning("Failed to put EventBridge event: %s", exc)


def send_conversation_start_event(
        session_id: str,
        ip: str,
) -> None:
    """Emit an EventBridge event when a conversation starts."""
    bus_name = os.environ.get("EVENT_BUS_NAME", "default")
    detail = {"session_id": session_id}
    if ip:
        detail["ip"] = ip

    try:
        _eventbridge.put_events(
            Entries=[
                {
                    "EventBusName": bus_name,
                    "Source": "minime.chat",
                    "DetailType": "ConversationStart",
                    "Detail": json.dumps(detail),
                }
            ]
        )
        logger.info("Sent conversation start event for %s", session_id)
    except Exception as exc:
        logger.warning("Failed to put EventBridge event: %s", exc)
