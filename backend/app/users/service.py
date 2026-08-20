from sqlalchemy.orm import Session

from app.users.models import UserProfile
from app.users.schemas import UserProfilePut


def get_profile(session: Session, subject: str) -> UserProfile | None:
    return session.get(UserProfile, subject)


def put_profile(session: Session, subject: str, data: UserProfilePut) -> UserProfile:
    profile = get_profile(session, subject)
    if profile is None:
        profile = UserProfile(cognito_sub=subject, **data.model_dump())
        session.add(profile)
    else:
        for field, value in data.model_dump().items():
            setattr(profile, field, value)

    session.commit()
    session.refresh(profile)
    return profile
