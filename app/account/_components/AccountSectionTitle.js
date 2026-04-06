'use client';

import React from 'react';

export function AccountSectionTitle({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-6">
      {eyebrow ? (
        <p className="app-mobile-label mb-2 text-brand-pink">{eyebrow}</p>
      ) : null}
      <h1 className="font-serif text-[30px] font-light leading-[1.05] tracking-tight text-[#1d1d1f] md:text-4xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-3 text-sm text-neutral-600 md:text-base">{subtitle}</p>
      ) : null}
    </div>
  );
}

