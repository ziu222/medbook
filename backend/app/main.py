from pathlib import Path

from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from mangum import Mangum

from app.appointments.router import router as appointments_router
from app.cancellations.router import router as cancellations_router
from app.doctors.router import router as doctors_router
from app.health.router import router as health_router
from app.payments.router import router as payments_router
from app.users.router import router as users_router

app = FastAPI(title="MedBook API")
app.include_router(appointments_router)
app.include_router(cancellations_router)
app.include_router(doctors_router)
app.include_router(health_router)
app.include_router(payments_router)
app.include_router(users_router)

asgi_handler = Mangum(app, lifespan="off")


def handler(event, context):
    if event.get("routeKey") == "POST /api/symptoms/classify":
        from app.chat.handler import handler as chat_handler

        return chat_handler(event, context)
    if event == {"operation": "alembic-upgrade"}:
        root = Path(__file__).resolve().parents[1]
        config = Config(root / "alembic.ini")
        config.set_main_option("script_location", str(root / "migrations"))
        command.upgrade(config, "head")
        return {"statusCode": 200, "body": "Migration completed"}

    if event == {"operation": "dispatch-notifications"}:
        from sqlalchemy.orm import Session

        from app.cancellations.service import dispatch_notifications
        from app.core.database import get_engine

        with Session(get_engine()) as session:
            count = dispatch_notifications(session)
        return {"statusCode": 200, "body": f"{count} notifications queued"}

    if event.get("Records") and all(
        record.get("eventSource") == "aws:sqs" for record in event["Records"]
    ):
        from app.cancellations.worker import handle_sqs

        return handle_sqs(event)

    return asgi_handler(event, context)
