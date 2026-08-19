from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.users.models import User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: int) -> User | None:
        query = select(User).where(User.id == user_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_cognito_sub(self, sub: str) -> User | None:
        query = select(User).where(User.cognito_sub == sub)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
