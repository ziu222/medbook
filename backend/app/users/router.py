from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import CurrentUser, get_current_user
from app.core.database import get_session
from app.users.schemas import UserProfilePut, UserProfileRead
from app.users.service import get_profile, put_profile

router = APIRouter(prefix="/api/users", tags=["users"])
DatabaseSession = Annotated[Session, Depends(get_session)]
AuthenticatedUser = Annotated[CurrentUser, Depends(get_current_user)]


@router.get("/me", response_model=UserProfileRead)
def read_me(session: DatabaseSession, current_user: AuthenticatedUser):
    profile = get_profile(session, current_user.subject)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found",
        )
    return profile


@router.put("/me", response_model=UserProfileRead)
def replace_me(
    data: UserProfilePut,
    session: DatabaseSession,
    current_user: AuthenticatedUser,
):
    return put_profile(session, current_user.subject, data)
