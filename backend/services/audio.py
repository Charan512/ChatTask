"""
services/audio.py — Bhashini STT and TTS service.

Handles all audio <-> text conversion using the Bhashini ULCA pipeline API.
Audio payloads are transported as Base64-encoded strings.

Bhashini Pipeline API reference:
  POST https://dhruva-api.bhashini.gov.in/services/inference/pipeline

The pipeline config below targets Hindi (hi) + Telugu (te) code-mixed speech.
Adjust `sourceLanguage` / `targetLanguage` codes for other language pairs.
"""

from __future__ import annotations

import base64

import httpx

from config import BHASHINI_API_KEY, BHASHINI_USER_ID, BHASHINI_PIPELINE_ID

# ── Bhashini constants ───────────────────────────────────────────────────────
_BHASHINI_PIPELINE_URL = (
    "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
)

# Bhashini ULCA pipeline API authenticates via two headers:
#   userID      — your profile user ID
#   ulcaApiKey  — your ULCA API key
_HEADERS = {
    "userID": BHASHINI_USER_ID,
    "ulcaApiKey": BHASHINI_API_KEY,
    "Content-Type": "application/json",
}

# Source / target language codes recognised by Bhashini
_STT_LANGUAGE = "hi"   # Primary STT language (Hindi)
_TTS_LANGUAGE = "hi"   # Primary TTS language; bot replies are mainly Hindi-Telugu
_TTS_GENDER   = "female"


# ── Helper: Base64 utilities ─────────────────────────────────────────────────

def encode_audio_to_base64(audio_bytes: bytes) -> str:
    """Convert raw audio bytes to a Base64-encoded string."""
    return base64.b64encode(audio_bytes).decode("utf-8")


def decode_base64_to_audio(b64_string: str) -> bytes:
    """Convert a Base64-encoded string back to raw audio bytes."""
    return base64.b64decode(b64_string)


# ── Speech-to-Text ───────────────────────────────────────────────────────────

async def speech_to_text(audio_base64: str) -> str:
    """
    Send Base64-encoded audio to Bhashini STT and return the transcript.

    Args:
        audio_base64: Microphone audio encoded as a Base64 string.

    Returns:
        Transcribed text string (Hindi / Telugu / code-mixed).

    Raises:
        RuntimeError: If Bhashini returns a non-200 status or empty transcript.
    """
    payload = {
        "pipelineRequestConfig": {
            "pipelineId": BHASHINI_PIPELINE_ID,
        },
        "pipelineTasks": [
            {
                "taskType": "asr",
                "config": {
                    "language": {"sourceLanguage": _STT_LANGUAGE},
                    "audioFormat": "wav",
                    "samplingRate": 16000,
                },
            }
        ],
        "inputData": {
            "audio": [{"audioContent": audio_base64}]
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(_BHASHINI_PIPELINE_URL, json=payload, headers=_HEADERS)

    if response.status_code != 200:
        raise RuntimeError(
            f"[BHASHINI STT ERROR] Status {response.status_code}: {response.text}"
        )

    data = response.json()
    try:
        transcript: str = (
            data["pipelineResponse"][0]["output"][0]["source"]
        )
    except (KeyError, IndexError) as exc:
        raise RuntimeError(
            f"[BHASHINI STT ERROR] Unexpected response structure: {data}"
        ) from exc

    if not transcript.strip():
        raise RuntimeError("[BHASHINI STT ERROR] Received empty transcript.")

    return transcript.strip()


# ── Text-to-Speech ───────────────────────────────────────────────────────────

async def text_to_speech(text: str) -> str:
    """
    Send text to Bhashini TTS and return the synthesised audio as Base64.

    Args:
        text: The assistant's reply (Hindi + Telugu code-mixed text).

    Returns:
        Base64-encoded audio string (WAV format).

    Raises:
        RuntimeError: If Bhashini returns a non-200 status or empty audio.
    """
    payload = {
        "pipelineRequestConfig": {
            "pipelineId": BHASHINI_PIPELINE_ID,
        },
        "pipelineTasks": [
            {
                "taskType": "tts",
                "config": {
                    "language": {"sourceLanguage": _TTS_LANGUAGE},
                    "gender": _TTS_GENDER,
                    "samplingRate": 8000,
                },
            }
        ],
        "inputData": {
            "input": [{"source": text}]
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(_BHASHINI_PIPELINE_URL, json=payload, headers=_HEADERS)

    if response.status_code != 200:
        raise RuntimeError(
            f"[BHASHINI TTS ERROR] Status {response.status_code}: {response.text}"
        )

    data = response.json()
    try:
        audio_base64: str = (
            data["pipelineResponse"][0]["audio"][0]["audioContent"]
        )
    except (KeyError, IndexError) as exc:
        raise RuntimeError(
            f"[BHASHINI TTS ERROR] Unexpected response structure: {data}"
        ) from exc

    if not audio_base64:
        raise RuntimeError("[BHASHINI TTS ERROR] Received empty audio payload.")

    return audio_base64
