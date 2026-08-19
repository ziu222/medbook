from sqlalchemy.ext.asyncio import AsyncSession

from app.appointments.models import Appointment
from app.appointments.repository import AppointmentRepository
from app.appointments.schemas import AppointmentCreate


class AppointmentService:
    def __init__(self, db: AsyncSession):
        self.repo = AppointmentRepository(db)

    async def get_user_appointments(self, user_id: int) -> list[Appointment]:
        return await self.repo.get_by_user_id(user_id)

    async def book_appointment(self, user_id: int, data: AppointmentCreate) -> Appointment:
        appointment = Appointment(
            user_id=user_id,
            doctor_id=data.doctor_id,
            appointment_time=data.appointment_time,
            notes=data.notes,
            status="scheduled",
        )
        return await self.repo.create(appointment)

    async def delete_appointment(self, appointment_id: int, user_id: int) -> bool:
        """Trả về False nếu không tìm thấy hoặc không có quyền."""
        appointment = await self.repo.get_by_id(appointment_id)
        if not appointment:
            return False
        if appointment.user_id != user_id:
            return False
        await self.repo.delete(appointment)
        return True
