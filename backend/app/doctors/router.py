from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.doctors.schemas import DoctorResponse, SpecialtyResponse
from app.doctors.service import DoctorService, SpecialtyService

# Router riêng cho doctors
doctors_router = APIRouter(prefix="/api/doctors", tags=["doctors"])

# Router riêng cho specialties
specialties_router = APIRouter(prefix="/api/specialties", tags=["specialties"])


# ── Doctor endpoints ──────────────────────────────────────────────────────────

@doctors_router.get("", response_model=list[DoctorResponse])
async def get_doctors(
    specialty_id: int | None = Query(default=None, description="Lọc theo ID chuyên khoa"),
    name: str | None = Query(default=None, description="Tìm kiếm theo tên bác sĩ"),
    db: AsyncSession = Depends(get_db),
):
    service = DoctorService(db)
    return await service.search_doctors(specialty_id=specialty_id, name=name)


@doctors_router.get("/{doctor_id}", response_model=DoctorResponse)
async def get_doctor(doctor_id: int, db: AsyncSession = Depends(get_db)):
    service = DoctorService(db)
    doctor = await service.get_doctor_by_id(doctor_id)
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy bác sĩ với ID {doctor_id}",
        )
    return doctor


# ── Specialty endpoints ───────────────────────────────────────────────────────

@specialties_router.get("", response_model=list[SpecialtyResponse])
async def get_specialties(db: AsyncSession = Depends(get_db)):
    service = SpecialtyService(db)
    return await service.get_all_specialties()
