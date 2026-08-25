import json
import os
from functools import cache
from urllib.parse import quote_plus

import boto3


def _required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


@cache
def get_database_url() -> str:
    if url := os.getenv("DATABASE_URL"):
        return url

    secret = boto3.client("secretsmanager").get_secret_value(
        SecretId=_required_env("DB_SECRET_ARN")
    )
    credentials = json.loads(secret["SecretString"])
    username = quote_plus(credentials["username"])
    password = quote_plus(credentials["password"])
    host = _required_env("DB_HOST")
    port = os.getenv("DB_PORT", "5432")
    database = _required_env("DB_NAME")
    return f"postgresql+psycopg://{username}:{password}@{host}:{port}/{database}"
