from __future__ import annotations

import json
import logging
import os
from abc import ABC, abstractmethod
from collections.abc import Callable
from enum import Enum, auto

import anthropic
import boto3
from botocore.exceptions import ClientError
import httpx

logger = logging.getLogger(__name__)

anthropic_key = os.environ.get("ANTHROPIC_API_KEY")


class ProviderType(Enum):
    BEDROCK = auto()
    ANTHROPIC = auto()


class Model(Enum):
    BEDROCK_SONNET = (
        "eu.anthropic.claude-3-7-sonnet-20250219-v1:0",
        ProviderType.BEDROCK,
    )
    ANTHROPIC_SONNET = (
        "claude-4-sonnet-20250514",
        ProviderType.ANTHROPIC,
    )
    ANTHROPIC_HAIKU = (
        "claude-3-5-haiku-20241022",
        ProviderType.ANTHROPIC,
    )
    NOVA_MICRO = (
        "eu.amazon.nova-micro-v1:0",
        ProviderType.BEDROCK,
    )

    def __init__(self, model_id: str, provider: ProviderType) -> None:
        self.model_id = model_id
        self.provider = provider


class ChatProvider(ABC):
    supports_system: bool = True

    @abstractmethod
    def invoke(
            self,
            messages: list[dict[str, str]],
            *,
            max_tokens: int,
            temperature: float,
            top_p: float,
            tools: list[dict] | None = None,
    ) -> str:
        """Non-streaming invocation."""

    @abstractmethod
    def stream(
            self,
            messages: list[dict[str, str]],
            on_stream: Callable[[str], None],
            *,
            max_tokens: int,
            temperature: float,
            top_p: float,
            tools: list[dict] | None = None,
    ):
        """Stream and return the raw message."""
        raise NotImplementedError


class BedrockProvider(ChatProvider):
    supports_system = True

    def __init__(self, model_id: str, *, max_tokens: int, temperature: float, top_p: float) -> None:
        self.client = boto3.client("bedrock-runtime")
        self.model_id = model_id
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.top_p = top_p

    @staticmethod
    def _format_messages(messages: list[dict[str, str]]):
        system_msgs = [m["content"] for m in messages if m["role"] == "system"]
        convo = [m for m in messages if m["role"] != "system"]
        bedrock_msgs = [{"role": m["role"], "content": [{"text": m["content"]}]} for m in convo]
        system_block = None
        if system_msgs:
            system_block = [{"text": "\n".join(system_msgs)}]
        return system_block, bedrock_msgs

    def invoke(
            self,
            messages: list[dict[str, str]],
            *,
            max_tokens: int,
            temperature: float,
            top_p: float,
            tools: list[dict] | None = None,
    ) -> str:
        system_block, bedrock_msgs = self._format_messages(messages)
        try:
            params = {
                "modelId": self.model_id,
                "messages": bedrock_msgs,
                "inferenceConfig": {
                    "maxTokens": max_tokens,
                    "temperature": temperature,
                    "topP": top_p,
                },
            }
            if system_block is not None:
                params["system"] = system_block

            logger.info(f"Bedrock request: {json.dumps(params)}")
            resp = self.client.converse(**params)
            logger.info(f"Bedrock response: {json.dumps(resp)}")
            return resp["output"]["message"]["content"][0]["text"].strip()
        except (ClientError, Exception) as err:
            logger.error("Bedrock invoke failed: %s", err)
            raise

    def stream(
            self,
            messages: list[dict[str, str]],
            on_stream: Callable[[str], None],
            *,
            max_tokens: int,
            temperature: float,
            top_p: float,
            tools: list[dict] | None = None,
    ):
        if tools:
            logger.warning(
                "Bedrock streaming does not support tools. falling back to non-streaming"
            )
        msg = self.invoke(
            messages,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
            tools=tools,
        )
        for ch in msg:
            on_stream(ch)

        # Build a minimal message-like object
        class _Msg:
            def __init__(self, text: str) -> None:
                self.content = [type("_Block", (), {"type": "text", "text": text})()]
                self.stop_reason = "stop"

        return _Msg(msg)


class AnthropicProvider(ChatProvider):
    supports_system = True

    def __init__(self, model_id: str, *, max_tokens: int, temperature: float, top_p: float) -> None:
        self.client = anthropic.Anthropic(api_key=anthropic_key, http_client=httpx.Client())
        self.model_id = model_id
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.top_p = top_p

    @staticmethod
    def _split_system(messages: list[dict[str, str]]):
        system_msgs = [m["content"] for m in messages if m["role"] == "system"]
        convo = [m for m in messages if m["role"] != "system"]
        system_str = "\n".join(system_msgs) if system_msgs else None
        return system_str, [{"role": m["role"], "content": m["content"]} for m in convo]

    def invoke(
            self,
            messages: list[dict[str, str]],
            *,
            max_tokens: int,
            temperature: float,
            top_p: float,
            tools: list[dict] | None = None,
    ) -> str:
        system_str, anth_msgs = self._split_system(messages)
        try:
            resp = self.client.messages.create(
                model=self.model_id,
                system=system_str,
                messages=anth_msgs,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                tools=tools or None,
            )
            return resp.content[0].text
        except Exception as err:
            logger.error("Anthropic invoke failed: %s", err)
            raise

    def stream(
            self,
            messages: list[dict[str, str]],
            on_stream: Callable[[str], None],
            *,
            max_tokens: int,
            temperature: float,
            top_p: float,
            tools: list[dict] | None = None,
    ):
        system_str, anth_msgs = self._split_system(messages)
        try:
            with self.client.messages.stream(
                    model=self.model_id,
                    system=system_str,
                    messages=anth_msgs,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    top_p=top_p,
                    tools=tools or None,
            ) as stream:
                for event in stream:
                    if event.type == "content_block_delta" and event.delta.type == "text_delta":
                        on_stream(event.delta.text)
                    elif event.type == "content_block_start" and event.content_block.type in {"tool_use",
                                                                                              "server_tool_use"}:
                        break
                return stream.get_final_message()
        except Exception as err:
            logger.error("Anthropic invoke failed: %s", err)
            raise


def llm(
        model: Model,
        *,
        max_tokens: int,
        temperature: float,
        top_p: float,
) -> ChatProvider:
    if model.provider is ProviderType.ANTHROPIC:
        return AnthropicProvider(
            model_id=model.model_id,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
        )
    elif model.provider is ProviderType.BEDROCK:
        return BedrockProvider(
            model_id=model.model_id,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
        )
    else:
        raise ValueError(model.provider)
