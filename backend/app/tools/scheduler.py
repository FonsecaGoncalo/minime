import logging
from datetime import datetime
from typing import Annotated

from haystack.tools import tool

from services import google_calendar

logger = logging.getLogger(__name__)


@tool(
    name="schedule_meeting",
    description="Schedule a meeting via google calendar",
)
def schedule_meeting(start_time: Annotated[str, "ISO 8601 date-time, e.g., 2025-08-11T14:00:00Z"],
                     duration: Annotated[int, "Meeting Duration in minutes"],
                     summary: Annotated[str, "Meeting summary"],
                     email: Annotated[str, "Attendee email"]):
    try:
        meeting_link = google_calendar.schedule_meeting(
            start_time=datetime.fromisoformat(start_time),
            duration_minutes=duration,
            summary=summary,
            email=email)
        return {
            "link": meeting_link,
        }
    except Exception as e:
        logger.error(e)
        return "Failed to schedule meeting."
