"""Seed medical specialties."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SPECIALTIES = (
    ("Nội tổng quát", "noi-tong-quat"),
    ("Tim mạch", "tim-mach"),
    ("Da liễu", "da-lieu"),
    ("Tai Mũi Họng", "tai-mui-hong"),
    ("Mắt", "mat"),
    ("Nhi khoa", "nhi-khoa"),
    ("Sản phụ khoa", "san-phu-khoa"),
    ("Cơ xương khớp", "co-xuong-khop"),
    ("Thần kinh", "than-kinh"),
    ("Tiêu hóa", "tieu-hoa"),
)


def upgrade() -> None:
    specialties = sa.table(
        "specialties",
        sa.column("name", sa.String()),
        sa.column("slug", sa.String()),
    )
    op.bulk_insert(
        specialties,
        [{"name": name, "slug": slug} for name, slug in SPECIALTIES],
    )


def downgrade() -> None:
    op.execute(
        sa.text("DELETE FROM specialties WHERE slug IN :slugs").bindparams(
            sa.bindparam(
                "slugs",
                expanding=True,
                value=[slug for _, slug in SPECIALTIES],
            )
        )
    )
