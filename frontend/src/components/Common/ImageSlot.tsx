import type { CSSProperties } from 'react';

export type ImageSlotShape = 'rect' | 'rounded' | 'circle' | 'pill';

interface ImageSlotProps {
  /** Real image URL. Omit to render the placeholder state. */
  src?: string;
  /** Label shown in the placeholder state and used as alt text once src is set. */
  placeholder: string;
  shape?: ImageSlotShape;
  fit?: 'cover' | 'contain';
  className?: string;
  style?: CSSProperties;
}

const RADIUS: Record<ImageSlotShape, string> = {
  rect: '0',
  rounded: 'var(--r-md)',
  circle: '50%',
  pill: '999px',
};

/**
 * Presentational stand-in for the design's <image-slot> custom element.
 * That element supported drag-drop upload with editor-only persistence;
 * here it's just a placeholder that renders a real <img> once `src` is set.
 */
export function ImageSlot({ src, placeholder, shape = 'rounded', fit = 'cover', className, style }: ImageSlotProps) {
  const borderRadius = RADIUS[shape];

  if (src) {
    return (
      <img
        src={src}
        alt={placeholder}
        className={className}
        style={{ width: '100%', height: '100%', objectFit: fit, borderRadius, display: 'block', ...style }}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={placeholder}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        borderRadius,
        background: 'var(--tint)',
        color: 'var(--faint)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontSize: '13.5px',
        fontWeight: 600,
        padding: '12px',
        ...style,
      }}
    >
      {placeholder}
    </div>
  );
}
