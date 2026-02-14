"""
S3 utilities: presigned URLs, put/get JSON.
Evidence path: projects/{project_id}/videos/{video_id}/evidence.json
Job artifacts (optional): projects/{project_id}/jobs/{job_id}.json
"""
from __future__ import annotations

import json
import logging
from typing import Any, Optional

import boto3
from botocore.exceptions import ClientError

from app.config import get_settings

logger = logging.getLogger(__name__)


def _client():
    s = get_settings()
    kwargs = {"region_name": s.aws_region}
    if s.aws_access_key_id and s.aws_secret_access_key:
        kwargs["aws_access_key_id"] = s.aws_access_key_id
        kwargs["aws_secret_access_key"] = s.aws_secret_access_key
    return boto3.client("s3", **kwargs)


def get_presigned_url(s3_key: str, expires: int = 3600) -> str:
    """Generate a presigned GET URL for the object."""
    client = _client()
    bucket = get_settings().s3_bucket
    try:
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": s3_key},
            ExpiresIn=expires,
        )
        return url
    except ClientError as e:
        logger.exception("Failed to generate presigned URL for key=%s", s3_key)
        raise RuntimeError(f"S3 presigned URL failed: {e}") from e


def put_json(key: str, data: Any) -> None:
    """Upload JSON-serializable data to S3."""
    client = _client()
    bucket = get_settings().s3_bucket
    body = json.dumps(data, default=str).encode("utf-8")
    try:
        client.put_object(
            Bucket=bucket,
            Key=key,
            Body=body,
            ContentType="application/json",
        )
        logger.info("Put S3 key=%s bucket=%s", key, bucket)
    except ClientError as e:
        logger.exception("Failed to put_json key=%s", key)
        raise RuntimeError(f"S3 put failed: {e}") from e


def get_json(key: str) -> Optional[dict[str, Any]]:
    """Download and parse JSON from S3. Returns None if object does not exist."""
    client = _client()
    bucket = get_settings().s3_bucket
    try:
        resp = client.get_object(Bucket=bucket, Key=key)
        body = resp["Body"].read().decode("utf-8")
        return json.loads(body)
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") == "NoSuchKey":
            logger.debug("S3 key not found: %s", key)
            return None
        logger.exception("Failed to get_json key=%s", key)
        raise RuntimeError(f"S3 get failed: {e}") from e


def evidence_key(project_id: str, video_id: str) -> str:
    return f"projects/{project_id}/videos/{video_id}/evidence.json"


def job_artifact_key(project_id: str, job_id: str) -> str:
    return f"projects/{project_id}/jobs/{job_id}.json"
