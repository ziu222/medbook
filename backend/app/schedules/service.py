from sqlalchemy.ext.asyncio import AsyncSession

from app.schedules.models import Schedule
from app.schedules.repository import ScheduleRepository


class ScheduleService:
    def __init__(self, db: AsyncSession):
        self.repo = ScheduleRepository(db)

    async def get_schedules_by_doctor(self, doctor_id: int) -> list[Schedule]:
        return await self.repo.get_by_doctor_id(doctor_id)
