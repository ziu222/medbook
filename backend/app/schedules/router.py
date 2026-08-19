from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schedules.schemas import ScheduleResponse
from app.schedules.service import ScheduleService

router = APIRouter(prefix="/api/schedules", tags=["schedules"])


@router.get("", response_model=list[ScheduleResponse])
async def get_schedules(doctor_id: int, db: AsyncSession = Depends(get_db)):
    service = ScheduleService(db)
    return await service.get_schedules_by_doctor(doctor_id)
