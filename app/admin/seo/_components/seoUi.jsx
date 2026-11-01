'use client';
import React from 'react';
import Link from 'next/link';
import { Wand2 } from 'lucide-react';
import { GOOGLE_CATEGORIES, googleCategory } from '@/lib/googleTaxonomy';
import { writeAltText } from '@/lib/seoWriter';
import { secondary, subdued, WARNING_COLOR } from '../../_components/EditorFields';

// Shared pieces of Admin → SEO and the editors' search, alt text and Google category fields

export const SEO_PAGES = [
  { to: '/admin/seo', text: 'Overview' },
  { to: '/admin/seo/products', text: 'Product listings' },
  { to: '/admin/seo/images', text: 'Image alt text' },
  { to: '/admin/seo/merchant', text: 'Google Merchant' },
];

/** The section's own tabs, under the page title. */
export const SeoTabs = ({ current }) => (
  <nav aria-label="SEO" className="flex gap-1 overflow-x-auto no-scrollbar -mx-1 px-1">
    {SEO_PAGES.map(page => (
      <Link
        key={page.to}
        href={page.to}
        aria-current={current === page.to ? 'page' : undefined}
        className="shrink-0 h-8 px-3 rounded-lg text-[13px] font-medium inline-flex items-center transition-colors hover:bg-[#f1f1f1]"
        style={current === page.to ? { background: '#ebebeb', color: 'var(--sp-text)' } : secondary}
      >
        {page.text}
      </Link>
    ))}
  </nav>
);

// Menu groups, in the order a beauty shop needs them
const GROUPS = [
  ['Skin care', (c) => c.path.includes('> Skin Care')],
  ['Perfume and home fragrance', (c) => c.id === 479 || c.path.startsWith('Home & Garden')],
  ['Bath and body', (c) => c.path.includes('Bath & Body') || c.path.includes('Massage') || c.path.includes('Deodorant')],
  ['Hair care', (c) => c.path.includes('Hair Care')],
  ['Sets, make-up, nails and tools', (c) => /Cosmetic Sets|Makeup|Nail Care|Cosmetic Tools/.test(c.path)],
  ['General', () => true],
];
const GROUPED = (() => {
  const used = new Set();
  return GROUPS.map(([label, test]) => {
    const items = GOOGLE_CATEGORIES.filter(c => !used.has(c.id) && test(c));
    items.forEach(c => used.add(c.id));
    return { label, items };
  }).filter(g => g.items.length);
})();

/**
 * A Google product category menu. '' is "automatic", described by `autoLabel`
 * ("Automatic: Skin Care > Facial Cleansers").
 */
export function GoogleCategorySelect({ id, value, onChange, autoLabel = 'Automatic', disabled }) {
  return (
    <select id={id} value={value ? String(value) : ''} onChange={e => onChange(e.target.value ? Number(e.target.value) : null)} className="sp-input cursor-pointer" disabled={disabled}>
      <option value="">{autoLabel}</option>
      {GROUPED.map(group => (
        <optgroup key={group.label} label={group.label}>
          {group.items.map(c => <option key={c.id} value={String(c.id)}>{c.label}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

export const categoryLabel = (id) => googleCategory(id)?.label || '—';

/** "48 / 60", amber once over the limit Google shows. */
export const CharCount = ({ value, limit }) => {
  const n = (value || '').length;
  return (
    <span className="text-[12px] tabular-nums" style={n > limit ? { color: WARNING_COLOR, fontWeight: 600 } : subdued}>
      {n} / {limit}
    </span>
  );
};

/** How the page can look in Google's results. */
export const SerpPreview = ({ path, title, description }) => (
  <div className="rounded-lg p-4" style={{ background: 'var(--sp-surface-sub)' }}>
    <p className="text-[12px] truncate" style={secondary}>nayalc.com › {path}</p>
    <p className="text-[17px] leading-snug mt-0.5 line-clamp-1" style={{ color: '#1a0dab' }}>{title}</p>
    <p className="text-[13px] mt-1 line-clamp-2" style={secondary}>{description}</p>
  </div>
);

/** "Fill in": writes the text from the details already there (lib/seoWriter.js), instantly and for free. */
export const FillButton = ({ onClick, disabled, children = 'Fill in', title = 'Write it from the details already here' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="sp-btn sp-btn-secondary shrink-0"
    style={{ padding: '5px 10px' }}
  >
    <Wand2 size={13} style={{ color: '#7c3aed' }} />
    {children}
  </button>
);

/** One alt text box with its "Fill in" button, for the editors. `context` is { kind, label, detail }. */
export function AltTextField({ id, value, onChange, context, placeholder, hint = 'Describes the image for people using screen readers, and for Google Images.' }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label htmlFor={id} className="text-[13px] font-medium" style={secondary}>Alt text</label>
        <FillButton onClick={() => onChange(writeAltText(context || {}))} disabled={!context?.label && !context?.detail} title="Write it from the details of this image" />
      </div>
      <input id={id} type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={250} className="sp-input" />
      <p className="text-[12px] mt-1.5" style={subdued}>{hint}</p>
    </div>
  );
}
