import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const CLOSE_DURATION_MS = 180;

export function Modal({ open, title, onClose, children }: ModalProps) {
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setClosing(false);
      return;
    }
    if (!rendered) return;
    setClosing(true);
    const timeout = setTimeout(() => setRendered(false), CLOSE_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [open, rendered]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!rendered) return null;

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
        opacity: closing ? 0 : 1,
        transition: `opacity ${CLOSE_DURATION_MS}ms ease`,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={closing ? undefined : 'fade-up'}
        style={{
          background: '#fff',
          borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--sh-lg)',
          width: '100%',
          maxWidth: '440px',
          padding: '26px',
          opacity: closing ? 0 : 1,
          transform: closing ? 'translateY(8px) scale(0.98)' : undefined,
          transition: closing ? `opacity ${CLOSE_DURATION_MS}ms ease, transform ${CLOSE_DURATION_MS}ms ease` : undefined,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: '18px', marginBottom: '16px' }}>{title}</div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
