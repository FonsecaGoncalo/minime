import json
import logging
import os
from datetime import datetime, timedelta

from tracing import tracer

from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/calendar"]
SERVICE_ACCOUNT_JSON = os.environ.get("GOOGLE_SERVICE_ACCOUNT")
CALENDAR_ID = "primary"

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def schedule_meeting(start_time: datetime, duration_minutes: int, summary: str, email: str) -> str:
    """Create a Google Calendar event and return the event link."""
    logger.info("Creating Google Calendar event")

    if SERVICE_ACCOUNT_JSON is None or CALENDAR_ID is None:
        raise RuntimeError("Google Calendar credentials not configured")

    with tracer.start_as_current_span("schedule_meeting"):
        service_account_info = json.loads(SERVICE_ACCOUNT_JSON)

        creds = service_account.Credentials.from_service_account_info(
            service_account_info, scopes=SCOPES
        ).with_subject(os.environ.get("SES_TO_EMAIL"))

        service = build("calendar", "v3", credentials=creds)

        end_time = start_time + timedelta(minutes=duration_minutes)
        event_body = {
            "summary": summary,
            "start": {
                "dateTime": start_time.isoformat(),
                "timeZone": "UTC",
            },
            "end": {
                "dateTime": end_time.isoformat(),
                "timeZone": "UTC",
            },
            "attendees": [{"email": email}],
        }

        logger.info(event_body)

        event = (
            service.events()
            .insert(calendarId=CALENDAR_ID, body=event_body, sendUpdates="all")
            .execute()
        )
        return event.get("htmlLink")
