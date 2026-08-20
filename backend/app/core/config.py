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


@cache
def get_vnpay_credentials() -> dict[str, str]:
    secret = boto3.client("secretsmanager").get_secret_value(
        SecretId=_required_env("VNPAY_SECRET_ARN")
    )
    credentials = json.loads(secret["SecretString"])
    for key in ("tmn_code", "hash_secret"):
        if not credentials.get(key):
            raise RuntimeError(f"VNPAY secret is missing {key}")
    return {
        "tmn_code": credentials["tmn_code"],
        "hash_secret": credentials["hash_secret"],
        "pay_url": _required_env("VNPAY_PAY_URL"),
        "return_url": _required_env("VNPAY_RETURN_URL"),
    }
