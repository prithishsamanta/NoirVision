"""
Backend configuration via environment variables.
Validates required settings on import; missing required vars raise clear errors.
"""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load .env from backend/ first so COGNITO_* etc. are in os.environ (reliable with uvicorn --reload)
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"
if _ENV_FILE.exists():
    load_dotenv(_ENV_FILE)

_ENV_PATH = str(_ENV_FILE) if _ENV_FILE.exists() else ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_PATH,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # TwelveLabs
    twelvelabs_api_key: Optional[str] = Field(
        default=None,
        description="TwelveLabs API key (x-api-key)",
    )
    twelvelabs_index_id: Optional[str] = Field(
        default=None,
        description="TwelveLabs index ID for video indexing (required unless mock)",
    )
    twelvelabs_mock: bool = Field(
        default=False,
        description="If True, skip real API and return deterministic EvidencePack for demo",
    )
    twelvelabs_base_url: str = Field(
        default="https://api.twelvelabs.io/v1.3",
        description="TwelveLabs API base URL",
    )
    twelvelabs_poll_timeout_seconds: int = Field(
        default=600,
        ge=60,
        le=1200,
        description="Max seconds to wait for indexing (e.g. 8–12 min)",
    )

    # AWS / S3
    s3_bucket: str = Field(
        default="",
        description="S3 bucket for media and evidence storage",
    )
    aws_region: str = Field(
        default="us-east-1",
        description="AWS region for S3",
    )
    aws_access_key_id: Optional[str] = Field(
        default=None,
        description="AWS access key (optional if using instance/profile)",
    )
    aws_secret_access_key: Optional[str] = Field(
        default=None,
        description="AWS secret key (optional if using instance/profile)",
    )

    # App
    environment: str = Field(default="development", description="development | staging | production")
    sqlite_database_url: str = Field(
        default="sqlite:///./noirvision_jobs.db",
        description="SQLite DB for job metadata",
    )

    # DynamoDB – user profile and incidents (keyed by Cognito sub)
    dynamodb_table_name: str = Field(
        default="noirvision_users",
        description="DynamoDB table name (PK=user_id, SK=PROFILE|INCIDENT#id)",
    )

    # Cognito – for JWT validation (JWKS)
    cognito_region: str = Field(
        default="us-east-2",
        description="AWS region where Cognito User Pool is",
    )
    cognito_user_pool_id: str = Field(
        default="",
        description="Cognito User Pool ID (e.g. us-east-2_xxxxx)",
    )
    cognito_client_id: Optional[str] = Field(
        default=None,
        description="Cognito App client ID (optional; used to validate id_token aud)",
    )

    @field_validator("cognito_user_pool_id", "cognito_region", mode="before")
    @classmethod
    def cognito_from_env(cls, v, info):
        # Fallback: read from os.environ if .env wasn't loaded (e.g. wrong cwd)
        if v is not None and str(v).strip():
            return v.strip()
        env_name = info.field_name.upper()  # cognito_user_pool_id -> COGNITO_USER_POOL_ID
        return (os.getenv(env_name) or "").strip() or (v or "")

    @field_validator("twelvelabs_api_key", mode="before")
    @classmethod
    def allow_twelve_labs_key_name(cls, v: Optional[str], info):
        # Support .env with TWELVE_LABS_API_KEY (underscore) as well
        if v is not None:
            return v
        from os import getenv
        alt = getenv("TWELVE_LABS_API_KEY")
        return alt or v

    def require_twelvelabs(self) -> None:
        """Call at startup if TwelveLabs is needed (non-mock)."""
        if self.twelvelabs_mock:
            return
        if not self.twelvelabs_api_key:
            raise ValueError(
                "Missing required env: TWELVELABS_API_KEY (or TWELVE_LABS_API_KEY). "
                "Set TWELVELABS_MOCK=true for demo without API key."
            )
        if not self.twelvelabs_index_id:
            raise ValueError(
                "Missing required env: TWELVELABS_INDEX_ID. "
                "Create an index in TwelveLabs and set its ID, or use TWELVELABS_MOCK=true."
            )

    def require_s3(self) -> None:
        """Call at startup if S3 is required."""
        if not self.s3_bucket:
            raise ValueError("Missing required env: S3_BUCKET")


@lru_cache
def get_settings() -> Settings:
    return Settings()
