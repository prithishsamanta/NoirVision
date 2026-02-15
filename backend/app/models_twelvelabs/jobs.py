"""
Job and analyze request/response models.
"""
from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class JobStatus:
    PENDING = "pending"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"


class AnalyzeRequest(BaseModel):
    project_id: str = Field(..., min_length=1, description="Project identifier")
    claim: str = Field(..., description="Claim to evaluate (stored, not scored here)")
    youtube_url: Optional[str] = Field(default=None, description="YouTube video URL")
    s3_key: Optional[str] = Field(default=None, description="S3 object key for uploaded video")

    def get_source_type(self) -> Literal["youtube", "s3"]:
        if self.youtube_url:
            return "youtube"
        if self.s3_key:
            return "s3"
        raise ValueError("Exactly one of youtube_url or s3_key must be set")

    def get_source_url(self) -> str:
        if self.youtube_url:
            return self.youtube_url
        if self.s3_key:
            return self.s3_key
        raise ValueError("Exactly one of youtube_url or s3_key must be set")


class JobRecord(BaseModel):
    job_id: str
    project_id: str
    claim: str
    status: str  # pending | processing | done | failed
    video_id: Optional[str] = None
    source_type: Optional[str] = None  # youtube | s3
    source_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    video_id: Optional[str] = None
    error: Optional[str] = None
