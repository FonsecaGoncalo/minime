import json
import logging
import urllib.request

from conversation_store import UserInfo

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


API_URL = "http://ip-api.com/json/{ip}?fields=status,country,city,zip,timezone"


def lookup(ip: str) -> UserInfo | None:
    """Look up geolocation information for ip"""
    url = API_URL.format(ip=ip)
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            data = json.load(resp)
    except Exception as exc:
        logger.warning("ip-api request failed: %s", exc)
        return None

    if data.get("status") != "success":
        logger.warning("ip-api lookup failed for %s: %s", ip, data)
        return None

    return UserInfo(
        ip=ip,
        country=data.get("country"),
        city=data.get("city"),
        postal_code=data.get("zip"),
        time_zone=data.get("timezone"),
    )
