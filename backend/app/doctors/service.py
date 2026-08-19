from sqlalchemy.ext.asyncio import AsyncSession

from app.doctors.models import Doctor, Specialty
from app.doctors.repository import DoctorRepository, SpecialtyRepository


class DoctorService:
    def __init__(self, db: AsyncSession):
        self.repo = DoctorRepository(db)

    async def get_all_doctors(self) -> list[Doctor]:
        return await self.repo.get_all()

    async def search_doctors(
        self,
        specialty_id: int | None = None,
        name: str | None = None,
    ) -> list[Doctor]:
        return await self.repo.search(specialty_id=specialty_id, name=name)

    async def get_doctor_by_id(self, doctor_id: int) -> Doctor | None:
        return await self.repo.get_by_id(doctor_id)


class SpecialtyService:
    def __init__(self, db: AsyncSession):
        self.repo = SpecialtyRepository(db)

    async def get_all_specialties(self) -> list[Specialty]:
        return await self.repo.get_all()
