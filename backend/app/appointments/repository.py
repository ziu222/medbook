from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.appointments.models import Appointment


class AppointmentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user_id(self, user_id: int) -> list[Appointment]:
        query = select(Appointment).where(Appointment.user_id == user_id)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_id(self, appointment_id: int) -> Appointment | None:
        result = await self.db.execute(
            select(Appointment).where(Appointment.id == appointment_id)
        )
        return result.scalar_one_or_none()

    async def create(self, appointment: Appointment) -> Appointment:
        self.db.add(appointment)
        await self.db.commit()
        await self.db.refresh(appointment)
        return appointment

    async def delete(self, appointment: Appointment) -> None:
        await self.db.delete(appointment)
        await self.db.commit()
