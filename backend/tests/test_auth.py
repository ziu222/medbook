import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app.core.auth import get_current_user


def test_single_role_and_reject_multiple_roles() -> None:
    claims = {"sub": "user-sub", "cognito:groups": "[doctor]"}
    request = Request(
        {
            "type": "http",
            "aws.event": {
                "requestContext": {"authorizer": {"jwt": {"claims": claims}}}
            },
        }
    )
    assert get_current_user(request).groups == frozenset({"doctor"})

    claims["cognito:groups"] = "[doctor patient]"
    with pytest.raises(HTTPException) as error:
        get_current_user(request)
    assert error.value.status_code == 403
