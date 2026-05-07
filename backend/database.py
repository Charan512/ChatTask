"""
database.py — Async SQLModel / PostgreSQL connection layer via Supabase.

Tables
------
sessions  — one row per conversation (UUID PK, user_identifier, timestamps).
messages  — one row per chat turn (serial PK, FK → sessions, JSONB metadata).

Client strategy
---------------
All DML (insert / select) uses the supabase-py REST client (PostgREST) so we
benefit from Row-Level Security without writing raw SQL.

DATABASE_POOLER_URL is imported from config for use with SQLAlchemy engines or
migration tools (e.g. Alembic). It points to Supabase's Supavisor pooler on
port 6543 (Transaction Mode), which is reachable over IPv4 — required on Render.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from sqlmodel import Field, SQLModel, Column
from sqlalchemy import JSON
from supabase import create_client, Client

from config import SUPABASE_URL, SUPABASE_KEY, DATABASE_POOLER_URL  # noqa: F401
# DATABASE_POOLER_URL is available here for:
#   • SQLAlchemy engine creation  (e.g. create_async_engine(DATABASE_POOLER_URL))
#   • Alembic migrations          (reference it in alembic/env.py)
# The supabase-py REST client below does NOT use it — it uses SUPABASE_URL/KEY.


# ── ORM Models (for type safety and documentation) ──────────────────────────

class Session(SQLModel, table=True):
    """Represents a single user conversation session."""
    __tablename__ = "sessions"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
    )
    user_identifier: str = Field(default="anonymous")
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = Field(default=True)


class Message(SQLModel, table=True):
    """Represents a single turn in a conversation (user or bot)."""
    __tablename__ = "messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: uuid.UUID = Field(foreign_key="sessions.id", index=True)
    sender: str = Field(description="Enum: 'user' | 'bot'")
    transcript: str
    language_detected: Optional[str] = Field(default="hi-te-mix")
    meta_data: Optional[dict] = Field(default=None, sa_column=Column("metadata", JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ── Supabase Client Singleton ────────────────────────────────────────────────

def get_supabase_client() -> Client:
    """Return an authenticated Supabase client instance."""
    return create_client(SUPABASE_URL, SUPABASE_KEY)


# ── Database Helper Functions ────────────────────────────────────────────────

async def get_or_create_session(client: Client, session_id: str) -> dict:
    """
    Fetch an existing session by its UUID string.
    If it doesn't exist yet, insert a new row and return it.
    """
    result = (
        client.table("sessions")
        .select("*")
        .eq("id", session_id)
        .limit(1)
        .execute()
    )

    if result.data:
        return result.data[0]

    # Session doesn't exist — create it
    new_session = {
        "id": session_id,
        "user_identifier": "ghost_user",  # Ghost auth — no login required
        "started_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True,
    }
    insert_result = client.table("sessions").insert(new_session).execute()
    return insert_result.data[0]


async def save_message(
    client: Client,
    session_id: str,
    sender: str,
    transcript: str,
    metadata: Optional[dict[str, Any]] = None,
) -> dict:
    """
    Persist a single chat message to the messages table.

    Args:
        client:      Authenticated Supabase client.
        session_id:  UUID string of the parent session.
        sender:      'user' or 'bot'.
        transcript:  The text content of the message.
        metadata:    Optional JSONB payload (latency, confidence, etc.).
    """
    row = {
        "session_id": session_id,
        "sender": sender,
        "transcript": transcript,
        "language_detected": "hi-te-mix",
        "metadata": metadata or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = client.table("messages").insert(row).execute()
    return result.data[0]


async def fetch_session_history(client: Client, session_id: str, limit: int = 20) -> list[dict]:
    """
    Return the last `limit` messages for a given session, oldest-first.
    """
    result = (
        client.table("messages")
        .select("*")
        .eq("session_id", session_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    # Reverse so the response reads chronologically (oldest → newest)
    return list(reversed(result.data))
