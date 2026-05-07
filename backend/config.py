"""
config.py — Centralised environment variable loader.

Loaded once at startup. Any missing key raises RuntimeError immediately
so the server refuses to start with an incomplete configuration.
"""

import os
from dotenv import load_dotenv

load_dotenv()

def _require(key: str) -> str:
    """Return the value of an env variable or raise RuntimeError."""
    value = os.getenv(key)
    if not value:
        raise RuntimeError(
            f"[CONFIG ERROR] Required environment variable '{key}' is missing. "
            f"Please set it in your .env file."
        )
    return value


# ── Public settings (imported by other modules) ─────────────────────────────

# Groq LLM
GROQ_API_KEY: str           = _require("GROQ_API_KEY")

# Bhashini Speech Pipeline — all three fields are required by the ULCA API
BHASHINI_API_KEY: str       = _require("BHASHINI_API_KEY")
BHASHINI_USER_ID: str       = _require("BHASHINI_USER_ID")
BHASHINI_PIPELINE_ID: str   = _require("BHASHINI_PIPELINE_ID")

# Supabase — REST client uses URL + KEY; connection pooler URL used for direct DB
SUPABASE_URL: str           = _require("SUPABASE_URL")
SUPABASE_KEY: str           = _require("SUPABASE_KEY")
DATABASE_POOLER_URL: str    = _require("DATABASE_POOLER_URL")

# CORS & deployment
FRONTEND_URL: str           = _require("FRONTEND_URL")
PORT: int                   = int(os.getenv("PORT", "8000"))
