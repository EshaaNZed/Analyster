"""
Claims Intelligence Microservice — FastAPI Application
======================================================
Production-grade asynchronous API server powering the Reviewer Dashboard.
Features:
  - CORS support for React frontend
  - Auto-generated OpenAPI/Swagger docs
  - Lazy-loaded ML models and agent initialization
  - Structured error handling
"""
import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure project root is on sys.path for clean imports
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.api.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Pre-warms the orchestrator and knowledge stores on startup so the
    first /analyze request doesn't incur cold-start latency.
    """
    print("[API] Starting Claims Intelligence Microservice...")
    print(f"[API] Project root: {PROJECT_ROOT}")
    print(f"[API] Database: data/processed/claims_intelligence.db")

    # Pre-warm heavy components in background (non-blocking)
    try:
        from backend.api.routes import _get_orchestrator
        print("[API] Pre-warming multi-agent orchestrator...")
        _get_orchestrator()
        print("[API] Orchestrator ready.")
    except Exception as e:
        print(f"[API] WARNING: Orchestrator pre-warm failed: {e}")

    try:
        from backend.agents.llm_service import get_llm_service
        print("[API] Pre-warming LLM service...")
        get_llm_service()
        print("[API] LLM service ready.")
    except Exception as e:
        print(f"[API] WARNING: LLM service pre-warm failed: {e}")

    print("[API] Claims Intelligence API is LIVE.")
    print("[API] Swagger docs: http://localhost:8000/docs")
    print("[API] ReDoc:       http://localhost:8000/redoc")

    yield  # App runs here

    print("[API] Shutting down Claims Intelligence Microservice...")


# ─── Create FastAPI Application ──────────────────────────────────────────────

app = FastAPI(
    title="Claims Intelligence API",
    description=(
        "AI-Powered Insurance Claims Intelligence Assistant — "
        "Multi-Agent analysis engine with Hybrid Graph-RAG retrieval, "
        "ensemble risk scoring, anomaly detection, and explainable evidence grounding."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS Configuration (allows React dev server) ───────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # Alternative React port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Mount Routes ────────────────────────────────────────────────────────────

app.include_router(router, prefix="/api")


from fastapi.staticfiles import StaticFiles

# ─── Static Frontend (Vanilla HTML, CSS, JS) ─────────────────────────────────
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")
if os.path.isdir(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")


# ─── Direct Execution ───────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[os.path.join(PROJECT_ROOT, "backend")],
    )
