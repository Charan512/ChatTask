"""
main.py — FastAPI application entry point.

Startup sequence:
  1. Load .env and validate all required keys (via config.py import).
  2. Configure CORS middleware using FRONTEND_URL from env.
  3. Mount all routers.
  4. Expose a health-check endpoint for Render's uptime monitoring.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importing config triggers the _require() guard at module load time.
# If any required env var is missing, the server will refuse to start.
from config import FRONTEND_URL
from routers.chat import router as chat_router

# ── App instance ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="Multilingual Voice Bot API",
    description=(
        "FastAPI backend for a real-time Hindi/Telugu voice bot. "
        "Powered by Groq LLM and Bhashini STT/TTS."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Middleware ───────────────────────────────────────────────────────────
# FRONTEND_URL is loaded from .env — never hardcoded.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(chat_router)


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["meta"])
async def health_check() -> dict:
    """
    Simple liveness probe for Render / load balancers.
    Returns 200 OK when the server is up and all env vars are loaded.
    """
    return {"status": "ok", "message": "Voice Bot API is running."}
