'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { fmtMoney, round2 } from '@/lib/erp/documents';
import { ProductSearch, ProductThumb, RemoveButton, secondary, stockLine, subdued, text } from './purchasingUi';

const numberInput = { width: 96, textAlign: 'right' };

/**
 * Product lines of a requisition (quantity + unit price + note) or purchase order (quantity + unit price).
 * lines: [{ product_id, product_name, quantity, unit_price?, note?, ... }] — quantities and prices as strings while editing
 */
export default function LinesEditor({ lines, onChange, products, withPrice = false, withNote = !withPrice, currency = 'AED', readOnly = false, error }) {
  const byId = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

  const update = (index, patch) => onChange(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  const remove = (index) => onChange(lines.filter((_, i) => i !== index));
  const add = (p) => onChange([...lines, {
    product_id: p.id,
    product_name: p.name,
    quantity: String(Math.max(1, (p.owed || 0) - (p.on_order || 0)) || 1),
    unit_price: '',
    note: '',
  }]);

  const total = round2(lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0));
  const units = lines.reduce((s, l) => s + (Number(l.quantity) || 0), 0);

  return (
    <div>
      {!readOnly && (
        <div className="px-5 pt-4">
          <ProductSearch products={products} excludeIds={lines.map(l => l.product_id)} onPick={add} error={error} />
        </div>
      )}

      {lines.length === 0 ? (
        <p className="px-5 py-8 text-center text-[13px]" style={subdued}>{readOnly ? 'No products.' : 'No products yet. Search above to add one.'}</p>
      ) : readOnly ? (
        // Read-only: a list, not a table, so long product names wrap instead of pushing the figures off the card
        <ul>
          {lines.map(line => {
            const product = byId.get(line.product_id);
            const priced = withPrice && line.unit_price !== '' && line.unit_price != null;
            return (
              <li key={line.product_id} className="px-5 py-3.5 flex gap-3" style={{ borderBottom: '1px solid #f1f1f1' }}>
                <ProductThumb image={product?.image} size="lg" />
                <div className="min-w-0 flex-1 sm:flex sm:items-start sm:gap-6">
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${line.product_id}`} className="text-[13px] font-medium leading-snug hover:underline line-clamp-2 break-words" style={text} title={line.product_name}>
                      {line.product_name}
                    </Link>
                    <span className="block text-[12px] mt-0.5" style={subdued}>{product ? stockLine(product) : 'No longer in the catalogue'}</span>
                    {withNote && line.note && <p className="text-[12px] mt-1.5 pl-2 whitespace-pre-line" style={{ ...secondary, borderLeft: '2px solid var(--sp-border)' }}>{line.note}</p>}
                  </div>
                  <div className="mt-2 sm:mt-0 shrink-0 flex items-baseline justify-between gap-4 sm:flex-col sm:items-end sm:gap-0.5 tabular-nums">
                    <span className="text-[12px] sm:order-2" style={secondary}>
                      {line.quantity} {Number(line.quantity) === 1 ? 'unit' : 'units'}
                      {withPrice && <> × {priced ? fmtMoney(line.unit_price, currency, { maxDigits: 4 }) : '—'}</>}
                    </span>
                    {withPrice && (
                      <span className="text-[14px] font-semibold sm:order-1" style={text}>
                        {priced ? fmtMoney((Number(line.quantity) || 0) * (Number(line.unit_price) || 0), currency) : 'No price'}
                      </span>
                    )}
                    {withPrice && product?.last_cost != null && (
                      <span className="hidden sm:block sm:order-3 text-[11px] mt-0.5" style={subdued}>Last landed cost AED {product.last_cost.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="overflow-x-auto mt-2">
          <table className="sp-table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="text-right">Quantity</th>
                {withPrice && <th className="text-right">Unit price ({currency})</th>}
                {withPrice && <th className="text-right">Amount</th>}
                {withNote && <th>Note</th>}
                {!readOnly && <th />}
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => {
                const product = byId.get(line.product_id);
                return (
                  <tr key={line.product_id}>
                    <td className="min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <ProductThumb image={product?.image} />
                        <div className="min-w-0">
                          <Link href={`/admin/products/${line.product_id}`} className="text-[13px] font-medium leading-snug hover:underline line-clamp-2 break-words" style={text} title={line.product_name}>{line.product_name}</Link>
                          <span className="block text-[12px]" style={subdued}>{product ? stockLine(product) : 'No longer in the catalogue'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-right">
                      {readOnly
                        ? <span className="tabular-nums" style={text}>{line.quantity}</span>
                        : (
                          <input
                            type="number" min="1" step="1" inputMode="numeric"
                            className="sp-input" style={numberInput}
                            value={line.quantity}
                            onChange={e => update(index, { quantity: e.target.value })}
                            aria-label={`Quantity of ${line.product_name}`}
                          />
                        )}
                    </td>
                    {withPrice && (
                      <td className="text-right">
                        {readOnly
                          ? <span className="tabular-nums" style={secondary}>{line.unit_price === '' || line.unit_price == null ? '—' : fmtMoney(line.unit_price, currency, { maxDigits: 4 })}</span>
                          : (
                            <input
                              type="number" min="0" step="0.01" inputMode="decimal"
                              className="sp-input" style={{ ...numberInput, width: 120 }}
                              value={line.unit_price}
                              placeholder="0.00"
                              onChange={e => update(index, { unit_price: e.target.value })}
                              aria-label={`Unit price of ${line.product_name}`}
                            />
                          )}
                        {product?.last_cost != null && (
                          <span className="block text-[11px] mt-1" style={subdued}>Last landed cost AED {product.last_cost.toFixed(2)}</span>
                        )}
                      </td>
                    )}
                    {withPrice && (
                      <td className="text-right tabular-nums" style={text}>
                        {line.unit_price === '' || line.unit_price == null ? '—' : fmtMoney((Number(line.quantity) || 0) * (Number(line.unit_price) || 0), currency)}
                      </td>
                    )}
                    {withNote && (
                      <td className="min-w-[200px]">
                        {readOnly
                          ? <span style={secondary}>{line.note || '—'}</span>
                          : (
                            <input
                              type="text" className="sp-input" value={line.note || ''} maxLength={500}
                              placeholder="Why it's needed (optional)"
                              onChange={e => update(index, { note: e.target.value })}
                              aria-label={`Note for ${line.product_name}`}
                            />
                          )}
                      </td>
                    )}
                    {!readOnly && <td className="text-right"><RemoveButton onClick={() => remove(index)} label={`Remove ${line.product_name}`} /></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {lines.length > 0 && (
        <div className="px-5 py-3 flex justify-end gap-6 text-[13px]" style={{ borderTop: '1px solid var(--sp-border)', background: 'var(--sp-surface-sub)' }}>
          <span style={secondary}>{lines.length} product{lines.length === 1 ? '' : 's'} · {units} units</span>
          {withPrice && <span className="font-semibold" style={text}>Total {fmtMoney(total, currency)}</span>}
        </div>
      )}
    </div>
  );
}

/** Lines as the API wants them, or an error message */
export function linesPayload(lines, { withPrice = false } = {}) {
  if (lines.length === 0) return { error: 'Add at least one product.' };
  for (const l of lines) {
    const q = Number(l.quantity);
    if (!Number.isInteger(q) || q < 1) return { error: `Enter a whole quantity of 1 or more for ${l.product_name}.` };
    if (withPrice && (l.unit_price === '' || !(Number(l.unit_price) >= 0))) return { error: `Enter the unit price for ${l.product_name}.` };
  }
  return {
    items: lines.map(l => ({
      product_id: l.product_id,
      quantity: Number(l.quantity),
      ...(withPrice ? { unit_price: Number(l.unit_price) } : {}),
      note: l.note || null,
      requisition_item_id: l.requisition_item_id || null,
    })),
  };
}
