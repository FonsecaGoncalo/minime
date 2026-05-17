import json
import logging
import uuid
from queue import SimpleQueue
from threading import Thread
from typing import TypedDict

from utils import error_messages
from services import notifications
from tracing import init_tracing, tracer
from rate_limiter.token_bucket import TokenBucket, TokenBucketConfig

import boto3

from agents.chat_agent import chat

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
init_tracing("chat_handler")

_RATE_LIMITER = TokenBucket(TokenBucketConfig(4, 6))


class _Operation(TypedDict, total=False):
    type: str
    payload: str | None
    seq: int
    turn_id: str
    final: bool


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
            elif operation["type"] == "tool_use":
                apigw_client.post_to_connection(
                    ConnectionId=self.connection_id,
                    Data=json.dumps({
                        "op": "tool_use",
                        "name": operation["payload"],
                    }),
                )
            elif operation["type"] == "audio_chunk":
                apigw_client.post_to_connection(
                    ConnectionId=self.connection_id,
                    Data=json.dumps({
                        "op": "audio_chunk",
                        "turn_id": operation["turn_id"],
                        "seq": operation["seq"],
                        "b64_mp3": operation["payload"],
                        "final": operation.get("final", False),
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

    def tool_use(self, name: str) -> None:
        self.operations.put(_Operation(
            type="tool_use",
            payload=name,
        ))

    def audio_chunk(self, turn_id: str, seq: int, b64_mp3: str, final: bool) -> None:
        self.operations.put(_Operation(
            type="audio_chunk",
            payload=b64_mp3,
            turn_id=turn_id,
            seq=seq,
            final=final,
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
            voice = bool(body.get("voice", False))
        except json.JSONDecodeError:
            message_text = ""
            voice = False

        turn_id = uuid.uuid4().hex
        audio_seq = {"n": 0}

        def emit_audio(b64_mp3: str, final: bool) -> None:
            seq = audio_seq["n"]
            audio_seq["n"] += 1
            outbound_messenger.audio_chunk(turn_id, seq, b64_mp3, final)

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

            logger.info("chat: %s (voice=%s)", message_text, voice)
            chat(
                connection_id,
                message_text,
                on_stream=lambda chunk: outbound_messenger.message(payload=chunk),
                on_tool=lambda name: outbound_messenger.tool_use(name=name),
                on_audio=emit_audio if voice else None,
            )

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
