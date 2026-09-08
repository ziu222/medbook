const INTRO_LINKS = ['Về MedBook', 'Đối tác phòng khám', 'Tuyển dụng', 'Đội ngũ Bác sĩ'];

const UTILITY_LINKS = [
  'Lịch khám bệnh',
  'Bảng giá dịch vụ',
  'Quy trình khám bệnh',
  'Tìm Chuyên khoa',
  'Tin mời thầu',
  'Xem bản đồ',
  'Liên hệ',
];

function FooterLinkColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff', marginBottom: '16px' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '14px' }}>
        {links.map((link) => (
          <span key={link} className="footer-link-hover" style={{ cursor: 'pointer', color: '#BDD8CB' }}>
            {link}
          </span>
        ))}
      </div>
    </div>
  );
}

function SocialIcon({ label }: { label: string }) {
  return (
    <span
      className="btn-hover"
      style={{
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,.1)',
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: '13px',
      }}
    >
      {label}
    </span>
  );
}

function BrandMark() {
  return (
    <div
      style={{
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,.08)',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      <img src="/favicon.svg" alt="" style={{ width: '26px', height: '26px' }} />
    </div>
  );
}

export function Footer() {
  return (
    <footer style={{ background: 'var(--forest)', marginTop: '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px 0' }}>
        {/* top row: logo + newsletter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <BrandMark />
            <div style={{ lineHeight: 1.25 }}>
              <div style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '.3px' }}>
                <span style={{ color: '#fff' }}>Med</span>
                <span style={{ color: '#5fe0b3' }}>Book</span>
              </div>
              <div style={{ fontSize: '13.5px', color: '#9CC3B1', letterSpacing: '.3px' }}>Nền tảng đặt lịch khám bệnh</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14.5px', color: '#BDD8CB', maxWidth: '230px', lineHeight: 1.45 }}>
              Theo dõi tin tức và dịch vụ mới nhất của chúng tôi
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                placeholder="Nhập email của bạn"
                style={{
                  border: '1px solid rgba(255,255,255,.2)',
                  background: 'rgba(255,255,255,.06)',
                  borderRadius: '11px',
                  padding: '12px 16px',
                  fontSize: '14.5px',
                  color: '#fff',
                  outline: 'none',
                  width: '220px',
                }}
              />
              <span
                className="btn-hover"
                style={{
                  padding: '12px 24px',
                  borderRadius: '11px',
                  background: 'var(--brand-grad)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '14.5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Đăng ký
              </span>
            </div>
          </div>
        </div>

        {/* link columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: '32px', padding: '40px 0 34px' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff', marginBottom: '16px' }}>Liên hệ</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '14px', lineHeight: 1.5, color: '#BDD8CB' }}>
              <div>
                <b style={{ color: '#fff', fontSize: '15px' }}>1900 8888</b>
              </div>
              <div>info@medbook.vn</div>
              <div>cskh@medbook.vn</div>
              <div>12 Đường Sức Khỏe, Phường Bình Thạnh, TP. Hồ Chí Minh</div>
            </div>
          </div>

          <FooterLinkColumn title="Giới thiệu" links={INTRO_LINKS} />
          <FooterLinkColumn title="Tiện ích" links={UTILITY_LINKS} />

          <div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff', marginBottom: '16px' }}>Mạng xã hội</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <SocialIcon label="FB" />
              <SocialIcon label="YT" />
              <SocialIcon label="Za" />
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff', marginBottom: '16px' }}>Tải ứng dụng</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span
                className="btn-hover"
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,.08)',
                  color: '#fff',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                GET IT ON
                <br />
                Google Play
              </span>
              <span
                className="btn-hover"
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,.08)',
                  color: '#fff',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                DOWNLOAD ON THE
                <br />
                App Store
              </span>
            </div>
          </div>
        </div>

        {/* bottom bar */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,.12)',
            padding: '22px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', fontSize: '13.5px', color: '#BDD8CB' }}>
            <span className="footer-link-hover" style={{ cursor: 'pointer' }}>
              Chính sách bảo mật thông tin website
            </span>
            <span>|</span>
            <span className="footer-link-hover" style={{ cursor: 'pointer' }}>
              Điều khoản sử dụng website
            </span>
          </div>
          <div style={{ fontSize: '13px', color: '#8FBBA6', maxWidth: '720px' }}>Bản quyền thuộc về MedBook © 2026.</div>
        </div>
      </div>
    </footer>
  );
}
