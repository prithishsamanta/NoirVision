"""
TwelveLabs API wrapper: create task, poll until ready, fetch transcript/summaries/chapters.
Isolated in one module; rest of app depends on EvidencePack, not API details.
Uses exponential backoff for polling and a hard timeout.
"""
from __future__ import annotations

import logging
import time
from datetime import datetime
from typing import Any, Optional

import httpx

from app.config import get_settings
from app.models.evidence import (
    EvidencePack,
    EvidencePackSource,
    EvidenceChapter,
    EvidenceEvent,
    EvidenceKeyQuote,
)

logger = logging.getLogger(__name__)

# Task status from TwelveLabs
STATUS_READY = "ready"
STATUS_FAILED = "failed"
STATUS_VALIDATING = "validating"
STATUS_PENDING = "pending"
STATUS_QUEUED = "queued"
STATUS_INDEXING = "indexing"


def _headers() -> dict[str, str]:
    s = get_settings()
    if not s.twelvelabs_api_key and not s.twelvelabs_mock:
        raise ValueError("TWELVELABS_API_KEY required when not in mock mode")
    return {
        "x-api-key": s.twelvelabs_api_key or "mock",
        "Content-Type": "application/json",
    }


def _base_url() -> str:
    return get_settings().twelvelabs_base_url.rstrip("/")


def create_video_task(
    *,
    youtube_url: Optional[str] = None,
    video_url: Optional[str] = None,
) -> tuple[str, Optional[str]]:
    """
    Create a video indexing task.
    Pass either youtube_url or video_url (e.g. presigned S3 URL).
    Returns (task_id, video_id). video_id may be present in response or only after polling.
    """
    settings = get_settings()
    if settings.twelvelabs_mock:
        task_id = "mock-task-" + str(int(time.time()))
        video_id = "mock-video-" + task_id
        return task_id, video_id

    url = _base_url() + "/tasks"
    index_id = settings.twelvelabs_index_id
    if not index_id:
        raise ValueError("TWELVELABS_INDEX_ID is required for create_video_task")

    source = youtube_url or video_url
    if not source:
        raise ValueError("Either youtube_url or video_url must be provided")

    # API expects multipart/form-data: index_id, video_url
    with httpx.Client(timeout=60.0) as client:
        resp = client.post(
            url,
            data={"index_id": index_id, "video_url": source},
            headers={"x-api-key": settings.twelvelabs_api_key},
        )
    resp.raise_for_status()
    data = resp.json()
    task_id = data.get("_id") or data.get("id")
    video_id = data.get("video_id")
    if not task_id:
        raise RuntimeError(f"TwelveLabs create task response missing task id: {data}")
    logger.info("Created TwelveLabs task_id=%s video_id=%s", task_id, video_id)
    return str(task_id), video_id


def get_task_status(task_id: str) -> dict[str, Any]:
    """GET task by id; returns raw response with status, video_id, etc."""
    settings = get_settings()
    if settings.twelvelabs_mock:
        return {"_id": task_id, "status": STATUS_READY, "video_id": "mock-video-" + task_id}

    url = f"{_base_url()}/tasks/{task_id}"
    with httpx.Client(timeout=30.0) as client:
        resp = client.get(url, headers=_headers())
    resp.raise_for_status()
    return resp.json()


def poll_until_ready(
    task_id: str,
    timeout_seconds: Optional[int] = None,
    poll_interval_base: float = 5.0,
    max_interval: float = 60.0,
) -> str:
    """
    Poll task until status is ready or failed. Returns video_id when ready.
    Uses exponential backoff between polls. Raises on timeout or failed status.
    """
    timeout = timeout_seconds or get_settings().twelvelabs_poll_timeout_seconds
    deadline = time.monotonic() + timeout
    interval = poll_interval_base
    last_status = None

    while time.monotonic() < deadline:
        data = get_task_status(task_id)
        status = (data.get("status") or "").lower()
        last_status = status
        video_id = data.get("video_id")

        if status == STATUS_READY:
            if not video_id:
                raise RuntimeError("TwelveLabs task ready but no video_id in response")
            logger.info("Task %s ready, video_id=%s", task_id, video_id)
            return str(video_id)
        if status == STATUS_FAILED:
            msg = data.get("message") or data.get("error") or "Indexing failed"
            raise RuntimeError(f"TwelveLabs task failed: {msg}")

        logger.info("Task %s status=%s, waiting %.1fs", task_id, status, interval)
        time.sleep(interval)
        interval = min(interval * 1.5, max_interval)

    raise TimeoutError(
        f"TwelveLabs task {task_id} did not complete within {timeout}s (last status: {last_status})"
    )


def _summarize(video_id: str, type_: str, prompt: Optional[str] = None) -> dict[str, Any]:
    """POST /summarize with video_id and type (summary | chapter | highlight)."""
    settings = get_settings()
    if settings.twelvelabs_mock:
        if type_ == "summary":
            return {"summarize_type": "summary", "summary": "Mock summary of the video."}
        if type_ == "chapter":
            return {
                "summarize_type": "chapter",
                "chapters": [
                    {
                        "start_sec": 0.0,
                        "end_sec": 30.0,
                        "chapter_title": "Introduction",
                        "chapter_summary": "Mock chapter.",
                    },
                ],
            }
        if type_ == "highlight":
            return {
                "summarize_type": "highlight",
                "highlights": [
                    {
                        "start_sec": 10.0,
                        "end_sec": 20.0,
                        "highlight": "Key moment",
                        "highlight_summary": "Mock highlight.",
                    },
                ],
            }
        return {}

    url = _base_url() + "/summarize"
    payload = {"video_id": video_id, "type": type_}
    if prompt:
        payload["prompt"] = prompt
    with httpx.Client(timeout=120.0) as client:
        resp = client.post(url, json=payload, headers=_headers())
    resp.raise_for_status()
    return resp.json()


def fetch_transcript(video_id: str) -> str:
    """
    Fetch transcript for video. Uses generate endpoint with a transcript-style prompt.
    Returns empty string if endpoint not available or on error.
    """
    settings = get_settings()
    if settings.twelvelabs_mock:
        return "Mock transcript for demo. This is a placeholder."

    # Try generate endpoint; some plans may not support it
    url = _base_url() + "/generate"
    payload = {
        "video_id": video_id,
        "prompt": "Provide a full transcript of all spoken words in this video, with minimal commentary.",
    }
    try:
        with httpx.Client(timeout=120.0) as client:
            resp = client.post(url, json=payload, headers=_headers())
        if resp.status_code != 200:
            logger.warning("Generate (transcript) returned %s: %s", resp.status_code, resp.text)
            return ""
        data = resp.json()
        # Response shape may be { "text": "..." } or similar
        if isinstance(data, str):
            return data
        return data.get("text") or data.get("generated_text") or data.get("output") or ""
    except Exception as e:
        logger.warning("Failed to fetch transcript for %s: %s", video_id, e)
        return ""


def fetch_chapters(video_id: str) -> list[dict[str, Any]]:
    """Fetch chapters (summarize type=chapter)."""
    raw = _summarize(video_id, "chapter")
    chapters = raw.get("chapters") or []
    return [c for c in chapters if isinstance(c, dict)]


def fetch_highlights(video_id: str) -> list[dict[str, Any]]:
    """Fetch highlights (summarize type=highlight)."""
    raw = _summarize(video_id, "highlight")
    return raw.get("highlights") or []


def fetch_summary(video_id: str) -> str:
    """Fetch one-shot summary (summarize type=summary)."""
    raw = _summarize(video_id, "summary")
    return raw.get("summary") or ""


def build_evidence_pack(
    video_id: str,
    source_type: str,
    source_url: str,
    *,
    raw_responses: Optional[dict[str, Any]] = None,
) -> EvidencePack:
    """
    Run transcript, chapters, highlights (and summary if needed), normalize into EvidencePack.
    """
    settings = get_settings()
    if settings.twelvelabs_mock:
        return _mock_evidence_pack(video_id, source_type, source_url)

    transcript = fetch_transcript(video_id)
    chapters_raw = fetch_chapters(video_id)
    highlights_raw = fetch_highlights(video_id)
    summary = fetch_summary(video_id)
    if not transcript and summary:
        transcript = summary

    chapters = [
        EvidenceChapter(
            start=float(c.get("start_sec", c.get("start", 0))),
            end=float(c.get("end_sec", c.get("end", 0))),
            summary=(c.get("chapter_summary") or c.get("chapter_title") or "").strip() or "Chapter",
        )
        for c in chapters_raw
    ]

    # Map highlights to events (type "scene" or "action") and key_quotes
    events: list[EvidenceEvent] = []
    key_quotes: list[EvidenceKeyQuote] = []
    for h in highlights_raw:
        t = float(h.get("start_sec", h.get("start", 0)))
        title = (h.get("highlight") or "").strip()
        desc = (h.get("highlight_summary") or "").strip()
        events.append(
            EvidenceEvent(t=t, type="scene", label=title or "Highlight", evidence=desc or title)
        )
        if desc:
            key_quotes.append(EvidenceKeyQuote(t=t, text=desc))

    pack = EvidencePack(
        video_id=video_id,
        source=EvidencePackSource(type=source_type, url=source_url),
        transcript=transcript,
        chapters=chapters,
        events=events,
        key_quotes=key_quotes,
        created_at=datetime.utcnow(),
        model_provider="twelvelabs",
        raw_twelvelabs=raw_responses,
    )
    return pack


def _mock_evidence_pack(video_id: str, source_type: str, source_url: str) -> EvidencePack:
    """Deterministic EvidencePack for TWELVELABS_MOCK=true."""
    return EvidencePack(
        video_id=video_id,
        source=EvidencePackSource(type=source_type, url=source_url),
        transcript="Mock transcript for demo. This is a placeholder for the full transcript.",
        chapters=[
            EvidenceChapter(start=0.0, end=30.0, summary="Introduction"),
            EvidenceChapter(start=30.0, end=90.0, summary="Main content"),
            EvidenceChapter(start=90.0, end=120.0, summary="Conclusion"),
        ],
        events=[
            EvidenceEvent(t=15.0, type="speech", label="Key point", evidence="Mock evidence."),
            EvidenceEvent(t=60.0, type="scene", label="Demo scene", evidence="Scene change."),
        ],
        key_quotes=[
            EvidenceKeyQuote(t=15.0, text="This is a key quote from the video."),
            EvidenceKeyQuote(t=75.0, text="Another notable quote."),
        ],
        created_at=datetime.utcnow(),
        model_provider="twelvelabs",
        raw_twelvelabs={"mock": True},
    )


def run_analysis(
    video_url: str,
    source_type: str,
    source_url_for_pack: str,
) -> EvidencePack:
    """
    Full flow: create task (using video_url), poll until ready, build EvidencePack.
    For YouTube, video_url is the YouTube URL; for S3, pass the presigned URL.
    source_url_for_pack: value to store in EvidencePack.source.url (e.g. original YouTube URL or s3 key).
    """
    settings = get_settings()
    if settings.twelvelabs_mock:
        task_id, video_id = create_video_task(video_url=video_url)
        return _mock_evidence_pack(video_id, source_type, source_url_for_pack)

    task_id, _ = create_video_task(video_url=video_url)
    video_id = poll_until_ready(task_id)
    return build_evidence_pack(video_id, source_type, source_url_for_pack)
