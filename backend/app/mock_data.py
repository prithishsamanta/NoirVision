"""
Mock TwelveLabs data for testing.
This module simulates video analysis responses until TwelveLabs integration is ready.
"""
from app.models import VideoAnalysis, VideoDetection


def get_mock_video_analysis_supported() -> VideoAnalysis:
    """Mock video analysis for a SUPPORTED claim scenario."""
    return VideoAnalysis(
        source="CCTV_5thSt_2026-02-13.mp4",
        duration="3m 42s",
        detections=[
            VideoDetection(
                timestamp="23:02:15",
                description="Person appears (object: trench coat, fedora)",
                objects=["trench coat", "fedora"],
                confidence=92.0
            ),
            VideoDetection(
                timestamp="23:02:30",
                description="Person approaches second individual",
                objects=["person", "person"],
                confidence=95.0
            ),
            VideoDetection(
                timestamp="23:02:35",
                description="Arm extends, object detected: knife",
                objects=["knife", "arm"],
                confidence=87.0
            ),
            VideoDetection(
                timestamp="23:02:40",
                description="Second individual hands over small object",
                objects=["wallet", "hand"],
                confidence=78.0
            ),
            VideoDetection(
                timestamp="23:02:45",
                description="First person flees frame (direction: east)",
                objects=["person running"],
                confidence=91.0
            )
        ],
        on_screen_text="OLD WAREHOUSE (visible at 23:02:10)",
        gps_metadata="40.7128° N, 74.0060° W (5th Street area)",
        speech_transcription=None
    )


def get_mock_video_analysis_contradicted() -> VideoAnalysis:
    """Mock video analysis for a CONTRADICTED claim scenario."""
    return VideoAnalysis(
        source="BlueNote_CCTV_2026-02-14.mp4",
        duration="2m 18s",
        detections=[
            VideoDetection(
                timestamp="23:58:00",
                description="Two individuals talking calmly near entrance",
                objects=["casual jacket", "casual jacket"],
                confidence=94.0
            ),
            VideoDetection(
                timestamp="23:58:30",
                description="One person hands something to the other",
                objects=["shiny item", "jewelry"],
                confidence=82.0
            ),
            VideoDetection(
                timestamp="23:58:45",
                description="Both walk away in opposite directions, smiling",
                objects=["person", "person"],
                confidence=89.0
            ),
            VideoDetection(
                timestamp="23:59:00",
                description="Club sign visible: BLUE NOTE JAZZ CLUB",
                objects=["sign"],
                confidence=98.0
            )
        ],
        on_screen_text="BLUE NOTE JAZZ CLUB",
        gps_metadata="40.7306° N, 73.9989° W (verified club location)",
        speech_transcription=[
            {"speaker": "Person A", "text": "Thanks for the cash, see you tomorrow."},
            {"speaker": "Person B", "text": "Yeah, deal's done."}
        ]
    )


# Sample claims for testing
MOCK_CLAIM_SUPPORTED = """On Friday night around 11 PM, I was walking past the old 
warehouse on 5th Street when a tall man in a dark trench coat and fedora approached me, 
pulled out a knife, and demanded my wallet. I gave it to him and he ran away toward the river."""

MOCK_CLAIM_CONTRADICTED = """I was attacked outside the Blue Note Jazz Club around 
midnight. A guy in a long coat and fedora grabbed my necklace and punched me in the face. 
I fought back but he ran off with my gold chain. I want him caught."""
