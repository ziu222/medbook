from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schedules.models import Schedule


class ScheduleRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_doctor_id(self, doctor_id: int) -> list[Schedule]:
        query = select(Schedule).where(Schedule.doctor_id == doctor_id)
        result = await self.db.execute(query)
        return list(result.scalars().all())
