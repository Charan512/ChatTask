"""
routers/chat.py — API routes for the Voice Bot.

Endpoints
---------
POST /speak
    The main voice pipeline:
    Audio (Base64) → Bhashini STT → Groq LLM → Bhashini TTS → Audio (Base64)
    Persists both the user message and the bot response to Supabase.

GET /history/{session_id}
    Returns the last 20 messages for a given session (oldest → newest).
"""

from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from database import get_supabase_client, get_or_create_session, save_message, fetch_session_history
from services.audio import speech_to_text, text_to_speech
from services.llm import get_llm_response

router = APIRouter(prefix="/api", tags=["chat"])


# ── Request / Response schemas ───────────────────────────────────────────────

class SpeakRequest(BaseModel):
    session_id: str = Field(..., description="Client-generated UUID for the conversation session.")
    audio_base64: str = Field(..., description="Microphone audio encoded as a Base64 string.")


class SpeakResponse(BaseModel):
    audio: str = Field(..., description="Bot's synthesised voice reply as Base64.")
    text: str = Field(..., description="Bot's text reply (Hindi + Telugu mix).")
    session_id: str = Field(..., description="Echo of the session_id for client confirmation.")


class HistoryResponse(BaseModel):
    session_id: str
    messages: list[dict[str, Any]]


class ChatRequest(BaseModel):
    session_id: str = Field(..., description="Client-generated UUID for the conversation session.")
    text: str = Field(..., description="User's text input.")


class ChatResponse(BaseModel):
    text: str = Field(..., description="Bot's text reply.")
    session_id: str = Field(..., description="Echo of the session_id for client confirmation.")


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/speak", response_model=SpeakResponse)
async def speak(request: SpeakRequest) -> SpeakResponse:
    """
    Main voice pipeline endpoint.

    Pipeline steps:
      1. Validate session (create if new).
      2. Bhashini STT  → transcribe audio to text.
      3. Fetch session history for multi-turn LLM context.
      4. Groq LLM      → generate Hindi/Telugu text response.
      5. Bhashini TTS  → synthesise response to audio Base64.
      6. Persist user message + bot message to Supabase.
      7. Return { audio, text, session_id }.
    """
    pipeline_start = time.monotonic()
    client = get_supabase_client()

    # ── Step 1: Get or create session ───────────────────────────────────────
    try:
        await get_or_create_session(client, request.session_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Session error: {exc}")

    # ── Step 2: Speech-to-Text ──────────────────────────────────────────────
    try:
        stt_start = time.monotonic()
        user_text = await speech_to_text(request.audio_base64)
        stt_latency_ms = round((time.monotonic() - stt_start) * 1000)
    except RuntimeError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    # ── Step 3: Fetch conversation history for context ──────────────────────
    try:
        history = await fetch_session_history(client, request.session_id, limit=20)
    except Exception:
        history = []  # Non-fatal — proceed without history if DB read fails

    # ── Step 4: LLM Response ─────────────────────────────────────────────────
    try:
        llm_start = time.monotonic()
        bot_text = get_llm_response(user_text, history)
        llm_latency_ms = round((time.monotonic() - llm_start) * 1000)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    # ── Step 5: Text-to-Speech ───────────────────────────────────────────────
    try:
        tts_start = time.monotonic()
        audio_base64 = await text_to_speech(bot_text)
        tts_latency_ms = round((time.monotonic() - tts_start) * 1000)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    total_latency_ms = round((time.monotonic() - pipeline_start) * 1000)

    # ── Step 6: Persist to Supabase ──────────────────────────────────────────
    try:
        await save_message(
            client,
            session_id=request.session_id,
            sender="user",
            transcript=user_text,
            metadata={"stt_latency_ms": stt_latency_ms},
        )
        await save_message(
            client,
            session_id=request.session_id,
            sender="bot",
            transcript=bot_text,
            metadata={
                "llm_latency_ms": llm_latency_ms,
                "tts_latency_ms": tts_latency_ms,
                "total_latency_ms": total_latency_ms,
            },
        )
    except Exception as exc:
        # Log but don't fail the request — audio response is already ready
        print(f"[DB WARNING] Failed to persist messages: {exc}")

    # ── Step 7: Return response ──────────────────────────────────────────────
    return SpeakResponse(
        audio=audio_base64,
        text=bot_text,
        session_id=request.session_id,
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Text-only pipeline endpoint.
    """
    pipeline_start = time.monotonic()
    client = get_supabase_client()

    # ── Step 1: Get or create session
    try:
        await get_or_create_session(client, request.session_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Session error: {exc}")

    # ── Step 2: Fetch history
    try:
        history = await fetch_session_history(client, request.session_id, limit=20)
    except Exception:
        history = []

    # ── Step 3: LLM Response
    try:
        llm_start = time.monotonic()
        bot_text = get_llm_response(request.text, history)
        llm_latency_ms = round((time.monotonic() - llm_start) * 1000)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    total_latency_ms = round((time.monotonic() - pipeline_start) * 1000)

    # ── Step 4: Persist to Supabase
    try:
        await save_message(
            client,
            session_id=request.session_id,
            sender="user",
            transcript=request.text,
            metadata={"is_text_input": True},
        )
        await save_message(
            client,
            session_id=request.session_id,
            sender="bot",
            transcript=bot_text,
            metadata={
                "llm_latency_ms": llm_latency_ms,
                "total_latency_ms": total_latency_ms,
            },
        )
    except Exception as exc:
        print(f"[DB WARNING] Failed to persist messages: {exc}")

    return ChatResponse(
        text=bot_text,
        session_id=request.session_id,
    )


@router.get("/history/{session_id}", response_model=HistoryResponse)
async def get_history(session_id: str) -> HistoryResponse:
    """
    Return the last 20 messages for the given session (chronological order).
    """
    client = get_supabase_client()

    try:
        messages = await fetch_session_history(client, session_id, limit=20)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {exc}")

    return HistoryResponse(session_id=session_id, messages=messages)
