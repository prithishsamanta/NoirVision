#!/usr/bin/env python3
"""
Create the NoirVision DynamoDB table for user profiles and incidents.
Uses the same config as the app (backend/.env: DYNAMODB_TABLE_NAME, AWS_REGION, etc.).
Run from repo root: python -m backend.scripts.create_dynamodb_table
Or from backend/: python -m scripts.create_dynamodb_table
"""
from __future__ import annotations

import sys
from pathlib import Path

# Ensure backend/app is on path
_backend = Path(__file__).resolve().parent.parent
if str(_backend) not in sys.path:
    sys.path.insert(0, str(_backend))

from app.config import get_settings


def main() -> None:
    settings = get_settings()
    table_name = settings.dynamodb_table_name
    region = settings.aws_region
    kwargs = {"region_name": region}
    if settings.aws_access_key_id and settings.aws_secret_access_key:
        kwargs["aws_access_key_id"] = settings.aws_access_key_id
        kwargs["aws_secret_access_key"] = settings.aws_secret_access_key

    import boto3
    dynamodb = boto3.client("dynamodb", **kwargs)

    try:
        dynamodb.describe_table(TableName=table_name)
        print(f"Table '{table_name}' already exists in {region}.")
        return
    except dynamodb.exceptions.ResourceNotFoundException:
        pass

    dynamodb.create_table(
        TableName=table_name,
        KeySchema=[
            {"AttributeName": "user_id", "KeyType": "HASH"},
            {"AttributeName": "sk", "KeyType": "RANGE"},
        ],
        AttributeDefinitions=[
            {"AttributeName": "user_id", "AttributeType": "S"},
            {"AttributeName": "sk", "AttributeType": "S"},
        ],
        BillingMode="PAY_PER_REQUEST",
    )
    print(f"Created table '{table_name}' in {region}. Wait a few seconds before using it.")


if __name__ == "__main__":
    main()
