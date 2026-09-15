'use client';
import React, { useCallback, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';

// Shared building blocks for full-page admin editors (products, categories)

export const text = { color: 'var(--sp-text)' };
export const secondary = { color: 'var(--sp-text-secondary)' };
export const subdued = { color: 'var(--sp-text-subdued)' };
export const ERROR_COLOR = '#b42318';
export const WARNING_COLOR = '#8a6100';

export const Card = ({ title, description, action, children }) => (
  <section className="sp-card sp-card-pad">
    {(title || action) && (
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="sp-section-title">{title}</h2>
          {description && <p className="text-[12px] mt-0.5" style={subdued}>{description}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);

export const FieldMessage = ({ color, children }) => (
  <p className="flex items-start gap-1 text-[12px] mt-1.5" style={{ color }}>
    <AlertCircle size={13} className="shrink-0 mt-px" />{children}
  </p>
);

export const Field = ({ label, htmlFor, hint, error, optional, children }) => (
  <div>
    <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-[13px] font-medium mb-1.5" style={secondary}>
      {label}
      {optional && <span className="font-normal" style={subdued}>(optional)</span>}
    </label>
    {children}
    {error
      ? <FieldMessage color={ERROR_COLOR}>{error}</FieldMessage>
      : hint && <p className="text-[12px] mt-1.5" style={subdued}>{hint}</p>}
  </div>
);

export const invalidStyle = (error, extra) => ({ ...(error ? { borderColor: ERROR_COLOR } : null), ...extra });

// Grows with its content so long copy is readable without an inner scrollbar
export const AutoGrowTextarea = ({ minRows = 3, maxHeight = 480, value, style, ...props }) => {
  const ref = useRef(null);
  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const needed = el.scrollHeight + 2; // + top and bottom border
    el.style.height = `${Math.min(needed, maxHeight)}px`;
    el.style.overflowY = needed > maxHeight ? 'auto' : 'hidden';
  }, [maxHeight]);

  useEffect(() => { resize(); }, [value, resize]);

  // Text wraps differently once the web font loads or the column changes width, so measure again then
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    document.fonts?.ready.then(resize);
    if (typeof ResizeObserver === 'undefined') return undefined;
    let lastWidth = el.clientWidth;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === lastWidth) return;
      lastWidth = el.clientWidth;
      resize();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [resize]);

  return <textarea ref={ref} rows={minRows} value={value} className="sp-input" style={{ resize: 'vertical', ...style }} {...props} />;
};
