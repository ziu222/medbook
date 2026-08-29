import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20, 38, 31, 0.45)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 100,
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-up"
        style={{
          background: '#fff',
          borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--sh-lg)',
          width: '100%',
          maxWidth: '440px',
          padding: '26px',
        }}
      >
        <div style={{ fontWeight: 800, fontSize: '18px', marginBottom: '16px' }}>{title}</div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
