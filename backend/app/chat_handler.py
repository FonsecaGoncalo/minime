import json
import logging
from queue import SimpleQueue
from threading import Thread
from typing import TypedDict

from utils import notifications, error_messages
from tracing import init_tracing, tracer
from token_bucket import TokenBucket, TokenBucketConfig

import boto3

from agents.chat_agent import chat

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
init_tracing("chat_handler")

_RATE_LIMITER = TokenBucket(TokenBucketConfig(4, 6))


class _Operation(TypedDict):
    type: str
    payload: str | None


class OutboundMessenger:
    def __init__(self, endpoint_url: str, connection_id: str) -> None:
        self.operations = SimpleQueue[_Operation]()
        self.endpoint_url = endpoint_url
        self.connection_id = connection_id

    def run(self) -> None:
        apigw_client = boto3.client("apigatewaymanagementapi", endpoint_url=self.endpoint_url)

        while True:
            operation = self.operations.get()

            if operation["type"] == "message":
                apigw_client.post_to_connection(
                    ConnectionId=self.connection_id,
                    Data=json.dumps({
                        "op": "message_chunk",
                        "content": operation["payload"],
                    }),
                )
            elif operation["type"] == "finish":
                apigw_client.post_to_connection(
                    ConnectionId=self.connection_id,
                    Data=json.dumps({
                        "op": "finish",
                    }),
                )
                break
            elif operation["type"] == "error":
                apigw_client.post_to_connection(
                    ConnectionId=self.connection_id,
                    Data=json.dumps({
                        "op": "error",
                        "message": operation["payload"],
                    }),
                )
                break

    def error(self, payload: str | None) -> None:
        self.operations.put(_Operation(
            type="error",
            payload=payload,
        ))

    def message(self, payload: str) -> None:
        self.operations.put(_Operation(
            type="message",
            payload=payload,
        ))

    def finish(self) -> None:
        self.operations.put(_Operation(type="finish", payload=None))


def handler(event, context):
    with tracer.start_as_current_span("handler"):
        logger.info("Received event: " + json.dumps(event, indent=2))

        route_key = event["requestContext"]["routeKey"]

        if route_key == "$connect":
            connection_id = event["requestContext"]["connectionId"]
            headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}

            ip = headers.get("x-forwarded-for") or event["requestContext"].get("identity", {}).get("sourceIp")
            ip = ip.split(",")[0].strip() if ip else None

            try:
                notifications.send_conversation_start_event(
                    connection_id,
                    ip=ip
                )
            except Exception as e:
                logger.warning("Failed to dispatch conversation start event: %s", e)

            return {"statusCode": 200, "body": "Connected"}
        elif route_key == "$disconnect":
            connection_id = event["requestContext"]["connectionId"]
            try:
                notifications.send_conversation_end_event(connection_id)
            except Exception as e:
                logger.warning("Notification dispatch failed: %s", e)
            return {"statusCode": 200, "body": "Disconnected"}

        ip = event["requestContext"].get("identity", {}).get("sourceIp")
        connection_id = event["requestContext"]["connectionId"]
        domain_name = event["requestContext"]["domainName"]

        endpoint_url = f"https://{domain_name}"

        outbound_messenger = OutboundMessenger(endpoint_url, connection_id)

        raw_body = event.get("body", "") or "{}"
        try:
            body = json.loads(raw_body)
            message_text = body.get("message", "")
        except json.JSONDecodeError:
            message_text = ""

        messenger_thread = Thread(
            target=lambda: outbound_messenger.run(),
            daemon=True,
        )

        messenger_thread.start()

        try:
            if _RATE_LIMITER.should_throttle(ip or connection_id):
                outbound_messenger.error(error_messages.get_rate_limit_message())
                logger.info("Rate limit exceeded for %s", ip)
                return {"statusCode": 429, "body": "Rate limit exceeded"}

            logger.info("chat: %s", message_text)
            chat(connection_id, message_text, on_stream=lambda chunk: outbound_messenger.message(payload=chunk))

            return {"statusCode": 200}
        except Exception as e:
            logger.exception("Unexpected exception: %s", e)
            outbound_messenger.error(error_messages.get_generic_error_message())
            return {
                "statusCode": 500,
                "body": json.dumps(
                    {
                        "status": "ERROR",
                        "reason": str(e),
                    }
                ),
            }
        finally:
            outbound_messenger.finish()
            messenger_thread.join(timeout=60)
