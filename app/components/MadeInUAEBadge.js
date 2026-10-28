'use client';
import { useT } from '../context/LocaleContext';

// Inline pill badge — same treatment as MadeInFranceBadge, used under the brand
// name on Naya Lumière Perfumes products.
export function MadeInUAEBadge({ variant = 'light' }) {
  const isDark = variant === 'dark';
  const t = useT();
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        // The flag side is the narrow one, whichever way the page reads
        paddingBlock: '4px',
        paddingInlineStart: '5px',
        paddingInlineEnd: '10px',
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
      <UAEFlag />
      {t('Made in UAE')}
    </span>
  );
}

// The flag on its own — for tight spots like product cards, where the full pill is too much
export function UAEFlag({ title }) {
  return (
    <span
      role={title ? 'img' : undefined}
      aria-label={title}
      title={title}
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
      <span style={{ width: '4px', flexShrink: 0, background: '#EF3340' }} />
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span style={{ flex: 1, background: '#00732F' }} />
        <span style={{ flex: 1, background: '#FFFFFF' }} />
        <span style={{ flex: 1, background: '#000000' }} />
      </span>
    </span>
  );
}
