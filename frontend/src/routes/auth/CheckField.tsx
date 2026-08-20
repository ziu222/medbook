import type { ReactNode } from 'react';

interface CheckFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  align?: 'center' | 'flex-start';
}

export function CheckField({ checked, onChange, children, align = 'center' }: CheckFieldProps) {
  return (
    <label style={{ display: 'flex', alignItems: align, gap: '10px', fontSize: '14.5px', color: 'var(--ink2)', cursor: 'pointer', lineHeight: 1.5 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} />
      <span
        style={{
          width: '19px',
          height: '19px',
          borderRadius: '6px',
          background: checked ? 'var(--brand)' : '#fff',
          border: checked ? 'none' : '1.5px solid var(--line)',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          marginTop: align === 'flex-start' ? '1px' : 0,
          transition: 'background 0.15s ease, border-color 0.15s ease',
        }}
      >
        {checked && (
          <svg className="check-pop" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </span>
      {children}
    </label>
  );
}
