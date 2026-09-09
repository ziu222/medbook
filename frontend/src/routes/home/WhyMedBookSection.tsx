import type { CSSProperties, ReactNode } from 'react';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';

interface Feature {
  title: string;
  description: string;
  icon: ReactNode;
}

const FEATURES: Feature[] = [
  {
    title: 'Đặt lịch nhanh',
    description: 'Chọn bác sĩ, chọn khung giờ và xác nhận chỉ trong vài bước, không cần gọi điện chờ đợi.',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5.3l3.3 2" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: 'Bác sĩ đã xác thực',
    description: 'Hồ sơ, chuyên khoa và chứng chỉ của bác sĩ được kiểm duyệt trước khi hiển thị công khai.',
    icon: (
      <>
        <path d="M12 3 5 6v5c0 5 3.4 8.5 7 10 3.6-1.5 7-5 7-10V6Z" />
        <path d="m9 12 2 2 4-4" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: 'Thanh toán an toàn',
    description: 'Phí đặt lịch minh bạch, hoàn tiền theo chính sách rõ ràng khi hủy đúng hạn.',
    icon: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18M7 15h4" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: 'Nhắc lịch tự động',
    description: 'Nhận thông báo trước giờ khám và khi lịch hẹn có thay đổi, không lo bỏ lỡ.',
    icon: (
      <>
        <path d="M18 8a6 6 0 1 0-12 0c0 3.5-1.5 5.5-1.5 5.5h15S18 11.5 18 8Z" />
        <path d="M10.3 17a1.7 1.7 0 0 0 3.4 0" strokeLinecap="round" />
      </>
    ),
  },
];

function FeatureCard({ feature, style, className }: { feature: Feature; style?: CSSProperties; className?: string }) {
  return (
    <div className={className} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '20px', padding: '26px', ...style }}>
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: 'var(--tint)',
          display: 'grid',
          placeItems: 'center',
          marginBottom: '18px',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
          {feature.icon}
        </svg>
      </div>
      <h3 style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-.2px', margin: '0 0 8px' }}>{feature.title}</h3>
      <p style={{ color: 'var(--muted)', fontSize: '14.5px', lineHeight: 1.55, margin: 0 }}>{feature.description}</p>
    </div>
  );
}

export function WhyMedBookSection() {
  const { ref, active } = useRevealOnScroll<HTMLDivElement>();

  return (
    <section style={{ padding: '64px 0 8px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '34px', fontWeight: 800, letterSpacing: '-.7px', margin: 0 }}>Vì sao chọn MedBook</h2>
        <p style={{ color: 'var(--muted)', fontSize: '16px', margin: '10px 0 0' }}>Nền tảng đặt lịch khám được xây dựng cho cả người bệnh và bác sĩ</p>
      </div>
      <div ref={ref} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px' }}>
        {FEATURES.map((feature, i) => (
          <FeatureCard
            key={feature.title}
            feature={feature}
            className={`reveal-item${active ? ' reveal-active' : ''}`}
            style={{ transitionDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </section>
  );
}
