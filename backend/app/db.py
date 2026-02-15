"""
SQLite job storage via SQLModel.
Single table for analyze jobs.
"""
from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime
from typing import Generator, Optional
import uuid

from sqlmodel import Session, SQLModel, create_engine, Field as SqlField

from app.config import get_settings
from app.models_twelvelabs.jobs import JobStatus


class Job(SQLModel, table=True):
    __tablename__ = "jobs"

    job_id: str = SqlField(primary_key=True)
    project_id: str = SqlField(index=True)
    claim: str = SqlField()
    status: str = SqlField(index=True)
    video_id: Optional[str] = SqlField(default=None)
    source_type: Optional[str] = SqlField(default=None)
    source_url: Optional[str] = SqlField(default=None)
    error_message: Optional[str] = SqlField(default=None)
    created_at: datetime = SqlField(default_factory=datetime.utcnow)
    updated_at: datetime = SqlField(default_factory=datetime.utcnow)


_engine = None


def get_engine():
    global _engine
    if _engine is None:
        url = get_settings().sqlite_database_url
        _engine = create_engine(url, connect_args={"check_same_thread": False})
        SQLModel.metadata.create_all(_engine)
    return _engine


@contextmanager
def session() -> Generator[Session, None, None]:
    engine = get_engine()
    with Session(engine) as s:
        yield s


def create_job(project_id: str, claim: str, source_type: str, source_url: str) -> Job:
    job_id = str(uuid.uuid4())
    with session() as s:
        job = Job(
            job_id=job_id,
            project_id=project_id,
            claim=claim,
            status=JobStatus.PENDING,
            source_type=source_type,
            source_url=source_url,
        )
        s.add(job)
        s.commit()
        s.refresh(job)
    return job


def get_job(job_id: str) -> Optional[Job]:
    with session() as s:
        return s.get(Job, job_id)


def update_job_status(
    job_id: str,
    status: str,
    *,
    video_id: Optional[str] = None,
    error_message: Optional[str] = None,
) -> Optional[Job]:
    with session() as s:
        job = s.get(Job, job_id)
        if not job:
            return None
        job.status = status
        job.updated_at = datetime.utcnow()
        if video_id is not None:
            job.video_id = video_id
        if error_message is not None:
            job.error_message = error_message
        s.add(job)
        s.commit()
        s.refresh(job)
    return job


def get_job_by_video_id(video_id: str, project_id: Optional[str] = None) -> Optional[Job]:
    """Find a job by video_id; optionally restrict to project_id."""
    from sqlmodel import select
    with session() as s:
        stmt = select(Job).where(Job.video_id == video_id)
        if project_id:
            stmt = stmt.where(Job.project_id == project_id)
        stmt = stmt.limit(1)
        return s.exec(stmt).first()
