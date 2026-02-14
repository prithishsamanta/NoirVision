"""
NoirVision backend: FastAPI app with TwelveLabs video analysis pipeline.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import videos

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Validate config on startup."""
    try:
        s = get_settings()
        s.require_s3()
        if not s.twelvelabs_mock:
            s.require_twelvelabs()
        logger.info("Config validated (mock=%s)", s.twelvelabs_mock)
    except ValueError as e:
        logger.error("Startup validation failed: %s", e)
        raise
    yield
    # Shutdown if needed
    pass


# TODO(production): Add auth dependency (e.g. JWT or API key) and use on protected routes.
# Demo mode: no auth; all routes are open.

app = FastAPI(
    title="NoirVision Backend",
    description="TwelveLabs video analysis pipeline; Evidence Pack API for claim scoring and RAG.",
    version="0.1.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(videos.router)


@app.get("/health")
def health():
    return {"status": "ok"}


# Consistent error JSON: FastAPI already returns {"detail": ...} for HTTPException
