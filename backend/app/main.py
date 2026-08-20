from pathlib import Path

from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from mangum import Mangum

from app.appointments.router import router as appointments_router
from app.doctors.router import router as doctors_router
from app.health.router import router as health_router
from app.users.router import router as users_router

app = FastAPI(title="MedBook API")
app.include_router(appointments_router)
app.include_router(doctors_router)
app.include_router(health_router)
app.include_router(users_router)

asgi_handler = Mangum(app, lifespan="off")


def handler(event, context):
    if event == {"operation": "alembic-upgrade"}:
        root = Path(__file__).resolve().parents[1]
        config = Config(root / "alembic.ini")
        config.set_main_option("script_location", str(root / "migrations"))
        command.upgrade(config, "head")
        return {"statusCode": 200, "body": "Migration completed"}

    return asgi_handler(event, context)
