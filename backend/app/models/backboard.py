"""
Backboard / credibility report models (claim vs video analysis).
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class VideoDetection(BaseModel):
    """Individual detection from video analysis."""
    timestamp: str = Field(..., description="Timestamp in video (HH:MM:SS)")
    description: str = Field(..., description="What was detected")
    objects: List[str] = Field(default_factory=list, description="Objects detected")
    confidence: Optional[float] = Field(None, description="Confidence score (0-100)")


class VideoAnalysis(BaseModel):
    """Complete video analysis from TwelveLabs (or mock data)."""
    source: str = Field(..., description="Video filename or source")
    duration: str = Field(..., description="Video duration (e.g., '3m 42s')")
    detections: List[VideoDetection] = Field(..., description="Key detections from video")
    on_screen_text: Optional[str] = Field(None, description="Text visible in video")
    gps_metadata: Optional[str] = Field(None, description="GPS coordinates if available")
    speech_transcription: Optional[List[Dict[str, str]]] = Field(
        None, description="Transcribed speech from video"
    )


class WitnessClaim(BaseModel):
    """Witness claim/statement."""
    claim_text: str = Field(..., description="The witness's statement")
    case_id: Optional[str] = Field(None, description="Case ID (auto-generated if not provided)")


class ComparisonResult(BaseModel):
    """Individual comparison point between claim and video."""
    category: str = Field(..., description="What is being compared")
    match: bool = Field(..., description="Whether claim matches video")
    explanation: str = Field(..., description="Explanation of match/mismatch")


class CredibilityReport(BaseModel):
    """Complete credibility report output."""
    case_id: str = Field(..., description="Unique case identifier")
    case_title: str = Field(..., description="Noir-style case title")
    witness_claim: str = Field(..., description="Original witness statement")
    video_analysis: VideoAnalysis = Field(..., description="Video analysis data")
    comparisons: List[ComparisonResult] = Field(..., description="Comparison results")
    credibility_score: int = Field(..., ge=0, le=100, description="Overall credibility (0-100)")
    verdict: str = Field(..., description="SUPPORTED, CONTRADICTED, or INCONCLUSIVE")
    recommendation: str = Field(..., description="Investigation recommendation")
    evidence_summary: Dict[str, Any] = Field(..., description="Key evidence points")
    detective_note: str = Field(..., description="Noir-styled detective commentary")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class AnalysisRequest(BaseModel):
    """Request payload for Backboard /analyze endpoint."""
    claim: WitnessClaim = Field(..., description="Witness claim")
    video_analysis: VideoAnalysis = Field(
        ..., description="Video analysis (mocked or from TwelveLabs)"
    )
