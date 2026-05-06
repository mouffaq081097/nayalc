'use client';

import React from 'react';

export function AccountSectionTitle({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-6">
      {eyebrow ? (
        <div className="flex items-center gap-2 mb-2">
          <span className="w-5 h-px" style={{ background: 'var(--brand-gradient)' }} />
          <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: 'var(--brand-purple-darker)' }}>
            {eyebrow}
          </p>
        </div>
      ) : null}
      <h1 className="text-[28px] font-bold leading-tight tracking-tight md:text-[36px]" style={{ color: '#3b0764' }}>
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-sm leading-relaxed md:text-base" style={{ color: 'rgba(59,7,100,0.50)' }}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
