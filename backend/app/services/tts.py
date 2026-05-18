from __future__ import annotations

import json
import logging
import os
import re
import urllib.error
import urllib.request

logger = logging.getLogger(__name__)

_ELEVENLABS_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
_MODEL_ID = "eleven_turbo_v2_5"
_SENTENCE_BOUNDARY = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9\"'(\[])|(?<=[.!?])\n+|\n{2,}")
_MIN_SENTENCE_CHARS = 12


class SentenceBuffer:
    """Splits a streaming token feed into sentence-sized chunks for TTS."""

    def __init__(self) -> None:
        self._buf = ""

    def feed(self, chunk: str) -> list[str]:
        self._buf += chunk
        out: list[str] = []
        while True:
            match = _SENTENCE_BOUNDARY.search(self._buf)
            if not match:
                break
            head = self._buf[: match.end()].strip()
            tail = self._buf[match.end():]
            if len(head) >= _MIN_SENTENCE_CHARS:
                out.append(head)
                self._buf = tail
            else:
                break
        return out

    def flush(self) -> str | None:
        remaining = self._buf.strip()
        self._buf = ""
        return remaining or None


def synthesize(text: str) -> bytes | None:
    """Synthesize a single chunk of text and return MP3 bytes, or None on failure."""
    api_key = os.environ.get("ELEVENLABS_API_KEY")
    voice_id = os.environ.get("ELEVENLABS_VOICE_ID")
    if not api_key or not voice_id:
        logger.warning("ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID missing")
        return None

    body = json.dumps({
        "text": text,
        "model_id": _MODEL_ID,
        "output_format": "mp3_44100_128",
        "voice_settings": {"stability": 0.5, "similarity_boost": 1.0, "speed": 1.0},
    }).encode("utf-8")
    req = urllib.request.Request(
        _ELEVENLABS_URL.format(voice_id=voice_id),
        data=body,
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.read()
    except urllib.error.HTTPError as e:
        logger.warning("ElevenLabs HTTPError %s: %s", e.code, e.read()[:200])
    except Exception as e:
        logger.warning("ElevenLabs request failed: %s", e)
    return None
