"""
Video analysis API: POST analyze, GET job status, GET evidence pack.
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query

from app.config import get_settings
from app.db import (
    create_job,
    get_job,
    get_job_by_video_id,
    update_job_status,
)
from app.models.evidence import EvidencePack
from app.models.jobs import (
    AnalyzeRequest,
    JobStatus,
    JobStatusResponse,
)
from app.services import s3_store
from app.services.twelvelabs_client import run_analysis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/videos", tags=["videos"])


def _validate_analyze_request(body: AnalyzeRequest) -> None:
    has_yt = bool(body.youtube_url and body.youtube_url.strip())
    has_s3 = bool(body.s3_key and body.s3_key.strip())
    if has_yt and has_s3:
        raise HTTPException(
            status_code=400,
            detail="Provide exactly one of youtube_url or s3_key, not both",
        )
    if not has_yt and not has_s3:
        raise HTTPException(
            status_code=400,
            detail="Provide exactly one of youtube_url or s3_key",
        )


def _run_analysis_task(job_id: str) -> None:
    """Background task: load job, run TwelveLabs, save evidence to S3, update job."""
    job = get_job(job_id)
    if not job or job.status not in (JobStatus.PENDING, JobStatus.PROCESSING):
        logger.warning("Job %s not found or not runnable", job_id)
        return

    update_job_status(job_id, JobStatus.PROCESSING)
    project_id = job.project_id
    source_type = job.source_type or "youtube"
    source_url = job.source_url or ""

    try:
        settings = get_settings()
        if source_type == "youtube":
            video_url = source_url
        else:
            # S3: TwelveLabs needs a publicly accessible URL; use presigned (long expiry)
            video_url = s3_store.get_presigned_url(source_url, expires=7200)
            if not video_url:
                raise RuntimeError("Failed to generate presigned URL for S3 key")

        pack = run_analysis(
            video_url=video_url,
            source_type=source_type,
            source_url_for_pack=source_url,
        )
        video_id = pack.video_id

        # Persist evidence to S3
        settings.require_s3()
        key = s3_store.evidence_key(project_id, video_id)
        s3_store.put_json(key, pack.model_dump(mode="json"))

        update_job_status(job_id, JobStatus.DONE, video_id=video_id)
        logger.info("Job %s done, video_id=%s", job_id, video_id)
    except Exception as e:
        logger.exception("Job %s failed: %s", job_id, e)
        update_job_status(
            job_id,
            JobStatus.FAILED,
            error_message=str(e),
        )


@router.post("/analyze")
def analyze_videos(request: AnalyzeRequest, background_tasks: BackgroundTasks) -> dict:
    """
    Submit a video for analysis. Returns job_id immediately; poll GET /analyze/{job_id} for status.
    """
    _validate_analyze_request(request)
    get_settings().require_s3()

    source_type = request.get_source_type()
    source_url = request.get_source_url()
    job = create_job(
        project_id=request.project_id,
        claim=request.claim,
        source_type=source_type,
        source_url=source_url,
    )
    background_tasks.add_task(_run_analysis_task, job.job_id)
    return {
        "job_id": job.job_id,
        "status": job.status,
        "message": "Analysis started. Poll GET /api/videos/analyze/{job_id} for status.",
    }


@router.get("/analyze/{job_id}", response_model=JobStatusResponse)
def get_analyze_status(job_id: str) -> JobStatusResponse:
    """Return job status; when status is 'done', video_id is set."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobStatusResponse(
        job_id=job.job_id,
        status=job.status,
        video_id=job.video_id,
        error=job.error_message,
    )


@router.get("/{video_id}/evidence")
def get_evidence(
    video_id: str,
    project_id: Optional[str] = Query(None, description="Project ID (optional if unique)"),
) -> EvidencePack:
    """
    Return EvidencePack for the given video_id. Loads from S3.
    If project_id is omitted, the first job with this video_id is used.
    """
    job = get_job_by_video_id(video_id, project_id=project_id)
    if not job:
        raise HTTPException(
            status_code=404,
            detail="No job found for this video_id (and project_id)",
        )
    key = s3_store.evidence_key(job.project_id, video_id)
    data = s3_store.get_json(key)
    if not data:
        raise HTTPException(
            status_code=404,
            detail="Evidence not found (may still be processing)",
        )
    return EvidencePack.model_validate(data)
