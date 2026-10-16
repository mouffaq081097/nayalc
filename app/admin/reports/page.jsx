'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { AlertCircle, Eye, FileSpreadsheet, Loader2, ShoppingBag } from 'lucide-react';
import { EmptyState } from '../_components/IndexToolbar';

const text = { color: 'var(--sp-text)' };
const secondary = { color: 'var(--sp-text-secondary)' };
const subdued = { color: 'var(--sp-text-subdued)' };

const fmtInt = (n) => Number(n || 0).toLocaleString('en-US');
const fmtAed = (n) => `AED ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = (n) => (n == null ? '—' : `${(n * 100).toFixed(1)}%`);
const fmtDay = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Dubai' });

// 'YYYY-MM-DD' for today in Dubai, shifted by `days`
const dubaiDay = (days = 0) => {
  const d = new Date(Date.now() + days * 86_400_000);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' });
};

const PRESETS = [
  { key: '7', label: 'Last 7 days', range: () => [dubaiDay(-6), dubaiDay()] },
  { key: '30', label: 'Last 30 days', range: () => [dubaiDay(-29), dubaiDay()] },
  { key: '90', label: 'Last 90 days', range: () => [dubaiDay(-89), dubaiDay()] },
  { key: 'year', label: 'This year', range: () => [`${dubaiDay().slice(0, 4)}-01-01`, dubaiDay()] },
  { key: 'all', label: 'All time', range: () => ['2024-01-01', dubaiDay()] },
];

const StatCell = ({ label, value, hint, first }) => (
  <div className="px-5 py-4 flex-[1_0_auto]" style={first ? undefined : { borderLeft: '1px solid var(--sp-border)' }}>
    <p className="text-[12px] mb-2 whitespace-nowrap"><span className="sp-stat-label">{label}</span></p>
    <p className="text-[20px] font-semibold leading-none whitespace-nowrap tabular-nums" style={text}>{value}</p>
    <p className="text-[12px] mt-2 whitespace-nowrap" style={subdued}>{hint || ' '}</p>
  </div>
);

const SectionCard = ({ title, hint, children }) => (
  <div className="sp-card overflow-hidden">
    <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--sp-border)' }}>
      <h2 className="sp-section-title">{title}</h2>
      {hint && <p className="text-[12px] mt-0.5" style={subdued}>{hint}</p>}
    </div>
    {children}
  </div>
);

const ProductCell = ({ p }) => (
  <td className="max-w-[320px]">
    <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline" style={text}>{p.name}</Link>
    {p.brand && <span className="block text-[12px]" style={subdued}>{p.brand}</span>}
  </td>
);

export default function ReportsPage() {
  const [preset, setPreset] = useState('30');
  const [[from, to], setRange] = useState(() => PRESETS[1].range());
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const query = `from=${from}&to=${to}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/products?${query}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'The report could not be loaded.');
      setData(json);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { load(); }, [load]);

  const choosePreset = (p) => {
    setPreset(p.key);
    setRange(p.range());
  };
  const setDay = (which, value) => {
    setPreset('custom');
    setRange(([f, t]) => (which === 'from' ? [value, t] : [f, value]));
  };

  const download = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/admin/reports/products?${query}&format=xlsx`, { cache: 'no-store' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || 'The Excel file could not be generated.');
      }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-report-${from}-to-${to}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDownloading(false);
    }
  };

  const totals = data?.totals;
  const viewed = data?.mostViewed || [];
  const ordered = data?.mostOrdered || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold leading-tight" style={text}>Reports</h1>
          <p className="text-[13px] mt-0.5" style={subdued}>Most viewed and most ordered products, as an Excel analysis report</p>
        </div>
        <button type="button" onClick={download} disabled={downloading || !!error} className="sp-btn sp-btn-primary self-start sm:self-auto">
          {downloading ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}Download Excel
        </button>
      </div>

      {/* Date range */}
      <div className="sp-card p-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => choosePreset(p)}
              className={`sp-btn ${preset === p.key ? 'sp-btn-primary' : 'sp-btn-secondary'} h-8 px-3 text-[12px]`}
              aria-pressed={preset === p.key}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2 sm:ml-auto">
          <label className="text-[12px] grid gap-1" style={secondary}>
            From
            <input id="report-from" type="date" className="sp-input w-auto" value={from} max={to} onChange={(e) => e.target.value && setDay('from', e.target.value)} />
          </label>
          <label className="text-[12px] grid gap-1" style={secondary}>
            To
            <input id="report-to" type="date" className="sp-input w-auto" value={to} min={from} max={dubaiDay()} onChange={(e) => e.target.value && setDay('to', e.target.value)} />
          </label>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle size={14} />{error}
        </div>
      )}

      {totals && (
        <div className={`space-y-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <div className="sp-card overflow-hidden">
            <div className="flex overflow-x-auto no-scrollbar">
              <StatCell first label="Product page views" value={fmtInt(totals.views)} hint={`${fmtInt(totals.visitors)} unique visitors`} />
              <StatCell label="Orders" value={fmtInt(totals.orders)} hint={`${fmtInt(totals.cancelledOrders)} cancelled, not counted`} />
              <StatCell label="Units sold" value={fmtInt(totals.units)} hint="open and delivered orders" />
              <StatCell label="Sales" value={fmtAed(totals.sales)} hint="item prices, before order discounts" />
            </div>
            <p className="px-5 py-2 text-[12px]" style={{ ...subdued, borderTop: '1px solid var(--sp-border)', background: 'var(--sp-surface-sub)' }}>
              {data.viewsTrackedSince
                ? `Page views are counted since ${fmtDay(data.viewsTrackedSince)}. The Excel file has every product, including ones with no views or orders.`
                : 'No page views have been recorded yet.'}
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard title="Most viewed" hint="Top 10 by product page views · full list in the Excel file">
              {viewed.length === 0 ? (
                <EmptyState icon={Eye} title="No views in this period" description="Try a longer date range." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="sp-table">
                    <thead><tr><th>#</th><th>Product</th><th className="text-right">Views</th><th className="text-right">Visitors</th><th className="text-right">Viewers who ordered</th></tr></thead>
                    <tbody>
                      {viewed.map((p, i) => (
                        <tr key={p.id}>
                          <td className="tabular-nums" style={subdued}>{i + 1}</td>
                          <ProductCell p={p} />
                          <td className="text-right font-semibold tabular-nums">{fmtInt(p.views)}</td>
                          <td className="text-right tabular-nums" style={secondary}>{fmtInt(p.visitors)}</td>
                          <td className="text-right tabular-nums" style={secondary}>{fmtPct(p.conversion)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            <SectionCard title="Most ordered" hint="Top 10 by units sold · full list in the Excel file">
              {ordered.length === 0 ? (
                <EmptyState icon={ShoppingBag} title="No orders in this period" description="Try a longer date range." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="sp-table">
                    <thead><tr><th>#</th><th>Product</th><th className="text-right">Units</th><th className="text-right">Orders</th><th className="text-right">Sales</th></tr></thead>
                    <tbody>
                      {ordered.map((p, i) => (
                        <tr key={p.id}>
                          <td className="tabular-nums" style={subdued}>{i + 1}</td>
                          <ProductCell p={p} />
                          <td className="text-right font-semibold tabular-nums">{fmtInt(p.units)}</td>
                          <td className="text-right tabular-nums" style={secondary}>{fmtInt(p.orders)}</td>
                          <td className="text-right tabular-nums whitespace-nowrap" style={secondary}>{fmtAed(p.sales)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}
