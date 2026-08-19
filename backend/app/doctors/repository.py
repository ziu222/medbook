from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.doctors.models import Doctor, Specialty


class DoctorRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[Doctor]:
        query = (
            select(Doctor)
            .options(selectinload(Doctor.specialty))
            .order_by(Doctor.id)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def search(
        self,
        specialty_id: int | None = None,
        name: str | None = None,
    ) -> list[Doctor]:
        query = (
            select(Doctor)
            .options(selectinload(Doctor.specialty))
            .order_by(Doctor.id)
        )

        if specialty_id is not None:
            query = query.where(Doctor.specialty_id == specialty_id)

        if name is not None and name.strip():
            query = query.where(Doctor.name.ilike(f"%{name.strip()}%"))

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_id(self, doctor_id: int) -> Doctor | None:
        query = (
            select(Doctor)
            .options(selectinload(Doctor.specialty))
            .where(Doctor.id == doctor_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()


class SpecialtyRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[Specialty]:
        query = select(Specialty).order_by(Specialty.id)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_id(self, specialty_id: int) -> Specialty | None:
        query = select(Specialty).where(Specialty.id == specialty_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
