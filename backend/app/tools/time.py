from __future__ import annotations

from datetime import datetime, timezone
from typing_extensions import Annotated
from pydantic import BaseModel
from haystack.tools import tool
from zoneinfo import ZoneInfo


class TimeResult(BaseModel):
    value: str


def _to_iso(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat().replace("+00:00", "Z")


def _parse_iso(s: str) -> datetime:
    s = s.strip()
    if s.endswith("Z"):
        s = s.replace("Z", "+00:00")
    return datetime.fromisoformat(s)


class TimeTools:
    @tool(
        name="get_current_time",
        description="Get the current datetime in a timezone. "
                    "Args: timezone (IANA, optional; default=system/UTC). Returns ISO-8601."
    )
    def get_current_time(
        self,
        timezone_name: Annotated[str, "IANA timezone like 'Europe/Lisbon'"] = "UTC",
    ) -> TimeResult:
        try:
            tz = ZoneInfo(timezone_name)
        except Exception:
            raise ValueError(f"Unknown timezone: {timezone_name}")
        now = datetime.now(tz)
        return TimeResult(value=_to_iso(now))

    @tool(
        name="convert_time",
        description="Convert an ISO-8601 datetime from one timezone to another. "
                    "Args: datetime_iso, from_tz, to_tz. Returns ISO-8601."
    )
    def convert_time(
        self,
        datetime_iso: Annotated[str, "ISO-8601 input, e.g., 2025-08-11T14:00:00Z"],
        from_tz: Annotated[str, "Source IANA timezone"],
        to_tz: Annotated[str, "Target IANA timezone"],
    ) -> TimeResult:
        try:
            src = ZoneInfo(from_tz)
            dst = ZoneInfo(to_tz)
        except Exception as e:
            raise ValueError(f"Invalid timezone: {e}")

        dt = _parse_iso(datetime_iso)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=src)
        else:
            dt = dt.astimezone(src)

        converted = dt.astimezone(dst)
        return TimeResult(value=_to_iso(converted))
