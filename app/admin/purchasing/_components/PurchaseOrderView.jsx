'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FileDown } from 'lucide-react';
import PageLoader from '@/app/components/PageLoader';
import { hasRole } from '@/lib/erp/roles';
import { COSTING_STATUS, CURRENCIES, GRN_STATUS, PO_STATUS, RECEIVABLE_PO, fmtMoney, grnNumber, poNumber, prNumber, round2 } from '@/lib/erp/documents';
import LinesEditor, { linesPayload } from './LinesEditor';
import {
  ActionButton, ErrorBanner, FieldLabel, MetaRow, Notice, PageHeader, SectionCard, StatusBadge, SupplierSelect,
  aed, api, fmtDate, secondary, subdued, text, toDateInput, usePurchasingProducts, useSuppliers,
} from './purchasingUi';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' });

const formFrom = (po) => ({
  supplier_id: po?.supplier_id || null,
  currency: po?.currency || 'AED',
  exchange_rate: po ? String(po.exchange_rate) : '1',
  order_date: po ? toDateInput(po.order_date) : today(),
  expected_date: toDateInput(po?.expected_date),
  supplier_reference: po?.supplier_reference || '',
  notes: po?.notes || '',
});

const linesFrom = (po) => (po?.items || []).map(i => ({
  ...i, quantity: String(i.quantity), unit_price: String(i.unit_price),
}));

/** id = null for a new purchase order */
export default function PurchaseOrderView({ id }) {
  const router = useRouter();
  const products = usePurchasingProducts();
  const suppliers = useSuppliers();
  const [access, setAccess] = useState(null);
  const [po, setPo] = useState(null);
  const [form, setForm] = useState(formFrom(null));
  const [lines, setLines] = useState([]);
  const [error, setError] = useState('');
  const [lineError, setLineError] = useState('');

  const load = (data) => {
    setAccess(data.access);
    if (data.order) {
      setPo(data.order);
      setForm(formFrom(data.order));
      setLines(linesFrom(data.order));
    }
  };

  useEffect(() => {
    api(id ? `/api/admin/purchasing/orders/${id}` : '/api/admin/purchasing/me').then(load).catch(e => setError(e.message));
  }, [id]);

  const supplier = useMemo(() => (suppliers || []).find(s => s.id === form.supplier_id), [suppliers, form.supplier_id]);
  const set = (patch) => setForm(f => ({ ...f, ...patch }));

  if (!access && !error) return <PageLoader />;
  if (!access) return <ErrorBanner>{error}</ErrorBanner>;

  const isNew = !id;
  const isBuyer = hasRole(access, 'buyer');
  const status = po?.status || 'draft';
  const draft = status === 'draft';
  const editable = isBuyer && draft;
  const paperworkEditable = isBuyer && ['sent', 'partially_received'].includes(status);
  const receivedAny = (po?.items || []).some(i => i.received_qty > 0);

  const chooseSupplier = (supplierId) => {
    const s = (suppliers || []).find(x => x.id === supplierId);
    set({ supplier_id: supplierId, ...(s && s.currency !== form.currency ? { currency: s.currency, exchange_rate: s.currency === 'AED' ? '1' : '' } : null) });
  };

  const save = async ({ quiet = false } = {}) => {
    if (paperworkEditable) {
      const { order } = await api(`/api/admin/purchasing/orders/${id}`, { method: 'PUT', body: form });
      load({ access, order });
      if (!quiet) toast.success('Saved');
      return order;
    }
    if (!form.supplier_id) throw new Error('Choose a supplier.');
    if (form.currency !== 'AED' && !(Number(form.exchange_rate) > 0)) throw new Error(`Enter the ${form.currency} to AED exchange rate.`);
    const { items, error: msg } = linesPayload(lines, { withPrice: true });
    setLineError(msg || '');
    if (msg) throw new Error(msg);
    const body = { ...form, exchange_rate: form.currency === 'AED' ? 1 : Number(form.exchange_rate), items };
    if (isNew) {
      const { order } = await api('/api/admin/purchasing/orders', { method: 'POST', body });
      toast.success(`${order.number} saved as a draft`);
      router.replace(`/admin/purchasing/orders/${order.id}`);
      return order;
    }
    const { order } = await api(`/api/admin/purchasing/orders/${id}`, { method: 'PUT', body });
    load({ access, order });
    if (!quiet) toast.success('Saved');
    return order;
  };

  const run = (fn) => async () => {
    try {
      await fn();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const act = (action, done) => run(async () => {
    if (action === 'send') await save({ quiet: true });
    const result = await api(`/api/admin/purchasing/orders/${id}`, { method: 'POST', body: { action } });
    if (result.receiptId) {
      router.push(`/admin/purchasing/receipts/${result.receiptId}`);
      return;
    }
    load({ access, order: result.order });
    toast.success(done);
  });

  const remove = run(async () => {
    if (!window.confirm('Delete this draft purchase order?')) return;
    await api(`/api/admin/purchasing/orders/${id}`, { method: 'DELETE' });
    toast.success('Purchase order deleted');
    router.push('/admin/purchasing/orders');
  });

  const actions = [];
  if (!isNew) {
    actions.push(
      <a key="pdf" href={`/api/admin/purchasing/orders/${id}/pdf`} target="_blank" rel="noopener noreferrer" className="sp-btn sp-btn-secondary">
        <FileDown size={14} />PDF
      </a>
    );
  }
  if (editable) {
    if (!isNew) actions.unshift(<button key="delete" type="button" onClick={remove} className="sp-btn sp-btn-plain text-red-600">Delete</button>);
    actions.push(<ActionButton key="save" onClick={run(() => save())} busyText="Saving…">{isNew ? 'Save draft' : 'Save'}</ActionButton>);
    if (!isNew) actions.push(<ActionButton key="send" variant="primary" confirm="Mark this order as sent to the supplier? Its products and prices can't change after this." onClick={act('send', 'Marked as sent. Download the PDF for the supplier.')} busyText="Sending…">Mark as sent</ActionButton>);
  }
  if (paperworkEditable) {
    if (!receivedAny && status === 'sent') actions.unshift(<ActionButton key="cancel" variant="plain" confirm="Cancel this purchase order?" onClick={act('cancel', 'Purchase order cancelled')}>Cancel order</ActionButton>);
    if (status === 'partially_received') actions.unshift(<ActionButton key="close" variant="plain" confirm="Close this order and stop waiting for the rest?" onClick={act('close', 'Order closed')}>Close order</ActionButton>);
    actions.push(<ActionButton key="save" onClick={run(() => save())} busyText="Saving…">Save</ActionButton>);
  }
  if (RECEIVABLE_PO.includes(status) && hasRole(access, 'storekeeper')) {
    actions.push(<ActionButton key="receive" variant="primary" onClick={act('receive')} busyText="Opening…">Receive goods</ActionButton>);
  }

  const total = round2(lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0));
  const rate = form.currency === 'AED' ? 1 : Number(form.exchange_rate) || 0;

  return (
    <div className="max-w-[1180px] mx-auto space-y-4">
      <PageHeader
        back="/admin/purchasing/orders"
        title={isNew ? 'New purchase order' : poNumber(po?.id)}
        badges={po && <StatusBadge map={PO_STATUS} status={status} />}
        subtitle={po && [po.supplier?.name, po.requisition_id && `from ${prNumber(po.requisition_id)}`, po.created_by_name && `created by ${po.created_by_name}`].filter(Boolean).join(' · ')}
        actions={actions}
      />
      <ErrorBanner>{error}</ErrorBanner>
      {isNew && !isBuyer && <Notice tone="warning">You need the Buyer role to create purchase orders.</Notice>}
      {draft && !isNew && po?.requisition_id && (
        <Notice tone="info">Created from {prNumber(po.requisition_id)}. Prices come from this supplier&apos;s last order — check them against the supplier&apos;s quote, then mark it as sent.</Notice>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-4 min-w-0">
          {draft ? (
            <SectionCard title="Products">
              <LinesEditor lines={lines} onChange={setLines} products={products} withPrice currency={form.currency} readOnly={!editable} error={lineError} />
            </SectionCard>
          ) : (
            <SectionCard title="Products" hint="Received counts only accepted units on posted receipts">
              <div className="overflow-x-auto">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-right">Ordered</th>
                      <th className="text-right">Received</th>
                      <th className="text-right">Rejected</th>
                      <th className="text-right">Still to come</th>
                      <th className="text-right">Unit price</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {po.items.map(i => (
                      <tr key={i.id}>
                        <td><Link href={`/admin/products/${i.product_id}`} className="font-medium hover:underline" style={text}>{i.product_name}</Link></td>
                        <td className="text-right tabular-nums">{i.quantity}</td>
                        <td className="text-right tabular-nums" style={secondary}>{i.received_qty}</td>
                        <td className="text-right tabular-nums" style={secondary}>{i.rejected_qty || '—'}</td>
                        <td className="text-right tabular-nums font-semibold" style={i.outstanding ? text : subdued}>{['closed', 'cancelled'].includes(status) ? '—' : i.outstanding}</td>
                        <td className="text-right tabular-nums" style={secondary}>{fmtMoney(i.unit_price, po.currency, { maxDigits: 4 })}</td>
                        <td className="text-right tabular-nums">{fmtMoney(i.quantity * i.unit_price, po.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {po?.receipts?.length > 0 && (
            <SectionCard title="Goods received">
              <table className="sp-table">
                <thead><tr><th>Receipt</th><th>Status</th><th>Received</th><th>Supplier invoice</th><th className="text-right">Units</th></tr></thead>
                <tbody>
                  {po.receipts.map(g => (
                    <tr key={g.id} className="cursor-pointer" onClick={() => router.push(`/admin/purchasing/receipts/${g.id}`)}>
                      <td className="font-semibold">{grnNumber(g.id)}</td>
                      <td>
                        <span className="inline-flex gap-1.5">
                          <StatusBadge map={GRN_STATUS} status={g.status} />
                          {g.status === 'posted' && <StatusBadge map={COSTING_STATUS} status={g.costing_status} />}
                        </span>
                      </td>
                      <td style={secondary}>{fmtDate(g.received_date)}</td>
                      <td style={secondary}>{g.supplier_invoice || '—'}</td>
                      <td className="text-right tabular-nums">{g.units}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          )}
        </div>

        <div className="space-y-4">
          <SectionCard title="Order" padded>
            <div className="space-y-4">
              <div>
                <FieldLabel htmlFor="supplier">Supplier</FieldLabel>
                {editable
                  ? <SupplierSelect id="supplier" suppliers={suppliers} value={form.supplier_id} onChange={chooseSupplier} />
                  : <p className="text-[13px] font-medium" style={text}>{po?.supplier?.name}</p>}
                {editable && suppliers?.length === 0 && (
                  <p className="text-[12px] mt-1.5" style={subdued}><Link href="/admin/purchasing/suppliers" className="underline">Add a supplier</Link> first.</p>
                )}
                {(supplier || po?.supplier)?.payment_terms && (
                  <p className="text-[12px] mt-1.5" style={subdued}>Terms: {(supplier || po.supplier).payment_terms}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="currency">Currency</FieldLabel>
                  <select id="currency" className="sp-input" value={form.currency} disabled={!editable}
                    onChange={e => set({ currency: e.target.value, exchange_rate: e.target.value === 'AED' ? '1' : form.exchange_rate })}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {form.currency !== 'AED' && (
                  <div>
                    <FieldLabel htmlFor="rate">AED per 1 {form.currency}</FieldLabel>
                    <input id="rate" type="number" min="0" step="0.0001" className="sp-input" value={form.exchange_rate} disabled={!editable}
                      onChange={e => set({ exchange_rate: e.target.value })} placeholder="e.g. 4.0125" />
                  </div>
                )}
              </div>
              {form.currency !== 'AED' && (
                <p className="text-[12px] -mt-2" style={subdued}>An estimate for planning. The rate actually paid is entered on the goods receipt and used for costing.</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="order_date">Order date</FieldLabel>
                  <input id="order_date" type="date" className="sp-input" value={form.order_date} disabled={!editable} onChange={e => set({ order_date: e.target.value })} />
                </div>
                <div>
                  <FieldLabel htmlFor="expected_date">Expected</FieldLabel>
                  <input id="expected_date" type="date" className="sp-input" value={form.expected_date} disabled={!editable && !paperworkEditable} onChange={e => set({ expected_date: e.target.value })} />
                </div>
              </div>
              <div>
                <FieldLabel htmlFor="supplier_reference" optional>Supplier reference</FieldLabel>
                <input id="supplier_reference" type="text" className="sp-input" value={form.supplier_reference} maxLength={200} disabled={!editable && !paperworkEditable}
                  onChange={e => set({ supplier_reference: e.target.value })} placeholder="Quote or order confirmation number" />
              </div>
              <div>
                <FieldLabel htmlFor="po_notes" optional>Notes</FieldLabel>
                <textarea id="po_notes" rows={3} className="sp-input" value={form.notes} maxLength={2000} disabled={!editable && !paperworkEditable}
                  onChange={e => set({ notes: e.target.value })} />
                <p className="text-[12px] mt-1.5" style={subdued}>Printed on the PDF the supplier receives.</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Summary" padded>
            <MetaRow label="Total">{fmtMoney(draft ? total : po?.subtotal, form.currency)}</MetaRow>
            {form.currency !== 'AED' && <MetaRow label="In AED (estimate)">{aed((draft ? total : po?.subtotal || 0) * rate)}</MetaRow>}
            {po?.sent_at && <MetaRow label="Sent">{`${fmtDate(po.sent_at)} · ${po.sent_by_name || ''}`}</MetaRow>}
            {po?.closed_at && <MetaRow label={status === 'cancelled' ? 'Cancelled' : 'Completed'}>{fmtDate(po.closed_at)}</MetaRow>}
            <p className="text-[12px] mt-3 leading-relaxed" style={subdued}>
              Freight, customs and bank charges are added when the goods are costed, not here.
            </p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
