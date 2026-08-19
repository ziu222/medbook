"""
Alembic env.py — sync engine configuration dùng psycopg2.

Alembic chạy migrations synchronously nên KHÔNG dùng asyncpg.
FastAPI runtime vẫn dùng asyncpg qua SQLAlchemy async engine.
Hai driver này hoạt động song song, không xung đột.
"""
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# ── Đọc DATABASE_URL từ .env ──────────────────────────────────────────────────
from app.core.config import settings
from app.core.database import Base

# ── Import TẤT CẢ models để Base.metadata nhận diện đủ bảng ─────────────────
# Quy tắc: thêm module mới → thêm import tương ứng ở đây
import app.doctors.models      # noqa: F401 → bảng: specialties, doctors
import app.users.models        # noqa: F401 → bảng: users
import app.schedules.models    # noqa: F401 → bảng: schedules
import app.appointments.models # noqa: F401 → bảng: appointments

# ─────────────────────────────────────────────────────────────────────────────

config = context.config

# Đọc log config từ alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Truyền DATABASE_URL từ .env vào alembic
# asyncpg (dùng cho FastAPI) → đổi thành psycopg2 (dùng cho Alembic sync)
sync_url = settings.DATABASE_URL.replace(
    "postgresql+asyncpg://", "postgresql+psycopg2://"
)
config.set_main_option("sqlalchemy.url", sync_url)

# Metadata chứa toàn bộ bảng — Alembic dùng để so sánh diff với DB
target_metadata = Base.metadata


# ── Offline mode (sinh SQL ra file, không kết nối DB thật) ───────────────────
def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


# ── Online mode (kết nối DB thật và chạy migration) ──────────────────────────
def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,  # phát hiện thay đổi kiểu cột
        )
        with context.begin_transaction():
            context.run_migrations()


# ── Entry point ───────────────────────────────────────────────────────────────
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
