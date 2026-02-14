"""
Evidence Pack: contract returned to Backboard claim scoring and RAG.
All timestamps in seconds (float).
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class EvidencePackSource(BaseModel):
    type: Literal["youtube", "s3"]
    url: str = Field(..., description="YouTube URL or S3 key / presigned URL")


class EvidenceChapter(BaseModel):
    start: float = Field(..., description="Start time in seconds")
    end: float = Field(..., description="End time in seconds")
    summary: str = Field(..., description="Chapter summary/title")


class EvidenceEvent(BaseModel):
    t: float = Field(..., description="Timestamp in seconds")
    type: Literal["action", "object", "speech", "scene"] = Field(
        ..., description="Event type from analysis"
    )
    label: str = Field(..., description="Short label")
    evidence: str = Field(..., description="Supporting evidence text")


class EvidenceKeyQuote(BaseModel):
    t: float = Field(..., description="Timestamp in seconds")
    text: str = Field(..., description="Quote text")


class EvidencePack(BaseModel):
    """Structured evidence pack for downstream claim scoring and RAG."""

    video_id: str = Field(..., description="TwelveLabs or internal video ID")
    source: EvidencePackSource = Field(..., description="Video source (youtube or s3)")
    transcript: str = Field(default="", description="Full or concatenated transcript")
    chapters: list[EvidenceChapter] = Field(
        default_factory=list,
        description="Chapters with start/end/summary",
    )
    events: list[EvidenceEvent] = Field(
        default_factory=list,
        description="Key moments (actions, objects, speech, scenes)",
    )
    key_quotes: list[EvidenceKeyQuote] = Field(
        default_factory=list,
        description="Notable quotes with timestamps",
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="When the pack was generated",
    )
    model_provider: str = Field(
        default="twelvelabs",
        description="Provider used for analysis",
    )
    raw_twelvelabs: Optional[dict[str, Any]] = Field(
        default=None,
        description="Raw TwelveLabs response(s) when available",
    )
