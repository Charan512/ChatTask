"""
services/llm.py — Groq LLM service for Hindi/Telugu mixed-language responses.

Uses the Groq Python SDK with the llama-3.3-70b-versatile model.
Conversation history is passed as a list of messages to maintain multi-turn context.
"""

from __future__ import annotations

from groq import Groq

from config import GROQ_API_KEY

# ── Model configuration ──────────────────────────────────────────────────────
_MODEL = "llama-3.3-70b-versatile"

_SYSTEM_PROMPT = (
    "You are a supportive assistant. "
    "Reply ONLY in a natural conversational mix of Hindi and Telugu. "
    "Keep responses under 3 sentences for fast voice synthesis."
)

# ── Groq client (module-level singleton) ─────────────────────────────────────
_client = Groq(api_key=GROQ_API_KEY)


def build_message_history(history: list[dict]) -> list[dict]:
    """
    Convert stored DB messages into the OpenAI-compatible message format
    that Groq's Chat Completions API expects.

    Args:
        history: List of message dicts with keys 'sender' and 'transcript'.

    Returns:
        List of {'role': ..., 'content': ...} dicts.
    """
    messages = [{"role": "system", "content": _SYSTEM_PROMPT}]
    for msg in history:
        role = "user" if msg["sender"] == "user" else "assistant"
        messages.append({"role": role, "content": msg["transcript"]})
    return messages


def get_llm_response(user_text: str, history: list[dict] | None = None) -> str:
    """
    Send the user's transcribed text to Groq and return the assistant's reply.

    Args:
        user_text:  The latest user utterance (already transcribed from audio).
        history:    Previous messages in this session (for multi-turn context).

    Returns:
        The assistant's reply as a plain string (Hindi + Telugu mix).

    Raises:
        RuntimeError: If the Groq API call fails.
    """
    # Build conversation context from history, then append the new user turn
    messages = build_message_history(history or [])
    messages.append({"role": "user", "content": user_text})

    try:
        completion = _client.chat.completions.create(
            model=_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=256,  # Keep short for fast TTS synthesis
        )
        return completion.choices[0].message.content.strip()
    except Exception as exc:
        raise RuntimeError(f"[LLM ERROR] Groq API call failed: {exc}") from exc
