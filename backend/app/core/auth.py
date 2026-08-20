import json
import re
from dataclasses import dataclass

from fastapi import HTTPException, Request, status

APPLICATION_ROLES = frozenset({"patient", "doctor", "admin"})


@dataclass(frozen=True, slots=True)
class CurrentUser:
    subject: str
    groups: frozenset[str]


def _parse_groups(raw_groups) -> frozenset[str]:
    if isinstance(raw_groups, list):
        values = raw_groups
    elif isinstance(raw_groups, str):
        try:
            decoded = json.loads(raw_groups)
        except json.JSONDecodeError:
            decoded = raw_groups
        values = (
            decoded
            if isinstance(decoded, list)
            else re.split(r"[,\s]+", raw_groups.strip("[]"))
        )
    else:
        values = []

    return frozenset(
        value.strip().strip("'\"")
        for value in values
        if isinstance(value, str) and value.strip()
    )


def get_current_user(request: Request) -> CurrentUser:
    event = request.scope.get("aws.event", {})
    claims = (
        event.get("requestContext", {})
        .get("authorizer", {})
        .get("jwt", {})
        .get("claims", {})
    )
    subject = claims.get("sub")
    if not isinstance(subject, str) or not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing verified identity",
            headers={"WWW-Authenticate": "Bearer"},
        )

    groups = _parse_groups(claims.get("cognito:groups", []))
    if len(groups & APPLICATION_ROLES) > 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Multiple application roles are not allowed",
        )

    return CurrentUser(subject=subject, groups=groups)
