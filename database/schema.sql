-- ============================================================
-- Voice Bot — Supabase Schema
-- Run this once in the Supabase Dashboard > SQL Editor
-- ============================================================

-- ── sessions table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sessions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identifier  TEXT NOT NULL DEFAULT 'anonymous',
    started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active        BOOLEAN NOT NULL DEFAULT TRUE
);

-- ── messages table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
    id                BIGSERIAL PRIMARY KEY,
    session_id        UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    sender            TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
    transcript        TEXT NOT NULL,
    language_detected TEXT DEFAULT 'hi-te-mix',
    metadata          JSONB DEFAULT '{}',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes for performance ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
