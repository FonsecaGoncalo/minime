import logging

from conversation_store import UserInfo
from tracing_utils import log_ctx

logger = logging.getLogger(__name__)


def call(call, mem):
    try:
        mem.store.save_user_info(
            UserInfo(
                name=call.input.get("name"),
                company=call.input.get("company"),
                role=call.input.get("role"),
            )
        )
        status = "ok"
    except Exception as e:
        logger.error("Failed to store user info: %s", e, **log_ctx(session_id=mem.session_id))
        status = "error"
    return {
        "type": "tool_result",
        "tool_use_id": call.id,
        "content": [{"type": "text", "text": status}],
    }
