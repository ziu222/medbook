"""
Script seed dữ liệu mẫu cho môi trường development/test.

Đặc điểm:
  - IDEMPOTENT: chạy nhiều lần không bị lỗi (dùng ON CONFLICT DO NOTHING / DO UPDATE)
  - Seed specialties + doctors đầy đủ fields
  - Seed user test (dùng để test appointments không cần Cognito thật)
  - KHÔNG dùng cho production

Cách chạy (từ thư mục backend/):
  python seed.py
"""
import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal


# ── Dữ liệu mẫu ──────────────────────────────────────────────────────────────

SPECIALTIES_SQL = """
INSERT INTO specialties (id, name, description) VALUES
  (1, 'Tim mach',   'Chuyen khoa ve tim va mach mau'),
  (2, 'Than kinh',  'Chuyen khoa ve he than kinh'),
  (3, 'Nhi khoa',   'Chuyen khoa ve tre em'),
  (4, 'Da lieu',    'Chuyen khoa ve da va cac benh lien quan'),
  (5, 'Chinh hinh', 'Chuyen khoa ve xuong khop')
ON CONFLICT (id) DO NOTHING;
"""

RESET_SPECIALTIES_SEQ = (
    "SELECT setval('specialties_id_seq', (SELECT MAX(id) FROM specialties));"
)

# Dùng ON CONFLICT (email) DO UPDATE để cập nhật level/certificates
# nếu chạy lại seed trên DB đã có data
DOCTORS_SQL = """
INSERT INTO doctors (name, email, phone, bio, experience_years, level, certificates, specialty_id)
VALUES
  (
    'BS. Nguyen Van An', 'nguyenvanan@medbook.vn', '0901234567',
    'Chuyen gia Tim mach, 10 nam kinh nghiem tai BV Cho Ray.',
    10, 'Thac si', 'Chung chi Tim mach can thiep, Chung chi Sieu am tim', 1
  ),
  (
    'BS. Tran Thi Binh', 'tranthibibinh@medbook.vn', '0912345678',
    'Bac si Than kinh, tung cong tac tai BV Bach Mai.',
    8, 'Tien si', 'Chung chi Than kinh lam sang, Chung chi Dien nao do', 2
  ),
  (
    'BS. Le Minh Tuan', 'leminhtuan@medbook.vn', '0923456789',
    'Nhi khoa, chuyen dieu tri benh ho hap o tre em.',
    6, 'Bac si', 'Chung chi Nhi khoa, Chung chi Ho hap nhi', 3
  ),
  (
    'BS. Pham Thu Ha', 'phamthuha@medbook.vn', '0934567890',
    'Da lieu, chuyen tri mun, nam va benh da man tinh.',
    5, 'Thac si', 'Chung chi Da lieu tham my, Chung chi Laser da lieu', 4
  ),
  (
    'BS. Hoang Duc Thinh', 'hoangducthinh@medbook.vn', '0945678901',
    'Chinh hinh, chuyen phau thuat khop goi va cot song.',
    12, 'Giao su', 'Chung chi Phau thuat khop, Chung chi Chinh hinh tham my', 5
  )
ON CONFLICT (email) DO UPDATE SET
  name             = EXCLUDED.name,
  phone            = EXCLUDED.phone,
  bio              = EXCLUDED.bio,
  experience_years = EXCLUDED.experience_years,
  level            = EXCLUDED.level,
  certificates     = EXCLUDED.certificates,
  specialty_id     = EXCLUDED.specialty_id;
"""

# User test khớp với sub placeholder trong auth.py
USERS_SQL = """
INSERT INTO users (cognito_sub, name, email, phone) VALUES
  ('user_id_placeholder', 'Test User', 'testuser@medbook.vn', '0900000000')
ON CONFLICT (cognito_sub) DO UPDATE SET
  name  = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone;
"""


# ── Hàm seed ─────────────────────────────────────────────────────────────────

async def seed() -> None:
    async with AsyncSessionLocal() as db:
        print("[START] Bat dau seed du lieu...\n")

        # 1. Specialties
        print("[1/3] Seed bang specialties...")
        await db.execute(text(SPECIALTIES_SQL))
        await db.execute(text(RESET_SPECIALTIES_SEQ))
        result = await db.execute(text("SELECT COUNT(*) FROM specialties"))
        print(f"   -> Tong specialties trong DB: {result.scalar()}\n")

        # 2. Doctors
        print("[2/3] Seed bang doctors (voi level + certificates)...")
        await db.execute(text(DOCTORS_SQL))
        result = await db.execute(text("SELECT COUNT(*) FROM doctors"))
        print(f"   -> Tong doctors trong DB: {result.scalar()}\n")

        # 3. Test user
        print("[3/3] Seed test user (cognito_sub = user_id_placeholder)...")
        await db.execute(text(USERS_SQL))
        result = await db.execute(text("SELECT COUNT(*) FROM users"))
        print(f"   -> Tong users trong DB: {result.scalar()}\n")

        await db.commit()
        print("[DONE] Seed hoan tat!")
        print("       Chay lai bat ky luc nao cung an toan (ON CONFLICT DO UPDATE).")


if __name__ == "__main__":
    asyncio.run(seed())
