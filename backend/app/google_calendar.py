import json
import logging
import os
from datetime import datetime, timedelta
from uuid import uuid4

from tracing import tracer

from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession

SCOPES = ["https://www.googleapis.com/auth/calendar"]
SERVICE_ACCOUNT_JSON = os.environ.get("GOOGLE_SERVICE_ACCOUNT")  # JSON string
IMPERS_USER = os.environ.get("SES_TO_EMAIL")  # user to impersonate (domain-wide delegation)
CALENDAR_ID = os.environ.get("GOOGLE_CALENDAR_ID", "primary")

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def _authorized_session() -> AuthorizedSession:
    if not SERVICE_ACCOUNT_JSON:
        raise RuntimeError("Missing GOOGLE_SERVICE_ACCOUNT (service account JSON).")
    if not IMPERS_USER:
        raise RuntimeError("Missing SES_TO_EMAIL (user to impersonate).")

    service_account_info = json.loads(SERVICE_ACCOUNT_JSON)
    creds = service_account.Credentials.from_service_account_info(
        service_account_info, scopes=SCOPES
    ).with_subject(IMPERS_USER)

    return AuthorizedSession(creds)


def _extract_meet_link(event: dict) -> str | None:
    link = event.get("hangoutLink")
    if link:
        return link

    conf = event.get("conferenceData") or {}
    for ep in conf.get("entryPoints", []):
        if ep.get("entryPointType") == "video" and ep.get("uri"):
            return ep["uri"]
    return None


def schedule_meeting(
        start_time: datetime,
        duration_minutes: int,
        summary: str,
        email: str,
) -> str:
    """
    Create a Calendar event with a Google Meet link and invite the attendee.

    Returns:
        {
            "event_link": <calendar event HTML link>,
            "meet_link": <Google Meet URL or None>,
            "event_id": <event id>
        }
    """
    logger.info("Creating Google Calendar event (Meet enabled)")
    with tracer.start_as_current_span("schedule_meeting"):
        authed = _authorized_session()

        end_time = start_time + timedelta(minutes=duration_minutes)

        body = {
            "summary": summary,
            "start": {"dateTime": start_time.isoformat(), "timeZone": "UTC"},
            "end": {"dateTime": end_time.isoformat(), "timeZone": "UTC"},
            "attendees": [{"email": email}],
            "conferenceData": {
                "createRequest": {
                    "requestId": str(uuid4()),
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            },
        }

        url = (
            f"https://www.googleapis.com/calendar/v3/calendars/{CALENDAR_ID}/events"
            "?sendUpdates=all&conferenceDataVersion=1"
        )
        resp = authed.post(url, json=body)

        if not resp.ok:
            raise RuntimeError(f"Calendar API error {resp.status_code}: {resp.text}")

        event = resp.json()
        result = {
            "event_link": event.get("htmlLink"),
            "meet_link": _extract_meet_link(event),
            "event_id": event.get("id"),
        }
        logger.info("Event created: %s", result["event_id"])
        return result["event_link"]
