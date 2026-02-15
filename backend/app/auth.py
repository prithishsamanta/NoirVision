"""
Cognito JWT validation: verify Bearer token and return sub (and email) from payload.
"""
from __future__ import annotations

import logging
from typing import Optional

import jwt
from fastapi import HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

# Lazy JWKS client (created once we have config)
_jwks_client: Optional[jwt.PyJWKClient] = None


def _get_jwks_client() -> jwt.PyJWKClient:
    global _jwks_client
    if _jwks_client is not None:
        return _jwks_client
    settings = get_settings()
    if not settings.cognito_user_pool_id:
        raise HTTPException(
            status_code=503,
            detail="Cognito not configured (COGNITO_USER_POOL_ID)",
        )
    region = settings.cognito_region
    pool_id = settings.cognito_user_pool_id
    jwks_url = f"https://cognito-idp.{region}.amazonaws.com/{pool_id}/.well-known/jwks.json"
    _jwks_client = jwt.PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=300)
    return _jwks_client


def _verify_cognito_token(token: str) -> dict:
    """
    Verify Cognito id_token or access_token and return payload.
    Validates signature (JWKS), exp, iss; optionally aud for id_token.
    """
    settings = get_settings()
    if not settings.cognito_user_pool_id:
        raise HTTPException(
            status_code=503,
            detail="Cognito not configured (COGNITO_USER_POOL_ID)",
        )
    region = settings.cognito_region
    pool_id = settings.cognito_user_pool_id
    issuer = f"https://cognito-idp.{region}.amazonaws.com/{pool_id}"

    try:
        jwks_client = _get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=issuer,
            options={"verify_aud": False},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        logger.debug("JWT invalid: %s", e)
        raise HTTPException(status_code=401, detail="Invalid token")

    if settings.cognito_client_id and payload.get("token_use") == "id":
        aud = payload.get("aud")
        if aud != settings.cognito_client_id:
            raise HTTPException(status_code=401, detail="Invalid audience")

    return payload


def get_sub_and_email_from_payload(payload: dict) -> tuple[str, Optional[str]]:
    """Extract sub (required) and email (if present) from verified token payload."""
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Token missing sub")
    email = payload.get("email") or payload.get("cognito:username")
    return sub, email


async def get_current_user(request: Request) -> dict:
    """
    Dependency: require Authorization: Bearer <id_token or access_token>.
    Validates token with Cognito JWKS and returns {"sub": str, "email": str | None}.
    """
    credentials: Optional[HTTPAuthorizationCredentials] = await security(request)
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header (expected Bearer token)",
        )
    payload = _verify_cognito_token(credentials.credentials)
    sub, email = get_sub_and_email_from_payload(payload)
    return {"sub": sub, "email": email}
