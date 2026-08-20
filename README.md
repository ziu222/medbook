# MedBook

Nền tảng đặt lịch khám bệnh của Bệnh viện Quân y 175 — đặt lịch với bác sĩ theo chuyên khoa, thanh toán VNPAY, nhắc lịch tự động. Frontend React chạy độc lập, backend FastAPI triển khai dạng Lambda, hạ tầng AWS serverless quản lý bằng Terraform.

> Project môn Quản lý dự án phần mềm.

## Cấu trúc dự án

```
frontend/   Giao diện web (React + Vite + TypeScript)
backend/    API (FastAPI, chạy trên AWS Lambda qua Mangum)
infra/      Hạ tầng AWS (Terraform)
scripts/    Script tiện ích, tự động hoá
```

## Vai trò phụ trách

| Mảng | Phụ trách |
|---|---|
| Frontend | Trọng Nghĩa |
| Backend & Infra (DevOps) | Trọng Tín |
| Docs | Phương Nam |


## Backend

FastAPI + SQLAlchemy + Alembic, xác thực qua Cognito JWT (không tự xử lý mật khẩu — xem `app/core/auth.py`). Các module: `appointments`, `cancellations`, `doctors`, `payments` (VNPAY), `users`, `health`.


## Infra

Terraform, AWS serverless: API Gateway + Lambda, RDS Postgres, Cognito (đăng nhập/đăng ký qua Managed Login), SES + EventBridge (nhắc lịch/hủy lịch tự động), tích hợp VNPAY, domain riêng qua Cloudflare/ACM.


Chưa có CI/CD tự động deploy — apply hạ tầng và cập nhật code hiện vẫn làm thủ công.


