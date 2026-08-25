from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.appointments.service import (
    get_available_slots,
    list_doctor_appointments,
    list_patient_appointments,
)
from app.chat.schemas import (
    CoreToolRequest,
    DoctorScheduleArgs,
    MyAppointmentsArgs,
    SearchDoctorsArgs,
)
from app.core.database import get_engine
from app.doctors.models import DoctorProfile
from app.doctors.service import list_specialties


def _execute(session: Session, raw_request: dict) -> list[dict]:
    request = CoreToolRequest.model_validate(raw_request)
    if request.tool == "list_specialties":
        if request.arguments:
            raise ValueError("list_specialties does not accept arguments")
        return [
            {"id": specialty.id, "name": specialty.name}
            for specialty in list_specialties(session)
        ]

    if request.tool == "search_doctors":
        arguments = SearchDoctorsArgs.model_validate(request.arguments)
        statement = (
            select(DoctorProfile)
            .options(
                joinedload(DoctorProfile.specialty),
                joinedload(DoctorProfile.facility),
            )
            .where(DoctorProfile.specialty_id == arguments.specialty_id)
            .order_by(DoctorProfile.display_name, DoctorProfile.id)
            .limit(10)
        )
        if arguments.facility_id:
            statement = statement.where(
                DoctorProfile.facility_id == arguments.facility_id
            )
        if arguments.name:
            statement = statement.where(
                DoctorProfile.display_name.ilike(f"%{arguments.name}%")
            )
        doctors = session.scalars(statement)
        return [
            {
                "doctor_id": doctor.id,
                "doctor_name": doctor.display_name,
                "specialty_name": doctor.specialty.name,
                "facility_name": doctor.facility.name if doctor.facility else None,
                "rating": float(doctor.rating),
                "available_slots": [
                    slot.start_time.isoformat()
                    for slot in (
                        get_available_slots(
                            session, doctor.id, arguments.appointment_date
                        )
                        if arguments.appointment_date
                        else []
                    )[:5]
                ],
            }
            for doctor in doctors
        ]

    if request.tool == "get_doctor_schedule":
        arguments = DoctorScheduleArgs.model_validate(request.arguments)
        return [
            {
                "start_time": slot.start_time.isoformat(),
                "end_time": slot.end_time.isoformat(),
            }
            for slot in get_available_slots(
                session, arguments.doctor_id, arguments.appointment_date
            )
        ]

    arguments = MyAppointmentsArgs.model_validate(request.arguments)
    if request.identity.groups == {"patient"}:
        appointments = list_patient_appointments(
            session,
            request.identity.subject,
            appointment_date=arguments.appointment_date,
            appointment_status=arguments.status,
            limit=10,
            offset=0,
        )
    elif request.identity.groups == {"doctor"}:
        appointments = list_doctor_appointments(
            session,
            request.identity.subject,
            appointment_date=arguments.appointment_date,
            appointment_status=arguments.status,
            limit=10,
            offset=0,
        )
    else:
        raise PermissionError("Patient or doctor role required")
    return [
        {
            "appointment_id": appointment.id,
            "doctor_id": appointment.doctor_id,
            "appointment_date": appointment.appointment_date.isoformat(),
            "start_time": appointment.start_time.isoformat(),
            "status": appointment.status,
            "booking_for": appointment.booking_for,
        }
        for appointment in appointments
    ]


def handler(event, _context):
    with Session(get_engine()) as session:
        return _execute(session, event)
