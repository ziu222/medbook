# pyrefly: ignore [missing-import]
from fastapi import FastAPI

from app.core.exceptions import AppException, app_exception_handler
from app.health.router import router as health_router
from app.users.router import router as users_router
from app.doctors.router import doctors_router, specialties_router
from app.schedules.router import router as schedules_router
from app.appointments.router import router as appointments_router

app = FastAPI(title="MedBook API")

# Register application-specific exceptions
app.add_exception_handler(AppException, app_exception_handler)

# Include sub-routers for each feature module
app.include_router(health_router)
app.include_router(users_router)
app.include_router(doctors_router)
app.include_router(specialties_router)
app.include_router(schedules_router)
app.include_router(appointments_router)


@app.get("/")
def root():
    return {"message": "MedBook API is running"}