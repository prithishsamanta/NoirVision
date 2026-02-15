"""
User profile and incidents API. All routes require Authorization: Bearer <Cognito id_token or access_token>.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user
from app.models_twelvelabs.user import (
    IncidentCreate,
    IncidentResponse,
    IncidentUpdate,
    ProfileCreate,
    ProfileResponse,
)
from app.services import dynamodb_users

router = APIRouter(prefix="/api/users/me", tags=["users"])


def _user_id(user: dict) -> str:
    return user["sub"]


# ---------- Profile ----------


@router.get("/profile", response_model=ProfileResponse)
def get_my_profile(user: dict = Depends(get_current_user)):
    """Get current user's profile (from DynamoDB). Returns 404 if never created."""
    profile = dynamodb_users.get_profile(_user_id(user))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found; create it first with PUT /api/users/me/profile")
    return ProfileResponse(
        user_id=profile["user_id"],
        email=profile.get("email", ""),
        updated_at=profile.get("updated_at", ""),
    )


@router.put("/profile", response_model=ProfileResponse)
def create_or_update_my_profile(
    body: ProfileCreate,
    user: dict = Depends(get_current_user),
):
    """Create or update current user's profile (e.g. on first login). Uses email from token if not provided."""
    sub = _user_id(user)
    email = body.email if body.email is not None else user.get("email") or ""
    item = dynamodb_users.put_profile(sub, email=email)
    return ProfileResponse(
        user_id=item["user_id"],
        email=item.get("email", ""),
        updated_at=item.get("updated_at", ""),
    )


# ---------- Incidents ----------


@router.post("/incidents", response_model=IncidentResponse, status_code=201)
def create_incident(
    body: IncidentCreate,
    user: dict = Depends(get_current_user),
):
    """Create a new incident for the current user. incident_id must be unique per user."""
    sub = _user_id(user)
    item = dynamodb_users.put_incident(
        sub,
        body.incident_id,
        incident_name=body.incident_name,
        description=body.description,
        video_link=body.video_link,
        generated_text=body.generated_text,
    )
    return IncidentResponse(
        incident_id=item["incident_id"],
        incident_name=item["incident_name"],
        description=item.get("description", ""),
        video_link=item.get("video_link", ""),
        generated_text=item.get("generated_text", ""),
        created_at=item["created_at"],
        updated_at=item["updated_at"],
    )


@router.get("/incidents", response_model=list[IncidentResponse])
def list_my_incidents(user: dict = Depends(get_current_user)):
    """List all incidents for the current user (newest first)."""
    sub = _user_id(user)
    items = dynamodb_users.list_incidents(sub)
    return [
        IncidentResponse(
            incident_id=i["incident_id"],
            incident_name=i["incident_name"],
            description=i.get("description", ""),
            video_link=i.get("video_link", ""),
            generated_text=i.get("generated_text", ""),
            created_at=i.get("created_at", ""),
            updated_at=i.get("updated_at", ""),
        )
        for i in items
    ]


@router.get("/incidents/{incident_id}", response_model=IncidentResponse)
def get_incident(
    incident_id: str,
    user: dict = Depends(get_current_user),
):
    """Get one incident by id for the current user."""
    sub = _user_id(user)
    item = dynamodb_users.get_incident(sub, incident_id)
    if not item:
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentResponse(
        incident_id=item["incident_id"],
        incident_name=item["incident_name"],
        description=item.get("description", ""),
        video_link=item.get("video_link", ""),
        generated_text=item.get("generated_text", ""),
        created_at=item.get("created_at", ""),
        updated_at=item.get("updated_at", ""),
    )


@router.patch("/incidents/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: str,
    body: IncidentUpdate,
    user: dict = Depends(get_current_user),
):
    """Update selected fields of an incident (e.g. generated_text later)."""
    sub = _user_id(user)
    item = dynamodb_users.update_incident(
        sub,
        incident_id,
        incident_name=body.incident_name,
        description=body.description,
        video_link=body.video_link,
        generated_text=body.generated_text,
    )
    if not item:
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentResponse(
        incident_id=item["incident_id"],
        incident_name=item["incident_name"],
        description=item.get("description", ""),
        video_link=item.get("video_link", ""),
        generated_text=item.get("generated_text", ""),
        created_at=item.get("created_at", ""),
        updated_at=item.get("updated_at", ""),
    )
