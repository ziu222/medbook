import type { InputHTMLAttributes, ReactNode } from 'react';

interface FieldInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: ReactNode;
  trailing?: ReactNode;
  compact?: boolean;
}

export function FieldInput({ icon, trailing, compact, style, ...inputProps }: FieldInputProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? '9px' : '10px',
        border: '1.5px solid var(--line)',
        borderRadius: '13px',
        padding: compact ? '12px 14px' : '13px 15px',
      }}
    >
      {icon}
      <input
        style={{ border: 'none', outline: 'none', fontSize: compact ? '15px' : '15.5px', width: '100%', background: 'transparent', ...style }}
        {...inputProps}
      />
      {trailing}
    </div>
  );
}
