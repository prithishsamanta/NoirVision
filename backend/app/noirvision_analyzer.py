"""
Complete integration of TwelveLabs video analysis with Backboard AI claim verification.
This module bridges TwelveLabs EvidencePack with Backboard credibility analysis.
"""
import logging
from typing import Dict, Any, List
from app.models_twelvelabs.evidence import EvidencePack
from app.models import VideoAnalysis, VideoDetection, WitnessClaim, CredibilityReport
from app.backboard_agent import BackboardAnalyzer
from app.report_generator import ReportGenerator

logger = logging.getLogger(__name__)


class NoirVisionAnalyzer:
    """
    Complete end-to-end analyzer that integrates TwelveLabs and Backboard.
    """
    
    def __init__(self):
        self.backboard = BackboardAnalyzer()
    
    def convert_evidence_to_video_analysis(self, evidence: EvidencePack) -> VideoAnalysis:
        """
        Convert TwelveLabs EvidencePack to VideoAnalysis format for Backboard.
        """
        detections: List[VideoDetection] = []
        
        # Convert events to detections
        for event in evidence.events:
            timestamp = self._seconds_to_timestamp(event.t)
            detections.append(VideoDetection(
                timestamp=timestamp,
                description=f"{event.label}: {event.evidence}",
                objects=[event.label],
                confidence=None
            ))
        
        # Convert chapters to detections (for scene changes)
        for chapter in evidence.chapters:
            timestamp = self._seconds_to_timestamp(chapter.start)
            detections.append(VideoDetection(
                timestamp=timestamp,
                description=f"Scene: {chapter.summary}",
                objects=["scene_change"],
                confidence=None
            ))
        
        # Sort detections by timestamp
        detections.sort(key=lambda d: d.timestamp)
        
        # Extract speech transcription if available
        speech_transcription = None
        if evidence.key_quotes:
            speech_transcription = [
                {
                    "timestamp": self._seconds_to_timestamp(quote.t),
                    "speaker": "Person",
                    "text": quote.text
                }
                for quote in evidence.key_quotes
            ]
        
        # Calculate duration
        duration = self._calculate_duration(evidence)
        
        # Extract on-screen text from transcript or events
        on_screen_text = self._extract_on_screen_text(evidence)
        
        return VideoAnalysis(
            source=evidence.source.url,
            duration=duration,
            detections=detections,
            on_screen_text=on_screen_text,
            gps_metadata=None,  # TwelveLabs doesn't provide GPS
            speech_transcription=speech_transcription
        )
    
    async def analyze_video_with_claim(
        self,
        evidence: EvidencePack,
        claim_text: str,
        case_id: str = None
    ) -> CredibilityReport:
        """
        Complete analysis: TwelveLabs evidence + witness claim → credibility report.
        
        Args:
            evidence: EvidencePack from TwelveLabs
            claim_text: Witness statement
            case_id: Optional case ID
            
        Returns:
            Complete credibility report with verdict and recommendations
        """
        # Convert TwelveLabs evidence to VideoAnalysis format
        video_analysis = self.convert_evidence_to_video_analysis(evidence)
        
        # Create witness claim
        claim = WitnessClaim(claim_text=claim_text, case_id=case_id)
        
        # Analyze with Backboard
        report = await self.backboard.analyze_claim_vs_video(claim, video_analysis)
        
        return report
    
    def generate_formatted_report(self, report: CredibilityReport) -> str:
        """Generate ASCII art report."""
        return ReportGenerator.generate_report(report)
    
    def _seconds_to_timestamp(self, seconds: float) -> str:
        """Convert seconds to HH:MM:SS format."""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    
    def _calculate_duration(self, evidence: EvidencePack) -> str:
        """Calculate video duration from chapters or events."""
        max_time = 0.0
        
        if evidence.chapters:
            max_time = max(c.end for c in evidence.chapters)
        elif evidence.events:
            max_time = max(e.t for e in evidence.events)
        
        if max_time == 0:
            return "unknown"
        
        minutes = int(max_time // 60)
        seconds = int(max_time % 60)
        
        if minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"
    
    def _extract_on_screen_text(self, evidence: EvidencePack) -> str:
        """Extract visible text from events or transcript."""
        # Look for events that might contain on-screen text
        text_events = [
            e.evidence for e in evidence.events 
            if any(keyword in e.label.lower() for keyword in ['text', 'sign', 'title', 'caption'])
        ]
        
        if text_events:
            return " | ".join(text_events[:3])  # First 3 text items
        
        return None
