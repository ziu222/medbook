from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Specialty(Base):
    __tablename__ = "specialties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)

    doctors: Mapped[list["Doctor"]] = relationship("Doctor", back_populates="specialty")


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    phone: Mapped[str] = mapped_column(String, nullable=True)
    avatar_url: Mapped[str] = mapped_column(String, nullable=True)
    bio: Mapped[str] = mapped_column(String, nullable=True)
    experience_years: Mapped[int] = mapped_column(Integer, default=0)

    # Cấp bậc chuyên môn: "Bác sĩ" / "Thạc sĩ" / "Tiến sĩ" / "Giáo sư"
    level: Mapped[str] = mapped_column(String, nullable=True)

    # Danh sách chứng chỉ, lưu dạng chuỗi phân cách bằng dấu phẩy
    # VD: "Chứng chỉ Tim mạch can thiệp, Chứng chỉ Siêu âm tim"
    certificates: Mapped[str] = mapped_column(String, nullable=True)

    specialty_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("specialties.id"), nullable=False
    )
    specialty: Mapped["Specialty"] = relationship("Specialty", back_populates="doctors")
