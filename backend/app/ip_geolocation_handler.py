import json
import logging

from memory.conversation_store import ConversationStore, UserInfo
from utils import ip_geolocation
from tracing import init_tracing, tracer

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
init_tracing("ip_geolocation_handler")


def handler(event, context):
    """Populate user info using IP geolocation data."""
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

        detail = payload.get("detail", {})
        session_id = detail.get("session_id")
        ip = detail.get("ip")

        if not session_id:
            logger.warning("Event missing session_id: %s", payload)
            return {"statusCode": 400}

        geo = ip_geolocation.lookup(ip) if ip else None
        if not geo:
            geo = UserInfo(
                ip=ip,
                country=detail.get("country"),
                city=detail.get("city"),
                postal_code=detail.get("postal_code"),
                time_zone=detail.get("time_zone"),
            )

        ConversationStore(session_id).save_user_info(geo)
        return {"statusCode": 200}
