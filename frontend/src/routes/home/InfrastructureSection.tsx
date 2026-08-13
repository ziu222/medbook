import { useState } from 'react';
import { ImageSlot } from '../../components/Common/ImageSlot';
import { infraTabs } from '../../lib/mockContent';

export function InfrastructureSection() {
  const [activeId, setActiveId] = useState(infraTabs[0].id);
  const active = infraTabs.find((tab) => tab.id === activeId) ?? infraTabs[0];

  return (
    <section style={{ padding: '64px 0 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '52px', alignItems: 'start' }}>
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '34px', fontWeight: 800, letterSpacing: '-.7px', lineHeight: 1.14, margin: '0 0 24px' }}>
          Cơ sở hạ tầng, trang thiết bị hiện đại hàng đầu
        </h2>
        <div
          style={{
            position: 'relative',
            aspectRatio: '16 / 9',
            borderRadius: '20px',
            overflow: 'hidden',
            background: 'var(--tint)',
            boxShadow: 'var(--sh)',
            marginTop: 'auto',
          }}
        >
          <ImageSlot placeholder="Video giới thiệu bệnh viện" shape="rect" fit="cover" />
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'var(--coral)',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 8px 26px rgba(242,106,79,.5)',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', gap: '26px', borderBottom: '1px solid var(--line)', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {infraTabs.map((tab) => (
            <span
              key={tab.id}
              onClick={() => setActiveId(tab.id)}
              style={{
                padding: '12px 2px',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                color: tab.id === activeId ? 'var(--brand)' : 'var(--muted)',
                borderBottom: tab.id === activeId ? '2.5px solid var(--brand)' : '2.5px solid transparent',
              }}
            >
              {tab.label}
            </span>
          ))}
        </div>
        <h3 style={{ fontSize: '21px', fontWeight: 800, letterSpacing: '-.3px', margin: '24px 0 12px' }}>{active.title}</h3>
        <p style={{ color: 'var(--ink2)', fontSize: '16px', lineHeight: 1.65, margin: '0 0 22px' }}>{active.description}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} style={{ aspectRatio: '3 / 4', borderRadius: '14px', overflow: 'hidden', background: 'var(--tint)' }}>
              <ImageSlot placeholder="Ảnh" shape="rect" fit="cover" />
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '9px',
            marginTop: '24px',
            padding: '13px 24px',
            borderRadius: '12px',
            background: 'var(--coral)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '15px',
            cursor: 'pointer',
          }}
        >
          Tìm hiểu thêm
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </div>
      </div>
    </section>
  );
}
