const INTRO_LINKS = ['Tổng quan Bệnh viện', 'Những cột mốc đáng nhớ', 'Cơ sở vật chất', 'Các danh hiệu cao quý', 'Đội ngũ Bác sĩ'];

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

function HospitalLogoMark() {
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
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5Z" fill="#06984F" />
        <path d="M12 8v8M8 12h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
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
            <HospitalLogoMark />
            <div style={{ lineHeight: 1.25 }}>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff', letterSpacing: '.5px' }}>MILITARY HOSPITAL</div>
              <div style={{ fontSize: '13.5px', color: '#9CC3B1', letterSpacing: '.3px' }}>BỆNH VIỆN QUÂN Y 175</div>
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
                  background: 'var(--coral)',
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
                <b style={{ color: '#fff', fontSize: '15px' }}>1900 1175</b>
              </div>
              <div>info@bvqy175.vn</div>
              <div>cskh@bvqy175.vn</div>
              <div>786 Nguyễn Kiệm, Phường Hạnh Thông, TP. Hồ Chí Minh</div>
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
          <div style={{ fontSize: '13px', color: '#8FBBA6', maxWidth: '720px' }}>
            Bản quyền thuộc về Bệnh viện Quân y 175 © 2026. Giấy phép hoạt động Trang thông tin điện tử trên Internet số
            319/QĐ-CT do Tổng cục Chính trị cấp ngày 26/01/2026.
          </div>
        </div>
      </div>
    </footer>
  );
}
