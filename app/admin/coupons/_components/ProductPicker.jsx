'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Package, Search, X } from 'lucide-react';
import { fmtAed } from '../../products/_components/productAdmin';
import { ERROR_COLOR, invalidStyle, secondary, subdued, text } from '../../_components/EditorFields';

// Search the catalogue and pick the products a discount code is limited to
export default function ProductPicker({ products, value, onChange, error }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const byId = useMemo(() => new Map(products.map(p => [Number(p.id), p])), [products]);
  const selected = value.map(id => byId.get(id) || { id, name: `Product #${id}`, missing: true });

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter(p => !value.includes(Number(p.id)))
      .filter(p => !q || p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q))
      .slice(0, 30);
  }, [products, value, query]);

  const add = (product) => {
    onChange([...value, Number(product.id)]);
    setQuery('');
  };
  const remove = (id) => onChange(value.filter(v => v !== id));

  return (
    <div>
      <div ref={boxRef} className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={subdued} />
        <input
          id="product_search"
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'Enter') {
              e.preventDefault();
              if (matches[0]) add(matches[0]);
            }
          }}
          placeholder="Search products"
          className="sp-input"
          style={invalidStyle(error, { paddingLeft: 34 })}
          aria-invalid={!!error}
          aria-label="Search products"
          autoComplete="off"
        />
        {open && (
          <div className="absolute left-0 right-0 top-full mt-1 z-30 sp-card p-1 max-h-[280px] overflow-y-auto" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            {matches.length === 0 ? (
              <p className="px-3 py-2.5 text-[13px]" style={subdued}>
                {products.length === 0 ? 'Loading products…' : 'No matching products'}
              </p>
            ) : matches.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => add(p)}
                className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-left hover:bg-[#f1f1f1] transition-colors"
              >
                <ProductThumb product={p} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] truncate" style={text}>{p.name}</span>
                  {p.brand && <span className="block text-[12px] truncate" style={subdued}>{p.brand}</span>}
                </span>
                <span className="text-[12px] whitespace-nowrap" style={secondary}>{fmtAed(p.price)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-[12px] mt-1.5" style={{ color: ERROR_COLOR }}>{error}</p>}

      {selected.length > 0 && (
        <ul className="mt-3">
          {selected.map((p, index) => (
            <li key={p.id} className="flex items-center gap-3 py-2" style={index ? { borderTop: '1px solid #f1f1f1' } : undefined}>
              <ProductThumb product={p} />
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] truncate" style={text}>{p.name}</span>
                {p.missing
                  ? <span className="block text-[12px]" style={subdued}>No longer in the catalogue</span>
                  : p.brand && <span className="block text-[12px] truncate" style={subdued}>{p.brand}</span>}
              </span>
              {!p.missing && <span className="text-[12px] whitespace-nowrap" style={secondary}>{fmtAed(p.price)}</span>}
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[#e3e3e3] transition-colors"
                style={secondary}
                aria-label={`Remove ${p.name}`}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const ProductThumb = ({ product }) => (
  <span className="w-9 h-9 rounded-md shrink-0 flex items-center justify-center overflow-hidden" style={{ background: 'var(--sp-surface-sub)', border: '1px solid #ebebeb' }}>
    {product.image && !product.missing
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={product.image} alt="" className="w-full h-full object-contain" />
      : <Package size={15} style={subdued} />}
  </span>
);
