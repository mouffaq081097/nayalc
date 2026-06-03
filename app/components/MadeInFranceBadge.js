'use client';
import { useId } from 'react';

// Inline pill badge — used under brand name and in brand cards
export function MadeInFranceBadge({ variant = 'light' }) {
  const isDark = variant === 'dark';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px 4px 5px',
        borderRadius: '100px',
        background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(243,232,255,0.95)',
        border: `1px solid ${isDark ? 'rgba(216,180,254,0.30)' : 'rgba(147,51,234,0.25)'}`,
        backdropFilter: isDark ? 'blur(12px)' : undefined,
        fontSize: '10px',
        fontWeight: 800,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: isDark ? 'rgba(255,255,255,0.85)' : '#7c3aed',
        whiteSpace: 'nowrap',
        boxShadow: isDark ? 'none' : '0 1px 4px rgba(147,51,234,0.10)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          width: '16px',
          height: '11px',
          borderRadius: '2px',
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: '0 0 0 0.75px rgba(0,0,0,0.18)',
        }}
      >
        <span style={{ flex: 1, background: '#002395' }} />
        <span style={{ flex: 1, background: '#FFFFFF' }} />
        <span style={{ flex: 1, background: '#ED2939' }} />
      </span>
      Made in France
    </span>
  );
}

// Circular sticker badge — used on product card image corner and product detail page
export function MadeInFranceSticker({ size = 72 }) {
  const uid = useId().replace(/:/g, '');

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ display: 'block', filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.18))' }}
      aria-label="Made in France"
    >
      <defs>
        {/* Full clockwise circle path starting at 12 o'clock */}
        <path id={`tc-${uid}`} d="M 50,6 A 44,44 0 1,1 49.999,6" />
        <clipPath id={`fc-${uid}`}>
          <circle cx="50" cy="50" r="23" />
        </clipPath>
      </defs>

      {/* Outer white circle */}
      <circle cx="50" cy="50" r="48" fill="white" />
      <circle cx="50" cy="50" r="48" fill="none" stroke="#d1d5db" strokeWidth="0.75" />

      {/* French tricolor flag in center circle */}
      <g clipPath={`url(#fc-${uid})`}>
        <rect x="27" y="27" width="15.33" height="46" fill="#002395" />
        <rect x="42.33" y="27" width="15.33" height="46" fill="white" />
        <rect x="57.67" y="27" width="15.33" height="46" fill="#ED2939" />
      </g>
      <circle cx="50" cy="50" r="23" fill="none" stroke="#d1d5db" strokeWidth="0.75" />

      {/* Curved "MADE IN FRANCE" text around the ring */}
      <text
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="9.5"
        fontWeight="900"
        fill="#111827"
        letterSpacing="3.5"
      >
        <textPath href={`#tc-${uid}`} startOffset="57%">
          MADE IN FRANCE
        </textPath>
      </text>

      {/* Page curl effect at bottom-right */}
      <path d="M 78,80 Q 93,85 88,97 Q 77,91 73,80 Z" fill="#c8cbd0" />
      <path d="M 73,80 Q 77,91 88,97 Q 93,85 78,80 Z" fill="#f0f0f0" />
    </svg>
  );
}
