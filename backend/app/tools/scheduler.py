import logging
from datetime import datetime

from google_calendar import schedule_meeting
from tracing_utils import log_ctx

logger = logging.getLogger(__name__)


def call(call, on_stream, mem, user_msg):
    try:
        link = schedule_meeting(
            datetime.fromisoformat(call.input["start_time"]),
            call.input["duration_minutes"],
            call.input["summary"],
            call.input["email"],
        )
    except Exception as e:
        logger.error("Failed to schedule meeting: %s", e, **log_ctx(session_id=mem.session_id), exc_info=e)
        error_text = (
            "Sorry, something went wrong while scheduling the meeting. "
            "Please contact the real Gonçalo to arrange it."
        )
        for chunk in error_text:
            on_stream(chunk)
        mem.save_turn(user_msg=user_msg, assistant_msg=error_text)
        return None
    return {
        "type": "tool_result",
        "tool_use_id": call.id,
        "content": [{"type": "text", "text": link}],
    }
