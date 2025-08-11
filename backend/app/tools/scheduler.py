import logging
from datetime import datetime
from typing import Annotated

from haystack.tools import tool

from google_calendar import schedule_meeting

logger = logging.getLogger(__name__)


class ScheduleMeeting:

    @tool(
        name="schedule_meeting",
        description="Schedule a meeting via google calendar",
    )
    def __call__(self,
                 start_time: Annotated[datetime, "Meeting start time"],
                 duration: Annotated[int, "Meeting Duration in minutes"],
                 summary: Annotated[str, "Meeting summary"],
                 email: Annotated[str, "Attendee email"]):
        try:
            meeting_link = schedule_meeting(
                start_time=start_time,
                duration_minutes=duration,
                summary=summary,
                email=email)
            return {
                "link": meeting_link,
            }
        except Exception as e:
            logger.error(e)
            return "Failed to schedule meeting."

