'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Package, Search, X } from 'lucide-react';
import { hasRole } from '@/lib/erp/roles';
import { fmtMoney } from '@/lib/erp/documents';
import { ERROR_COLOR, secondary, subdued, text } from '../../_components/EditorFields';

// Shared building blocks for the purchasing pages (PR, PO, GRN, costing)

export { text, secondary, subdued };

export const fmtDate = (value) => (value
  ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Dubai' })
  : '—');

// Dates from DATE columns arrive as ISO timestamps; inputs want YYYY-MM-DD in Dubai
export const toDateInput = (value) => (value
  ? new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' })
  : '');

export const aed = (value) => fmtMoney(value, 'AED');

/** fetch() that returns the JSON body or throws the API's own message */
export async function api(url, { method = 'GET', body } = {}) {
  const res = await fetch(url, {
    method,
    cache: 'no-store',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || 'Something went wrong. Please try again.');
  return json;
}

/** Loads `url` once and on reload(). Returns { data, error, reload, setData, can } */
export function usePurchasing(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!url) return;
    try {
      setData(await api(url));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [url]);

  useEffect(() => { reload(); }, [reload]);
  const can = useCallback((role) => hasRole(data?.access, role), [data?.access]);
  return { data, error, reload, setData, can };
}

/** Products for pickers: id → { name, brand, stock, owed, on order, cost } */
export function usePurchasingProducts() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    api('/api/admin/purchasing/products').then(r => setProducts(r.products)).catch(() => setProducts([]));
  }, []);
  return products;
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState(null);
  useEffect(() => {
    api('/api/admin/purchasing/suppliers').then(r => setSuppliers(r.suppliers)).catch(() => setSuppliers([]));
  }, []);
  return suppliers;
}

export const StatusBadge = ({ map, status }) => {
  const s = map[status] || { label: status, cls: 'sp-badge-neutral' };
  return <span className={`sp-badge ${s.cls}`}>{s.label}</span>;
};

export const PageHeader = ({ title, subtitle, back, badges, actions }) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
    {back && (
      <Link href={back} aria-label="Back" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#e3e3e3] transition-colors" style={secondary}>
        <ArrowLeft size={18} />
      </Link>
    )}
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-[20px] font-semibold leading-tight truncate" style={text}>{title}</h1>
        {badges}
      </div>
      {subtitle && <p className="text-[13px] mt-0.5" style={subdued}>{subtitle}</p>}
    </div>
    {/* On phones the actions take their own full-width row, sharing it equally */}
    {actions && (
      <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap items-center gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
        {actions}
      </div>
    )}
  </div>
);

export const ErrorBanner = ({ children }) => (children ? (
  <div className="flex items-center gap-2 text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">
    <AlertCircle size={14} className="shrink-0" />{children}
  </div>
) : null);

export const Notice = ({ tone = 'info', children }) => {
  const tones = {
    info: { background: '#eaf4ff', color: '#00527c' },
    warning: { background: '#fff4dc', color: '#5e4200' },
    success: { background: '#e6f6ec', color: '#0c5132' },
  };
  return <div className="text-[13px] px-3 py-2.5 rounded-lg leading-relaxed" style={tones[tone]}>{children}</div>;
};

export const SectionCard = ({ title, hint, action, children, padded = false }) => (
  <section className="sp-card overflow-hidden">
    {(title || action) && (
      <div className="px-5 py-3 flex items-start justify-between gap-3" style={{ borderBottom: '1px solid var(--sp-border)' }}>
        <div>
          <h2 className="sp-section-title">{title}</h2>
          {hint && <p className="text-[12px] mt-0.5" style={subdued}>{hint}</p>}
        </div>
        {action}
      </div>
    )}
    <div className={padded ? 'p-5' : undefined}>{children}</div>
  </section>
);

/**
 * Stat tiles: two columns on phones, one row from md up. Hairlines come from the
 * 1px gap over a border-coloured background; an odd last tile spans the row on phones.
 */
export const StatGrid = ({ children }) => (
  <div
    className="sp-card overflow-hidden grid grid-cols-2 md:grid-flow-col md:auto-cols-fr gap-px [&>*:last-child:nth-child(odd)]:col-span-2 md:[&>*:last-child:nth-child(odd)]:col-span-1"
    style={{ background: 'var(--sp-border)' }}
  >
    {children}
  </div>
);

export const StatCell = ({ label, value, hint, href }) => {
  const body = (
    <>
      <p className="text-[12px] mb-2"><span className="sp-stat-label">{label}</span></p>
      <p className="text-[18px] md:text-[20px] font-semibold leading-none whitespace-nowrap" style={text}>{value}</p>
      <p className="text-[12px] mt-2" style={subdued}>{hint || ' '}</p>
    </>
  );
  const cls = 'px-4 py-3.5 md:px-5 md:py-4 bg-white min-w-0';
  return href
    ? <Link href={href} className={`${cls} hover:bg-[#fafafa] transition-colors`}>{body}</Link>
    : <div className={cls}>{body}</div>;
};

/** A table row as a card on phones: heading + badge on top, the other fields below */
export const MobileCard = ({ title, badge, fields, onClick }) => (
  // A div, not a button: fields may hold links
  <div
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={e => { if (e.key === 'Enter') onClick(); }}
    className="w-full text-left px-4 py-3 cursor-pointer hover:bg-[#fafafa] transition-colors"
    style={{ borderBottom: '1px solid #f1f1f1' }}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 text-[14px] font-semibold" style={text}>{title}</div>
      {badge && <div className="shrink-0">{badge}</div>}
    </div>
    {fields.length > 0 && (
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
        {fields.map(f => (
          <div key={f.label} className="min-w-0">
            <dt className="text-[11px]" style={subdued}>{f.label}</dt>
            <dd className="text-[13px] truncate">{f.value}</dd>
          </div>
        ))}
      </dl>
    )}
  </div>
);

export const MetaRow = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-1.5 text-[13px]">
    <span style={subdued}>{label}</span>
    <span className="text-right" style={text}>{children}</span>
  </div>
);

export const FieldLabel = ({ htmlFor, children, optional }) => (
  <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-[13px] font-medium mb-1.5" style={secondary}>
    {children}
    {optional && <span className="font-normal" style={subdued}>(optional)</span>}
  </label>
);

/** A button that runs an async action, shows it working and stays disabled meanwhile */
export function ActionButton({ onClick, children, busyText, variant = 'secondary', confirm, disabled, className = '' }) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (confirm && !window.confirm(confirm)) return;
    setBusy(true);
    try {
      await onClick();
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" onClick={run} disabled={busy || disabled} className={`sp-btn sp-btn-${variant} ${className}`}>
      {busy ? (busyText || 'Working…') : children}
    </button>
  );
}

export function Dialog({ open, title, children, onClose, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }} onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="sp-card w-full max-w-[560px] max-h-[90vh] flex flex-col" onMouseDown={e => e.stopPropagation()}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--sp-border)' }}>
          <h2 className="sp-section-title">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#ebebeb]" style={secondary}>
            <X size={16} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">{children}</div>
        {footer && <div className="px-5 py-3 flex justify-end gap-2" style={{ borderTop: '1px solid var(--sp-border)' }}>{footer}</div>}
      </div>
    </div>
  );
}

export const ProductThumb = ({ image }) => (
  <span className="w-9 h-9 rounded-md shrink-0 flex items-center justify-center overflow-hidden" style={{ background: 'var(--sp-surface-sub)', border: '1px solid #ebebeb' }}>
    {image
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={image} alt="" className="w-full h-full object-contain" />
      : <Package size={16} style={subdued} />}
  </span>
);

/** Stock facts under a product name: "12 on shelf · 3 owed · 10 on order" */
export const stockLine = (p) => p && [
  `${p.stock_quantity} on shelf`,
  p.owed > 0 && `${p.owed} owed to pre-orders`,
  p.on_order > 0 && `${p.on_order} on order`,
].filter(Boolean).join(' · ');

/** Search box that adds a product to a document */
export function ProductSearch({ products, excludeIds = [], onPick, error }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter(p => !excludeIds.includes(p.id))
      .filter(p => !q || p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q))
      .slice(0, 30);
  }, [products, excludeIds, query]);

  const pick = (p) => {
    onPick(p);
    setQuery('');
  };

  return (
    <div ref={boxRef} className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={subdued} />
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'Enter') {
            e.preventDefault();
            if (matches[0]) pick(matches[0]);
          }
        }}
        placeholder="Search products to add"
        aria-label="Search products to add"
        className="sp-input"
        style={{ paddingLeft: 34, ...(error ? { borderColor: ERROR_COLOR } : null) }}
        autoComplete="off"
      />
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 sp-card p-1 max-h-[300px] overflow-y-auto" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {matches.length === 0 ? (
            <p className="px-3 py-2.5 text-[13px]" style={subdued}>{products.length === 0 ? 'Loading products…' : 'No matching products'}</p>
          ) : matches.map(p => (
            <button key={p.id} type="button" onClick={() => pick(p)} className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-left hover:bg-[#f1f1f1] transition-colors">
              <ProductThumb image={p.image} />
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] truncate" style={text}>{p.name}</span>
                <span className="block text-[12px] truncate" style={subdued}>{[p.brand, stockLine(p)].filter(Boolean).join(' · ')}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-[12px] mt-1.5" style={{ color: ERROR_COLOR }}>{error}</p>}
    </div>
  );
}

export const RemoveButton = ({ onClick, label }) => (
  <button type="button" onClick={onClick} aria-label={label} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#e3e3e3] transition-colors" style={secondary}>
    <X size={14} />
  </button>
);

/** <select> of active suppliers */
export const SupplierSelect = ({ id, suppliers, value, onChange, allowNone, noneLabel = 'Not decided yet', disabled }) => (
  <select id={id} className="sp-input" value={value || ''} onChange={e => onChange(e.target.value ? Number(e.target.value) : null)} disabled={disabled}>
    {allowNone ? <option value="">{noneLabel}</option> : <option value="" disabled>Choose a supplier</option>}
    {(suppliers || []).filter(s => s.is_active || s.id === value).map(s => (
      <option key={s.id} value={s.id}>{s.name} ({s.currency})</option>
    ))}
  </select>
);

export const EmptyRow = ({ colSpan, children }) => (
  <tr><td colSpan={colSpan} className="text-center py-10" style={subdued}>{children}</td></tr>
);
