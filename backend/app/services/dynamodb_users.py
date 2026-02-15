"""
DynamoDB access for user profile and incidents (keyed by Cognito sub).
Table: PK=user_id (sub), SK=PROFILE | INCIDENT#<incident_id>
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional

import boto3
from botocore.exceptions import ClientError

from app.config import get_settings

logger = logging.getLogger(__name__)

SK_PROFILE = "PROFILE"
SK_INCIDENT_PREFIX = "INCIDENT#"


def _table():
    settings = get_settings()
    region = settings.aws_region
    table_name = settings.dynamodb_table_name
    kwargs = {"region_name": region}
    if settings.aws_access_key_id and settings.aws_secret_access_key:
        kwargs["aws_access_key_id"] = settings.aws_access_key_id
        kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
    dynamodb = boto3.resource("dynamodb", **kwargs)
    return dynamodb.Table(table_name)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Profile ----------


def put_profile(user_id: str, email: Optional[str] = None) -> dict:
    """Create or update user profile (PK=user_id, SK=PROFILE)."""
    table = _table()
    item = {
        "user_id": user_id,
        "sk": SK_PROFILE,
        "email": email or "",
        "updated_at": _now_iso(),
    }
    table.put_item(Item=item)
    return item


def get_profile(user_id: str) -> Optional[dict]:
    """Get user profile by sub. Returns None if not found."""
    table = _table()
    try:
        r = table.get_item(Key={"user_id": user_id, "sk": SK_PROFILE})
        return r.get("Item")
    except ClientError as e:
        logger.warning("DynamoDB get_profile error: %s", e)
        return None


# ---------- Incidents ----------


def _sk_incident(incident_id: str) -> str:
    return f"{SK_INCIDENT_PREFIX}{incident_id}"


def put_incident(
    user_id: str,
    incident_id: str,
    *,
    incident_name: str,
    description: str = "",
    video_link: str = "",
    generated_text: str = "",
) -> dict:
    """Create or overwrite an incident. incident_id must be unique per user (e.g. 2026-02-14-042)."""
    table = _table()
    now = _now_iso()
    item = {
        "user_id": user_id,
        "sk": _sk_incident(incident_id),
        "incident_id": incident_id,
        "incident_name": incident_name,
        "description": description,
        "video_link": video_link,
        "generated_text": generated_text,
        "created_at": now,
        "updated_at": now,
    }
    table.put_item(Item=item)
    return item


def get_incident(user_id: str, incident_id: str) -> Optional[dict]:
    """Get one incident by user_id and incident_id."""
    table = _table()
    try:
        r = table.get_item(Key={"user_id": user_id, "sk": _sk_incident(incident_id)})
        return r.get("Item")
    except ClientError as e:
        logger.warning("DynamoDB get_incident error: %s", e)
        return None


def list_incidents(user_id: str, limit: int = 100) -> list[dict]:
    """List all incidents for a user (Query PK=user_id, SK begins_with INCIDENT#)."""
    table = _table()
    try:
        r = table.query(
            KeyConditionExpression="user_id = :uid AND begins_with(sk, :prefix)",
            ExpressionAttributeValues={":uid": user_id, ":prefix": SK_INCIDENT_PREFIX},
            Limit=limit,
        )
        items = r.get("Items", [])
        # Sort by created_at descending (newest first) if present
        items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return items
    except ClientError as e:
        logger.warning("DynamoDB list_incidents error: %s", e)
        return []


def update_incident(
    user_id: str,
    incident_id: str,
    *,
    incident_name: Optional[str] = None,
    description: Optional[str] = None,
    video_link: Optional[str] = None,
    generated_text: Optional[str] = None,
) -> Optional[dict]:
    """
    Update selected fields of an incident. Only provided fields are updated.
    Returns the updated item or None if not found.
    """
    table = _table()
    key = {"user_id": user_id, "sk": _sk_incident(incident_id)}
    now = _now_iso()

    updates = []
    names = {"#ua": "updated_at"}
    values: dict[str, Any] = {":ua": now}

    if incident_name is not None:
        updates.append("#name = :name")
        names["#name"] = "incident_name"
        values[":name"] = incident_name
    if description is not None:
        updates.append("#desc = :desc")
        names["#desc"] = "description"
        values[":desc"] = description
    if video_link is not None:
        updates.append("#link = :link")
        names["#link"] = "video_link"
        values[":link"] = video_link
    if generated_text is not None:
        updates.append("#text = :text")
        names["#text"] = "generated_text"
        values[":text"] = generated_text

    if not updates:
        return get_incident(user_id, incident_id)

    updates.append("#ua = :ua")
    update_expr = "SET " + ", ".join(updates)

    try:
        r = table.update_item(
            Key=key,
            UpdateExpression=update_expr,
            ExpressionAttributeNames=names,
            ExpressionAttributeValues=values,
            ReturnValues="ALL_NEW",
            ConditionExpression="attribute_exists(sk)",
        )
        return r.get("Attributes")
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return None  # incident does not exist
        logger.warning("DynamoDB update_incident error: %s", e)
        raise
