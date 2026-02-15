"""
User profile and incident request/response models for DynamoDB API.
"""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class ProfileResponse(BaseModel):
    user_id: str
    email: str
    updated_at: str


class ProfileCreate(BaseModel):
    email: Optional[str] = Field(default=None, description="User email (from token if omitted)")


class IncidentCreate(BaseModel):
    incident_id: str = Field(..., min_length=1, description="Unique id per user, e.g. 2026-02-14-042")
    incident_name: str = Field(..., min_length=1)
    description: str = Field(default="")
    video_link: str = Field(default="")
    generated_text: str = Field(default="")


class IncidentUpdate(BaseModel):
    incident_name: Optional[str] = Field(default=None, min_length=1)
    description: Optional[str] = None
    video_link: Optional[str] = None
    generated_text: Optional[str] = None


class IncidentResponse(BaseModel):
    incident_id: str
    incident_name: str
    description: str
    video_link: str
    generated_text: str
    created_at: str
    updated_at: str
