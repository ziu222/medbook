from collections.abc import Iterator
from functools import cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session

from app.core.config import get_database_url


class Base(DeclarativeBase):
    pass


@cache
def get_engine() -> Engine:
    return create_engine(
        get_database_url(),
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=1,
        max_overflow=0,
    )


def get_session() -> Iterator[Session]:
    with Session(get_engine()) as session:
        yield session
