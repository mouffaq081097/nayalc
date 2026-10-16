'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import PageLoader from '@/app/components/PageLoader';
import { hasRole } from '@/lib/erp/roles';
import { COSTING_STATUS, CURRENCIES, GRN_STATUS, LANDED_CHARGE_KINDS, fmtMoney, grnNumber, poNumber } from '@/lib/erp/documents';
import { chargeInAed, costReceipt } from '@/lib/erp/landedCost';
import {
  ActionButton, ErrorBanner, FieldLabel, MetaRow, Notice, PageHeader, RemoveButton, SectionCard, StatusBadge,
  aed, api, fmtDate, secondary, subdued, text, toDateInput,
} from './purchasingUi';

const unitAed = (v) => (v == null ? '—' : fmtMoney(v, 'AED', { maxDigits: 4 }));
const small = { height: 32, paddingTop: 0, paddingBottom: 0, fontSize: 13 };

const receiptForm = (g) => ({
  received_date: toDateInput(g.received_date),
  supplier_invoice: g.supplier_invoice || '',
  notes: g.notes || '',
  exchange_rate: String(g.exchange_rate),
  items: g.items.map(i => ({
    id: i.id,
    quantity_received: String(i.quantity_received),
    quantity_rejected: String(i.quantity_rejected),
    batch_number: i.batch_number || '',
    expiry_date: toDateInput(i.expiry_date),
  })),
});

const costingForm = (g) => ({
  exchange_rate: String(g.exchange_rate),
  supplier_invoice: g.supplier_invoice || '',
  charges: g.charges.map(c => ({ ...c, amount: String(c.amount), exchange_rate: String(c.exchange_rate), description: c.description || '' })),
});

const newCharge = () => ({ kind: 'freight', description: '', amount: '', currency: 'AED', exchange_rate: '1', allocation: 'value' });

export default function ReceiptView({ id }) {
  const router = useRouter();
  const [access, setAccess] = useState(null);
  const [grn, setGrn] = useState(null);
  const [form, setForm] = useState(null);
  const [costing, setCosting] = useState(null);
  const [error, setError] = useState('');

  const load = (data) => {
    setAccess(data.access);
    setGrn(data.receipt);
    setForm(receiptForm(data.receipt));
    setCosting(costingForm(data.receipt));
  };

  useEffect(() => {
    api(`/api/admin/purchasing/receipts/${id}`).then(load).catch(e => setError(e.message));
  }, [id]);

  // Live preview of the landed cost with the charges as typed, before they're saved
  const preview = useMemo(() => {
    if (!grn || !costing) return null;
    const draft = grn.status === 'draft';
    const qty = (line, i) => (draft ? Number(form.items[i]?.quantity_received) || 0 : line.quantity_received);
    const rate = Number(draft ? form.exchange_rate : costing.exchange_rate) || 0;
    return costReceipt(
      grn.items.map((l, i) => ({ key: l.id, quantity: qty(l, i), unitPrice: l.unit_price })),
      rate,
      costing.charges.map(c => ({ amount: Number(c.amount) || 0, exchangeRate: c.currency === 'AED' ? 1 : Number(c.exchange_rate) || 0, allocation: c.allocation }))
    );
  }, [grn, form, costing]);

  if (!grn && !error) return <PageLoader />;
  if (!grn) return <ErrorBanner>{error}</ErrorBanner>;

  const isDraft = grn.status === 'draft';
  const costed = grn.costing_status === 'finalized';
  const canReceive = hasRole(access, 'storekeeper') && isDraft;
  // Charges go on after the goods are posted, until costing is final
  const canCost = hasRole(access, 'finance') && !isDraft && !costed;
  const foreign = grn.currency !== 'AED';

  const setItem = (index, patch) => setForm(f => ({ ...f, items: f.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) }));
  const setCharge = (index, patch) => setCosting(c => ({ ...c, charges: c.charges.map((ch, i) => (i === index ? { ...ch, ...patch } : ch)) }));

  const guard = (fn) => async () => {
    try {
      await fn();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const saveReceipt = async (quiet) => {
    const { receipt } = await api(`/api/admin/purchasing/receipts/${id}`, { method: 'PUT', body: { section: 'receipt', ...form } });
    load({ access, receipt });
    if (!quiet) toast.success('Saved');
  };

  const post = guard(async () => {
    const accepted = form.items.reduce((s, i) => s + (Number(i.quantity_received) || 0), 0);
    if (!window.confirm(`Post this receipt? ${accepted} unit${accepted === 1 ? '' : 's'} go on the shelf and to waiting pre-orders. It can't be changed afterwards.`)) return;
    await saveReceipt(true);
    const { receipt, allocation } = await api(`/api/admin/purchasing/receipts/${id}`, { method: 'POST', body: { action: 'post' } });
    load({ access, receipt });
    toast.success('Posted — stock updated');
    if (allocation?.allocated) {
      toast.info(`${allocation.allocated} unit${allocation.allocated === 1 ? '' : 's'} went to pre-orders${allocation.released?.length ? ` · ${allocation.released.length} order${allocation.released.length === 1 ? '' : 's'} ready to ship` : ''}`);
    }
    if (allocation?.error) toast.warning(allocation.error);
  });

  const remove = guard(async () => {
    if (!window.confirm('Delete this draft receipt?')) return;
    const { purchaseOrderId } = await api(`/api/admin/purchasing/receipts/${id}`, { method: 'DELETE' });
    toast.success('Receipt deleted');
    router.push(`/admin/purchasing/orders/${purchaseOrderId}`);
  });

  const saveCosting = async (quiet) => {
    const body = {
      section: 'costing',
      exchange_rate: Number(costing.exchange_rate),
      supplier_invoice: costing.supplier_invoice,
      charges: costing.charges.map(c => ({ ...c, amount: Number(c.amount), exchange_rate: c.currency === 'AED' ? 1 : Number(c.exchange_rate) })),
    };
    const { receipt } = await api(`/api/admin/purchasing/receipts/${id}`, { method: 'PUT', body });
    load({ access, receipt });
    if (!quiet) toast.success('Charges saved');
  };

  const finalize = guard(async () => {
    if (!window.confirm('Finalise costing? Product costs are updated and the charges can no longer change.')) return;
    await saveCosting(true);
    const { receipt } = await api(`/api/admin/purchasing/receipts/${id}`, { method: 'POST', body: { action: 'finalize' } });
    load({ access, receipt });
    toast.success('Costing finalised — product costs updated');
  });

  const actions = [];
  if (canReceive) {
    actions.push(<button key="delete" type="button" onClick={remove} className="sp-btn sp-btn-plain text-red-600">Delete</button>);
    actions.push(<ActionButton key="save" onClick={guard(() => saveReceipt(false))} busyText="Saving…">Save</ActionButton>);
    actions.push(<ActionButton key="post" variant="primary" onClick={post} busyText="Posting…">Post to stock</ActionButton>);
  }
  if (canCost) {
    actions.push(<ActionButton key="save-costing" onClick={guard(() => saveCosting(false))} busyText="Saving…">Save charges</ActionButton>);
    actions.push(<ActionButton key="finalize" variant="primary" onClick={finalize} busyText="Finalising…">Finalise costing</ActionButton>);
  }

  const previewByLine = new Map((preview?.lines || []).map(l => [l.key, l]));

  return (
    <div className="max-w-[1180px] mx-auto space-y-4">
      <PageHeader
        back="/admin/purchasing/receipts"
        title={grnNumber(grn.id)}
        badges={(
          <>
            <StatusBadge map={GRN_STATUS} status={grn.status} />
            {!isDraft && <StatusBadge map={COSTING_STATUS} status={grn.costing_status} />}
          </>
        )}
        subtitle={<>Against <Link href={`/admin/purchasing/orders/${grn.purchase_order_id}`} className="underline">{poNumber(grn.purchase_order_id)}</Link> · {grn.supplier_name}</>}
        actions={actions}
      />

      {isDraft && canReceive && (
        <Notice tone="info">Count what arrived. Accepted units go on the shelf when you post; rejected units (damaged, wrong item, short expiry) don&apos;t, and stay outstanding on the order.</Notice>
      )}
      {isDraft && !canReceive && <Notice tone="warning">A storekeeper has to count and post this receipt.</Notice>}
      {!isDraft && !costed && hasRole(access, 'finance') && (
        <Notice tone="info">Stock was booked at the supplier price. Add the freight, customs and bank charges for this delivery, then finalise to update product costs.</Notice>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] items-start">
        <SectionCard title="Received items">
          <div className="overflow-x-auto">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-right">Ordered</th>
                  {isDraft && <th className="text-right">Still to come</th>}
                  <th className="text-right">Accepted</th>
                  <th className="text-right">Rejected</th>
                  <th>Batch</th>
                  <th>Expiry</th>
                  {!isDraft && <th className="text-right">Booked cost</th>}
                  {!isDraft && <th className="text-right">Landed cost</th>}
                </tr>
              </thead>
              <tbody>
                {grn.items.map((line, index) => {
                  const item = form.items[index];
                  return (
                    <tr key={line.id}>
                      <td className="min-w-[200px]">
                        <Link href={`/admin/products/${line.product_id}`} className="font-medium hover:underline" style={text}>{line.product_name}</Link>
                        <span className="block text-[12px]" style={subdued}>{fmtMoney(line.unit_price, grn.currency, { maxDigits: 4 })} each</span>
                      </td>
                      <td className="text-right tabular-nums" style={secondary}>{line.ordered_qty}</td>
                      {isDraft && <td className="text-right tabular-nums" style={secondary}>{line.outstanding}</td>}
                      {canReceive ? (
                        <>
                          <td className="text-right">
                            <input type="number" min="0" max={line.outstanding} step="1" className="sp-input" style={{ ...small, width: 80, textAlign: 'right' }}
                              value={item.quantity_received} onChange={e => setItem(index, { quantity_received: e.target.value })} aria-label={`Accepted ${line.product_name}`} />
                          </td>
                          <td className="text-right">
                            <input type="number" min="0" step="1" className="sp-input" style={{ ...small, width: 72, textAlign: 'right' }}
                              value={item.quantity_rejected} onChange={e => setItem(index, { quantity_rejected: e.target.value })} aria-label={`Rejected ${line.product_name}`} />
                          </td>
                          <td>
                            <input type="text" className="sp-input" style={{ ...small, width: 110 }} maxLength={100}
                              value={item.batch_number} onChange={e => setItem(index, { batch_number: e.target.value })} aria-label={`Batch of ${line.product_name}`} />
                          </td>
                          <td>
                            <input type="date" className="sp-input" style={{ ...small, width: 140 }}
                              value={item.expiry_date} onChange={e => setItem(index, { expiry_date: e.target.value })} aria-label={`Expiry of ${line.product_name}`} />
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="text-right tabular-nums font-semibold">{line.quantity_received}</td>
                          <td className="text-right tabular-nums" style={secondary}>{line.quantity_rejected || '—'}</td>
                          <td style={secondary}>{line.batch_number || '—'}</td>
                          <td className="whitespace-nowrap" style={secondary}>{fmtDate(line.expiry_date)}</td>
                        </>
                      )}
                      {!isDraft && <td className="text-right tabular-nums" style={secondary}>{unitAed(line.base_unit_cost)}</td>}
                      {!isDraft && (
                        <td className="text-right tabular-nums font-semibold">
                          {costed ? unitAed(line.landed_unit_cost) : <span style={subdued}>{unitAed(previewByLine.get(line.id)?.landedUnit)}</span>}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Delivery" padded>
          {canReceive ? (
            <div className="space-y-4">
              <div>
                <FieldLabel htmlFor="received_date">Received on</FieldLabel>
                <input id="received_date" type="date" className="sp-input" value={form.received_date} onChange={e => setForm(f => ({ ...f, received_date: e.target.value }))} />
              </div>
              <div>
                <FieldLabel htmlFor="supplier_invoice" optional>Supplier invoice / delivery note</FieldLabel>
                <input id="supplier_invoice" type="text" className="sp-input" maxLength={200} value={form.supplier_invoice} onChange={e => setForm(f => ({ ...f, supplier_invoice: e.target.value }))} />
              </div>
              {foreign && (
                <div>
                  <FieldLabel htmlFor="grn_rate">AED per 1 {grn.currency}</FieldLabel>
                  <input id="grn_rate" type="number" min="0" step="0.0001" className="sp-input" value={form.exchange_rate} onChange={e => setForm(f => ({ ...f, exchange_rate: e.target.value }))} />
                  <p className="text-[12px] mt-1.5" style={subdued}>The rate actually paid (PO estimate {grn.po_exchange_rate}). Finance can correct it until costing is final.</p>
                </div>
              )}
              <div>
                <FieldLabel htmlFor="grn_notes" optional>Notes</FieldLabel>
                <textarea id="grn_notes" rows={3} className="sp-input" value={form.notes} maxLength={2000} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. 2 boxes crushed, photos sent to supplier" />
              </div>
            </div>
          ) : (
            <div>
              <MetaRow label="Received on">{fmtDate(grn.received_date)}</MetaRow>
              <MetaRow label="Supplier invoice">{grn.supplier_invoice || '—'}</MetaRow>
              {foreign && <MetaRow label="Exchange rate">{`1 ${grn.currency} = ${grn.exchange_rate} AED`}</MetaRow>}
              {grn.posted_at && <MetaRow label="Posted">{`${fmtDate(grn.posted_at)} · ${grn.posted_by_name || ''}`}</MetaRow>}
              {grn.costed_at && <MetaRow label="Costed">{`${fmtDate(grn.costed_at)} · ${grn.costed_by_name || ''}`}</MetaRow>}
              {grn.notes && <p className="text-[13px] mt-3 whitespace-pre-line" style={text}>{grn.notes}</p>}
            </div>
          )}
        </SectionCard>
      </div>

      {!isDraft && (
      <SectionCard
        title="Landed costs"
        hint="Charges for this delivery, spread over the accepted units by value or by quantity"
        action={canCost && <button type="button" className="sp-btn sp-btn-secondary" onClick={() => setCosting(c => ({ ...c, charges: [...c.charges, newCharge()] }))}><Plus size={14} />Add charge</button>}
      >
        {costing.charges.length === 0 ? (
          <p className="px-5 py-6 text-[13px]" style={subdued}>
            {costed ? 'No charges were added to this delivery.' : 'No charges yet — e.g. freight invoice, customs duty (5% of CIF value) and clearance, bank transfer fees.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Charge</th><th>Description</th><th className="text-right">Amount</th><th>Currency</th><th className="text-right">Rate</th>
                  <th>Spread by</th><th className="text-right">In AED</th>{canCost && <th />}
                </tr>
              </thead>
              <tbody>
                {costing.charges.map((c, index) => (
                  <tr key={index}>
                    {canCost ? (
                      <>
                        <td>
                          <select className="sp-input" style={{ ...small, width: 190 }} value={c.kind} onChange={e => setCharge(index, { kind: e.target.value })} aria-label="Charge type">
                            {LANDED_CHARGE_KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
                          </select>
                        </td>
                        <td><input type="text" className="sp-input" style={{ ...small, minWidth: 160 }} maxLength={300} value={c.description} onChange={e => setCharge(index, { description: e.target.value })} placeholder="e.g. DHL invoice 4471" aria-label="Description" /></td>
                        <td className="text-right"><input type="number" min="0" step="0.01" className="sp-input" style={{ ...small, width: 110, textAlign: 'right' }} value={c.amount} onChange={e => setCharge(index, { amount: e.target.value })} aria-label="Amount" /></td>
                        <td>
                          <select className="sp-input" style={{ ...small, width: 84 }} value={c.currency} onChange={e => setCharge(index, { currency: e.target.value, exchange_rate: e.target.value === 'AED' ? '1' : (e.target.value === grn.currency ? String(grn.exchange_rate) : '') })} aria-label="Currency">
                            {CURRENCIES.map(cur => <option key={cur} value={cur}>{cur}</option>)}
                          </select>
                        </td>
                        <td className="text-right">
                          {c.currency === 'AED' ? <span style={subdued}>—</span> : (
                            <input type="number" min="0" step="0.0001" className="sp-input" style={{ ...small, width: 96, textAlign: 'right' }} value={c.exchange_rate} onChange={e => setCharge(index, { exchange_rate: e.target.value })} aria-label="Exchange rate" />
                          )}
                        </td>
                        <td>
                          <select className="sp-input" style={{ ...small, width: 110 }} value={c.allocation} onChange={e => setCharge(index, { allocation: e.target.value })} aria-label="Spread by">
                            <option value="value">Value</option>
                            <option value="quantity">Quantity</option>
                          </select>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{LANDED_CHARGE_KINDS.find(k => k.id === c.kind)?.label}</td>
                        <td style={secondary}>{c.description || '—'}</td>
                        <td className="text-right tabular-nums">{fmtMoney(c.amount, c.currency)}</td>
                        <td style={secondary}>{c.currency}</td>
                        <td className="text-right tabular-nums" style={secondary}>{c.currency === 'AED' ? '—' : c.exchange_rate}</td>
                        <td style={secondary}>{c.allocation === 'quantity' ? 'Quantity' : 'Value'}</td>
                      </>
                    )}
                    <td className="text-right tabular-nums font-semibold">
                      {aed(chargeInAed({ amount: c.amount, exchangeRate: c.currency === 'AED' ? 1 : c.exchange_rate }))}
                    </td>
                    {canCost && <td className="text-right"><RemoveButton onClick={() => setCosting(s => ({ ...s, charges: s.charges.filter((_, i) => i !== index) }))} label="Remove charge" /></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {canCost && foreign && (
          <div className="px-5 py-4 flex flex-wrap items-end gap-4" style={{ borderTop: '1px solid var(--sp-border)' }}>
            <div>
              <FieldLabel htmlFor="costing_rate">AED per 1 {grn.currency} on the goods</FieldLabel>
              <input id="costing_rate" type="number" min="0" step="0.0001" className="sp-input" style={{ width: 160 }} value={costing.exchange_rate} onChange={e => setCosting(c => ({ ...c, exchange_rate: e.target.value }))} />
            </div>
            <p className="text-[12px] pb-2 max-w-[460px]" style={subdued}>Use the rate on the bank payment to the supplier. A change from the receipt&apos;s rate is booked as part of the landed cost.</p>
          </div>
        )}

        {preview && (
          <div style={{ borderTop: '1px solid var(--sp-border)' }}>
            <div className="px-5 pt-4 pb-1">
              <p className="text-[13px] font-semibold" style={text}>{costed ? 'Final costing' : 'Costing preview'}</p>
              <p className="text-[12px] mt-0.5" style={subdued}>Per accepted unit, in AED{costed ? '' : '. Nothing is booked until costing is finalised.'}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>Product</th><th className="text-right">Units</th><th className="text-right">Supplier price</th>
                    <th className="text-right">Charges</th><th className="text-right">Landed cost</th><th className="text-right">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {grn.items.map(line => {
                    const p = previewByLine.get(line.id);
                    if (!p?.quantity) return null;
                    return (
                      <tr key={line.id}>
                        <td style={text}>{line.product_name}</td>
                        <td className="text-right tabular-nums" style={secondary}>{p.quantity}</td>
                        <td className="text-right tabular-nums" style={secondary}>{unitAed(p.baseUnit)}</td>
                        <td className="text-right tabular-nums" style={secondary}>{unitAed(p.quantity ? p.chargesTotal / p.quantity : 0)}</td>
                        <td className="text-right tabular-nums font-semibold">{unitAed(p.landedUnit)}</td>
                        <td className="text-right tabular-nums">{aed(p.landedTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 flex flex-wrap justify-end gap-x-6 gap-y-1 text-[13px]" style={{ borderTop: '1px solid var(--sp-border)', background: 'var(--sp-surface-sub)' }}>
              <span style={secondary}>Goods {aed(preview.totals.base)}</span>
              <span style={secondary}>Charges {aed(preview.totals.charges)}{preview.totals.base > 0 ? ` (${((preview.totals.charges / preview.totals.base) * 100).toFixed(1)}%)` : ''}</span>
              <span className="font-semibold" style={text}>Landed {aed(preview.totals.landed)}</span>
            </div>
          </div>
        )}
      </SectionCard>
      )}
    </div>
  );
}
