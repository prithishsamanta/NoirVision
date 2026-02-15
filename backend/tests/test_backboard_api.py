"""
Pytest tests for the Backboard API (/, /health, /analyze, /analyze/text, /demo/*).
Uses a mock analyzer so tests run without BACKBOARD_API_KEY or backboard SDK.
"""
from __future__ import annotations

import sys
from unittest.mock import AsyncMock, MagicMock, patch

# Mock backboard SDK so app.main can be imported without the package installed
if "backboard" not in sys.modules:
    sys.modules["backboard"] = MagicMock()

import os
# Allow BackboardAnalyzer() to be constructed (we mock its methods in tests)
os.environ.setdefault("BACKBOARD_API_KEY", "test-key-for-pytest")

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models import (
    CredibilityReport,
    WitnessClaim,
    VideoAnalysis,
    VideoDetection,
    ComparisonResult,
)


def _mock_report() -> CredibilityReport:
    """Minimal valid CredibilityReport for tests."""
    return CredibilityReport(
        case_id="test-case-1",
        case_title="Test Case",
        witness_claim="The witness stated something.",
        video_analysis=VideoAnalysis(
            source="test.mp4",
            duration="1m 0s",
            detections=[
                VideoDetection(
                    timestamp="00:00:10",
                    description="Something",
                    objects=["object"],
                    confidence=90.0,
                )
            ],
        ),
        comparisons=[
            ComparisonResult(
                category="Location",
                match=True,
                explanation="Claim matches video.",
            )
        ],
        credibility_score=75,
        verdict="SUPPORTED",
        recommendation="Proceed with investigation.",
        evidence_summary={"key": "value"},
        detective_note="Noir note.",
    )


@pytest.fixture
def mock_analyzer():
    """Analyzer that returns a fixed report without calling Backboard."""
    analyzer = MagicMock()
    analyzer.analyze_claim_vs_video = AsyncMock(return_value=_mock_report())
    return analyzer


@pytest.fixture
def client():
    return TestClient(app)


def test_root(client: TestClient):
    """GET / returns service info."""
    r = client.get("/")
    assert r.status_code == 200
    data = r.json()
    assert data.get("service") == "NoirVision API"
    assert data.get("status") == "operational"


def test_health(client: TestClient):
    """GET /health returns status and backboard_configured."""
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert "status" in data
    assert "backboard_configured" in data


@patch("app.main.analyzer")
def test_analyze_claim_success(mock_analyzer_attr, client: TestClient, mock_analyzer):
    """POST /analyze returns report when analyzer is configured."""
    mock_analyzer_attr.analyze_claim_vs_video = AsyncMock(return_value=_mock_report())

    body = {
        "claim": {"claim_text": "A man in a trench coat took my wallet.", "case_id": "c1"},
        "video_analysis": {
            "source": "CCTV.mp4",
            "duration": "2m",
            "detections": [
                {
                    "timestamp": "00:00:15",
                    "description": "Person in coat",
                    "objects": ["coat"],
                    "confidence": 90,
                }
            ],
            "on_screen_text": None,
            "gps_metadata": None,
            "speech_transcription": None,
        },
    }
    r = client.post("/analyze", json=body)
    assert r.status_code == 200
    data = r.json()
    assert "report" in data
    assert "formatted_report" in data
    assert data["report"]["verdict"] == "SUPPORTED"


def test_analyze_claim_no_analyzer(client: TestClient):
    """POST /analyze returns 500 when analyzer is not configured."""
    body = {
        "claim": {"claim_text": "Test claim."},
        "video_analysis": {
            "source": "x.mp4",
            "duration": "1m",
            "detections": [
                {"timestamp": "00:00:00", "description": "x", "objects": []}
            ],
        },
    }
    with patch("app.main.analyzer", None):
        r = client.post("/analyze", json=body)
    assert r.status_code == 500
    assert "Backboard" in (r.json().get("detail") or "")


@patch("app.main.analyzer")
def test_analyze_text_only_success(mock_analyzer_attr, client: TestClient, mock_analyzer):
    """POST /analyze/text returns report with mock video."""
    mock_analyzer_attr.analyze_claim_vs_video = AsyncMock(return_value=_mock_report())

    r = client.post(
        "/analyze/text",
        params={"claim_text": "A man in a trench coat demanded my wallet near the warehouse."},
    )
    assert r.status_code == 200
    data = r.json()
    assert "report" in data
    assert "formatted_report" in data


def test_analyze_text_only_no_analyzer(client: TestClient):
    """POST /analyze/text returns 500 when analyzer is not configured."""
    with patch("app.main.analyzer", None):
        r = client.post(
            "/analyze/text",
            params={"claim_text": "Some claim."},
        )
    assert r.status_code == 500


@patch("app.main.analyzer")
def test_demo_supported(mock_analyzer_attr, client: TestClient, mock_analyzer):
    """GET /demo/supported returns report."""
    mock_analyzer_attr.analyze_claim_vs_video = AsyncMock(return_value=_mock_report())

    r = client.get("/demo/supported")
    assert r.status_code == 200
    data = r.json()
    assert "report" in data
    assert "formatted_report" in data


@patch("app.main.analyzer")
def test_demo_contradicted(mock_analyzer_attr, client: TestClient, mock_analyzer):
    """GET /demo/contradicted returns report."""
    mock_analyzer_attr.analyze_claim_vs_video = AsyncMock(return_value=_mock_report())

    r = client.get("/demo/contradicted")
    assert r.status_code == 200
    data = r.json()
    assert "report" in data


def test_demo_supported_no_analyzer(client: TestClient):
    """GET /demo/supported returns 500 when analyzer is not configured."""
    with patch("app.main.analyzer", None):
        r = client.get("/demo/supported")
    assert r.status_code == 500


def test_analyze_validation_error(client: TestClient):
    """POST /analyze with invalid body returns 422."""
    r = client.post("/analyze", json={"claim": {}})  # missing video_analysis, invalid claim
    assert r.status_code == 422
