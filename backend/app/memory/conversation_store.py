import logging
import os
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

import boto3
from boto3.dynamodb.conditions import Key
import ulid

DYNAMODB_TABLE = os.environ.get("DYNAMODB_TABLE", "Conversations")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(DYNAMODB_TABLE)

SUMMARY_ID = "SUMMARY"
META_ID = "META"


@dataclass
class Message:
    session_id: str
    message_id: str
    role: str
    content: str
    timestamp: str


@dataclass
class UserInfo:
    ip: str | None = None
    country: str | None = None
    city: str | None = None
    postal_code: str | None = None
    time_zone: str | None = None
    name: str | None = None
    company: str | None = None
    role: str | None = None


class ConversationStore:
    """
    Wrapper over a DynamoDB table with generic ``PK``/``SK`` keys.

    Chat history items: ``SK = "MSG#<id>"``
    The running summary: ``SK = "SUMMARY"``
    Session metadata: ``SK = "META"``.
    """

    def __init__(self, session_id: Optional[str] = None):
        self.session_id = session_id or str(ulid.new())
        self.logger = logging.getLogger(__name__)

    # ---------------------------------------------------------------------
    # Message‑level operations
    # ---------------------------------------------------------------------
    def add_message(self, role: str, content: str) -> None:
        timestamp = datetime.utcnow().isoformat()
        message_id = str(ulid.new())
        self.logger.debug("add_message session=%s role=%s", self.session_id, role)

        table.put_item(
            Item={
                "PK": self.session_id,
                "SK": f"MSG#{message_id}",
                "role": role,
                "content": content,
                "timestamp": timestamp,
            }
        )

    def get_conversation(self) -> List[Message]:
        """Return chat messages"""
        resp = table.query(
            KeyConditionExpression=Key("PK").eq(self.session_id),
            ScanIndexForward=True,  # old‑>new
        )
        items = [
            item
            for item in resp.get("Items", [])
            if item["SK"] not in (SUMMARY_ID, META_ID)
               and item.get("content")
        ]

        return [
            Message(
                session_id=item["PK"],
                message_id=item["SK"][4:],
                role=item["role"],
                content=item["content"],
                timestamp=item["timestamp"],
            )
            for item in items
        ]

    def clear_conversation(self) -> None:
        """Delete all items for this session, including the summary."""
        resp = table.query(KeyConditionExpression=Key("PK").eq(self.session_id))
        with table.batch_writer() as batch:
            for itm in resp.get("Items", []):
                batch.delete_item(
                    Key={"PK": itm["PK"], "SK": itm["SK"]}
                )

    def get_summary(self) -> Optional[str]:
        """Fetch the running summary"""
        resp = table.get_item(Key={"PK": self.session_id, "SK": SUMMARY_ID})
        return resp.get("Item", {}).get("content")

    def save_summary(self, text: str) -> None:
        """Create or overwrite the session's running summary"""
        timestamp = datetime.utcnow().isoformat()
        self.logger.debug("save_summary session=%s len=%d", self.session_id, len(text))

        table.put_item(
            Item={
                "PK": self.session_id,
                "SK": SUMMARY_ID,
                "role": "summary",
                "content": text,
                "timestamp": timestamp,
            }
        )

    def save_user_info(self, info: UserInfo) -> None:
        existing = self.get_user_info() or UserInfo()
        item = {
            "PK": self.session_id,
            "SK": META_ID,
            "ip": info.ip if info.ip is not None else existing.ip,
            "country": info.country if info.country is not None else existing.country,
            "city": info.city if info.city is not None else existing.city,
            "postal_code": info.postal_code if info.postal_code is not None else existing.postal_code,
            "time_zone": info.time_zone if info.time_zone is not None else existing.time_zone,
            "name": info.name if info.name is not None else getattr(existing, "name", None),
            "company": info.company if info.company is not None else getattr(existing, "company", None),
            "role": info.role if info.role is not None else getattr(existing, "role", None),
        }
        table.put_item(Item=item)

    def get_user_info(self) -> UserInfo | None:
        resp = table.get_item(Key={"PK": self.session_id, "SK": META_ID})
        item = resp.get("Item")
        if not item:
            return None
        return UserInfo(
            ip=item.get("ip"),
            country=item.get("country"),
            city=item.get("city"),
            postal_code=item.get("postal_code"),
            time_zone=item.get("time_zone"),
            name=item.get("name"),
            company=item.get("company"),
            role=item.get("role"),
        )
