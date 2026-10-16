'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { History, Receipt } from 'lucide-react';
import PageLoader from '@/app/components/PageLoader';
import { netFromGross } from '@/lib/vat';
import { grnNumber, poNumber, round2 } from '@/lib/erp/documents';
import { EmptyState, SearchBox, ViewPill } from '../../_components/IndexToolbar';
import {
  ActionButton, Dialog, ErrorBanner, FieldLabel, PageHeader, SectionCard, StatCell, StatGrid, aed, api, fmtDate, secondary, subdued, text, usePurchasing,
} from '../_components/purchasingUi';

const unitAed = (v) => (v == null ? '—' : `AED ${Number(v).toFixed(2)}`);

const LEDGER_KIND = {
  receipt: 'Goods received',
  landed_cost: 'Landed costs',
  opening: 'Opening cost',
  adjustment: 'Manual change',
};

// Gross margin on the price the customer pays, net of VAT
const margin = (p) => {
  if (p.average_cost == null || !p.price) return null;
  const net = netFromGross(p.price);
  return net > 0 ? ((net - p.average_cost) / net) * 100 : null;
};

const VIEWS = [
  { id: 'stock', label: 'In stock', match: p => p.stock_quantity > 0 },
  { id: 'uncosted', label: 'No cost yet', match: p => p.average_cost == null && p.stock_quantity > 0 },
  { id: 'low', label: 'Margin under 50%', match: p => margin(p) != null && margin(p) < 50 },
  { id: 'all', label: 'All products', match: () => true },
];

export default function CostingPage() {
  const router = useRouter();
  const { data, error, can, reload } = usePurchasing('/api/admin/purchasing/products');
  const [receipts, setReceipts] = useState(null);
  const [view, setView] = useState('stock');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [cost, setCost] = useState('');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState(null);

  useEffect(() => {
    api('/api/admin/purchasing/receipts')
      .then(r => setReceipts(r.receipts.filter(g => g.status === 'posted' && g.costing_status === 'open')))
      .catch(() => setReceipts([]));
  }, []);

  const products = data?.products;
  const counts = useMemo(() => Object.fromEntries(VIEWS.map(v => [v.id, (products || []).filter(v.match).length])), [products]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products || [])
      .filter(VIEWS.find(v => v.id === view).match)
      .filter(p => !q || p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
  }, [products, view, query]);

  if (!data && !error) return <PageLoader />;

  const costed = (products || []).filter(p => p.average_cost != null && p.stock_quantity > 0);
  const stockValue = round2(costed.reduce((s, p) => s + p.stock_quantity * p.average_cost, 0));
  const retailNet = round2(costed.reduce((s, p) => s + p.stock_quantity * netFromGross(p.price), 0));

  const openEdit = (p) => {
    setEditing(p);
    setCost(p.average_cost != null ? String(p.average_cost) : (p.last_cost != null ? String(p.last_cost) : ''));
    setNote('');
  };

  const saveCost = async () => {
    try {
      await api('/api/admin/purchasing/products', { method: 'PUT', body: { productId: editing.id, average_cost: Number(cost), note } });
      toast.success(`Cost of ${editing.name} saved`);
      setEditing(null);
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const openHistory = async (p) => {
    setHistory({ product: p, rows: null });
    try {
      const r = await api(`/api/admin/purchasing/products?history=${p.id}`);
      setHistory({ product: p, rows: r.history });
    } catch (e) {
      toast.error(e.message);
      setHistory(null);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Costing" subtitle="Landed costs and what each product costs us — weighted average, in AED" />
      <ErrorBanner>{error}</ErrorBanner>

      <StatGrid>
          <StatCell label="Stock value at cost" value={aed(stockValue)} hint={`${costed.length} costed products on the shelf`} />
          <StatCell label="Same stock at retail" value={aed(retailNet)} hint="selling prices, net of VAT" />
          <StatCell label="Receipts awaiting costing" value={receipts ? receipts.length : '—'} hint="charges still to add" />
          <StatCell label="Products without a cost" value={counts.uncosted} hint="in stock but never costed" />
      </StatGrid>

      <SectionCard title="Receipts awaiting costing" hint="Posted deliveries whose freight, customs and bank charges aren't final yet">
        {!receipts ? (
          <p className="px-5 py-6 text-[13px]" style={subdued}>Loading…</p>
        ) : receipts.length === 0 ? (
          <EmptyState icon={Receipt} title="All receipts are costed" description="Posted deliveries appear here until finance finalises their landed costs." />
        ) : (
          <div className="overflow-x-auto">
            <table className="sp-table">
              <thead><tr><th>Receipt</th><th>Purchase order</th><th>Supplier</th><th>Received</th><th className="text-right">Goods</th><th className="text-right">Charges so far</th></tr></thead>
              <tbody>
                {receipts.map(g => (
                  <tr key={g.id} className="cursor-pointer" onClick={() => router.push(`/admin/purchasing/receipts/${g.id}`)}>
                    <td className="font-semibold">{grnNumber(g.id)}</td>
                    <td style={secondary}>{poNumber(g.purchase_order_id)}</td>
                    <td style={secondary}>{g.supplier_name}</td>
                    <td style={secondary}>{fmtDate(g.received_date)}</td>
                    <td className="text-right tabular-nums">{aed(g.value_aed)}</td>
                    <td className="text-right tabular-nums" style={secondary}>{aed(g.charges_aed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <div className="sp-card overflow-hidden">
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--sp-border)' }}>
          <h2 className="sp-section-title">Product costs</h2>
          <p className="text-[12px] mt-0.5" style={subdued}>
            Each posted receipt blends its cost into the average; finalised landed costs adjust it. For stock that was on the shelf before purchasing was used, set an opening cost.
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--sp-border)' }}>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
            {VIEWS.map(v => <ViewPill key={v.id} active={view === v.id} count={counts[v.id]} onClick={() => setView(v.id)}>{v.label}</ViewPill>)}
          </div>
          <SearchBox value={query} onChange={setQuery} placeholder="Search products" />
        </div>
        {shown.length === 0 ? (
          <EmptyState icon={Receipt} title="No products here" description="Try another view or search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-right">On shelf</th>
                  <th className="text-right">Average cost</th>
                  <th className="text-right">Last landed</th>
                  <th className="text-right">Stock value</th>
                  <th className="text-right">Price (ex VAT)</th>
                  <th className="text-right">Margin</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {shown.map(p => {
                  const m = margin(p);
                  return (
                    <tr key={p.id}>
                      <td className="max-w-[300px]">
                        <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline" style={text}>{p.name}</Link>
                        {p.brand && <span className="block text-[12px]" style={subdued}>{p.brand}</span>}
                      </td>
                      <td className="text-right tabular-nums" style={secondary}>{p.stock_quantity}</td>
                      <td className="text-right tabular-nums font-semibold">{p.average_cost == null ? <span className="sp-badge sp-badge-warning">No cost</span> : unitAed(p.average_cost)}</td>
                      <td className="text-right tabular-nums" style={secondary}>{unitAed(p.last_cost)}</td>
                      <td className="text-right tabular-nums">{p.average_cost == null ? '—' : aed(p.stock_quantity * p.average_cost)}</td>
                      <td className="text-right tabular-nums" style={secondary}>{unitAed(netFromGross(p.price))}</td>
                      <td className="text-right tabular-nums" style={m != null && m < 50 ? { color: '#8e0b21' } : secondary}>{m == null ? '—' : `${m.toFixed(1)}%`}</td>
                      <td className="text-right whitespace-nowrap">
                        <button type="button" onClick={() => openHistory(p)} className="sp-btn sp-btn-plain" aria-label={`Cost history of ${p.name}`}><History size={14} /></button>
                        {can('finance') && <button type="button" onClick={() => openEdit(p)} className="sp-btn sp-btn-secondary">{p.average_cost == null ? 'Set cost' : 'Change'}</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={!!editing}
        title={editing ? `Cost of ${editing.name}` : ''}
        onClose={() => setEditing(null)}
        footer={(
          <>
            <button type="button" className="sp-btn sp-btn-secondary" onClick={() => setEditing(null)}>Back</button>
            <ActionButton variant="primary" onClick={saveCost} disabled={cost === '' || !(Number(cost) >= 0)} busyText="Saving…">Save cost</ActionButton>
          </>
        )}
      >
        <div>
          <FieldLabel htmlFor="avg_cost">Average cost per unit (AED, landed, ex VAT)</FieldLabel>
          <input id="avg_cost" type="number" min="0" step="0.01" className="sp-input" value={cost} onChange={e => setCost(e.target.value)} autoFocus />
          <p className="text-[12px] mt-1.5" style={subdued}>
            Applies to the {editing?.stock_quantity} units on the shelf. Use it for opening stock or to correct a mistake — normal deliveries update the cost themselves.
          </p>
        </div>
        <div>
          <FieldLabel htmlFor="cost_note" optional>Reason</FieldLabel>
          <input id="cost_note" type="text" className="sp-input" value={note} maxLength={500} onChange={e => setNote(e.target.value)} placeholder="e.g. Opening stock from the 2025 supplier invoice" />
        </div>
      </Dialog>

      <Dialog open={!!history} title={history ? `Cost history — ${history.product.name}` : ''} onClose={() => setHistory(null)}>
        {!history?.rows ? (
          <p className="text-[13px]" style={subdued}>Loading…</p>
        ) : history.rows.length === 0 ? (
          <p className="text-[13px]" style={subdued}>No cost has been recorded for this product yet.</p>
        ) : (
          <div className="-mx-5 -my-5 overflow-x-auto">
            <table className="sp-table">
              <thead><tr><th>Date</th><th>Change</th><th className="text-right">Units</th><th className="text-right">Cost before</th><th className="text-right">Cost after</th></tr></thead>
              <tbody>
                {history.rows.map(r => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap" style={secondary}>{fmtDate(r.created_at)}</td>
                    <td>
                      {r.goods_receipt_id
                        ? <Link href={`/admin/purchasing/receipts/${r.goods_receipt_id}`} className="hover:underline" style={text}>{LEDGER_KIND[r.kind]} · {grnNumber(r.goods_receipt_id)}</Link>
                        : <span style={text}>{LEDGER_KIND[r.kind] || r.kind}</span>}
                      <span className="block text-[12px]" style={subdued}>
                        {[r.created_by_name, Number(r.expensed_value) ? `AED ${Number(r.expensed_value).toFixed(2)} on units already sold` : null, r.note].filter(Boolean).join(' · ')}
                      </span>
                    </td>
                    <td className="text-right tabular-nums" style={secondary}>{r.quantity}</td>
                    <td className="text-right tabular-nums" style={secondary}>{unitAed(r.average_before)}</td>
                    <td className="text-right tabular-nums font-semibold">{unitAed(r.average_after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Dialog>
    </div>
  );
}
