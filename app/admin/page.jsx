'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  ArrowUpRight, ChevronRight, AlertTriangle, CheckCircle2,
  Package, Tag, Users, MessageSquare, TrendingUp, TrendingDown,
  CreditCard, ShoppingBag, Eye, Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import PageLoader from '@/app/components/PageLoader';
import { Sparkline, TimeChart, Donut, BarList } from './_components/Charts';

const DAY = 86_400_000;
const startOfDay = (ms) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };

const STATUS_BADGE = {
  Delivered:  'sp-badge-success',
  Shipped:    'sp-badge-info',
  Processing: 'sp-badge-info',
  Pending:    'sp-badge-warning',
  Cancelled:  'sp-badge-critical',
};

const PM = {
  card:           { label: 'Card',            color: '#1f6fdb' },
  tabby:          { label: 'Tabby',           color: '#00b8a9' },
  cashondelivery: { label: 'Cash on delivery', color: '#f1a33c' },
  cash:           { label: 'Cash on delivery', color: '#f1a33c' },
};
const STATUS_COLOR = {
  pending:    '#f1a33c',
  processing: '#1f6fdb',
  shipped:    '#4a90e2',
  delivered:  '#1f9d55',
  cancelled:  '#9aa5b1',
};

const aed = (n, max = 0) => `AED ${Number(n).toLocaleString(undefined, { maximumFractionDigits: max })}`;
const aedShort = (n) => (n >= 1000 ? `AED ${(n / 1000).toFixed(1)}K` : `AED ${Math.round(n)}`);
const pct = (c, p) => (p > 0 ? Math.round(((c - p) / p) * 100) : null);

const Delta = ({ delta }) => delta == null ? null : (
  <span
    className="inline-flex items-center gap-0.5 text-[12px] font-semibold"
    style={{ color: delta >= 0 ? '#0c7c4a' : 'var(--sp-text-secondary)' }}
  >
    {delta >= 0 ? <TrendingUp size={13} strokeWidth={2.4} /> : <TrendingDown size={13} strokeWidth={2.4} />}
    {delta >= 0 ? '+' : ''}{delta}%
  </span>
);

const Metric = ({ label, value, delta }) => (
  <div className="min-w-[92px]">
    <p className="text-[12px] mb-1.5 whitespace-nowrap" style={{ color: 'var(--sp-text-secondary)' }}>{label}</p>
    <div className="flex items-center gap-1.5">
      <span className="text-[19px] font-semibold leading-none whitespace-nowrap" style={{ color: 'var(--sp-text)' }}>{value}</span>
      <Delta delta={delta} />
    </div>
  </div>
);

const Kpi = ({ label, value, delta, spark, color }) => (
  <div className="sp-card sp-card-pad">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[13px] mb-1.5 truncate" style={{ color: 'var(--sp-text-secondary)' }}>{label}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[20px] font-semibold leading-none" style={{ color: 'var(--sp-text)' }}>{value}</span>
          <Delta delta={delta} />
        </div>
      </div>
      <Sparkline data={spark} color={color} />
    </div>
  </div>
);

const AdminDashboard = () => {
  const { products, allOrders, fetchAllOrders, fetchWithAuth } = useAppContext();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [notif, setNotif] = useState({ unreadChatsCount: 0, unreadOrdersCount: 0 });
  const [visits, setVisits] = useState({ visitors: 0, visitorsDelta: null, views: 0, series: new Array(30).fill(0) });
  const [productViews, setProductViews] = useState({});
  const [live, setLive] = useState(0);

  useEffect(() => {
    if (user?.role === 'admin') fetchAllOrders(1, 100);
  }, [fetchAllOrders, user]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    (async () => {
      try {
        const [n, v, pv] = await Promise.all([
          fetchWithAuth('/api/admin/notifications'),
          fetchWithAuth('/api/admin/analytics/visits'),
          fetchWithAuth('/api/products/view-count'),
        ]);
        if (n.ok) setNotif(await n.json());
        if (v.ok) setVisits(await v.json());
        if (pv.ok) setProductViews((await pv.json()).views || {});
      } catch {}
    })();
  }, [fetchWithAuth, user]);

  // Realtime "live visitors" — polled every 25s.
  useEffect(() => {
    if (user?.role !== 'admin') return;
    let stop = false;
    const load = async () => {
      try {
        const r = await fetchWithAuth('/api/admin/analytics/live');
        if (r.ok && !stop) setLive((await r.json()).live || 0);
      } catch {}
    };
    load();
    const id = setInterval(load, 25_000);
    return () => { stop = true; clearInterval(id); };
  }, [fetchWithAuth, user]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  /* ── Analytics (last 30 days vs prior 30 days) ── */
  const a = useMemo(() => {
    const orders = allOrders.orders || [];
    const valid = orders.filter(o => (o.status || '').toLowerCase() !== 'cancelled');
    const today0 = startOfDay(Date.now());

    const seriesFor = (days, shift) => {
      const end0 = today0 - shift * DAY;
      const sales = new Array(days).fill(0);
      const count = new Array(days).fill(0);
      const cust = Array.from({ length: days }, () => new Set());
      valid.forEach(o => {
        const d0 = startOfDay(new Date(o.createdAt).getTime());
        const idx = days - 1 - Math.round((end0 - d0) / DAY);
        if (idx >= 0 && idx < days) {
          sales[idx] += Number(o.totalAmount || 0);
          count[idx] += 1;
          cust[idx].add(o.customerEmail);
        }
      });
      return { sales, count, customers: cust.map(s => s.size) };
    };

    const cur = seriesFor(30, 0);
    const prev = seriesFor(30, 30);
    const sum = arr => arr.reduce((s, v) => s + v, 0);

    const grossCur = sum(cur.sales), grossPrev = sum(prev.sales);
    const ordCur = sum(cur.count),  ordPrev = sum(prev.count);
    const aovCur = ordCur ? grossCur / ordCur : 0;
    const aovPrev = ordPrev ? grossPrev / ordPrev : 0;

    const cut30 = today0 - 29 * DAY;
    const last30 = valid.filter(o => startOfDay(new Date(o.createdAt).getTime()) >= cut30);
    const custCur = new Set(last30.map(o => o.customerEmail)).size;
    const prevCut = today0 - 59 * DAY;
    const prevWin = valid.filter(o => {
      const d0 = startOfDay(new Date(o.createdAt).getTime());
      return d0 >= prevCut && d0 < cut30;
    });
    const custPrev = new Set(prevWin.map(o => o.customerEmail)).size;

    const aovSeries = cur.sales.map((s, i) => (cur.count[i] ? s / cur.count[i] : 0));
    const days = Array.from({ length: 30 }, (_, i) => new Date(today0 - (29 - i) * DAY));
    const xLabels = days.map((d, i) =>
      (i % 6 === 0 || i === 29) ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''
    );

    // payment-method split (last 30d)
    const pmMap = {};
    last30.forEach(o => {
      const key = (o.paymentMethod || 'other').toLowerCase().replace(/[^a-z]/g, '');
      const meta = PM[key] || { label: 'Other', color: '#9aa5b1' };
      if (!pmMap[meta.label]) pmMap[meta.label] = { label: meta.label, value: 0, color: meta.color };
      pmMap[meta.label].value += Number(o.totalAmount || 0);
    });
    const payments = Object.values(pmMap).sort((x, y) => y.value - x.value);

    // orders by status (last 30d)
    const stMap = {};
    last30.forEach(o => {
      const k = (o.status || 'other').toLowerCase();
      if (!stMap[k]) stMap[k] = 0;
      stMap[k] += 1;
    });
    const statuses = Object.entries(stMap)
      .map(([k, v]) => ({ key: k, label: k[0].toUpperCase() + k.slice(1), value: v, color: STATUS_COLOR[k] || '#9aa5b1', dot: true, display: String(v) }))
      .sort((x, y) => y.value - x.value);

    // sales by status (amount, last 30d) for breakdown
    const stSales = {};
    last30.forEach(o => {
      const k = (o.status || 'other').toLowerCase();
      stSales[k] = (stSales[k] || 0) + Number(o.totalAmount || 0);
    });

    // top products by revenue (last 30d, from order line items)
    const prodMap = {};
    last30.forEach(o => {
      (o.items || []).forEach(it => {
        const id = it.productId;
        if (id == null) return;
        if (!prodMap[id]) prodMap[id] = { id, name: it.name, imageUrl: it.imageUrl, brandName: it.brandName, units: 0, revenue: 0 };
        const qty = Number(it.quantity || 0);
        prodMap[id].units += qty;
        prodMap[id].revenue += qty * Number(it.price || 0);
      });
    });
    const allSold = Object.values(prodMap);
    // Fast movers: highest unit velocity in the period (needs a meaningful sample, not a one-off sale).
    const fastMovingIds = new Set(
      [...allSold].sort((x, y) => y.units - x.units).slice(0, 3).filter(p => p.units >= 3).map(p => p.id)
    );
    const topProducts = allSold
      .sort((x, y) => y.revenue - x.revenue)
      .slice(0, 5)
      .map(p => ({ ...p, views: productViews[p.id] || 0, fastMoving: fastMovingIds.has(p.id) }));

    // Most viewed products (last 30 days), joined against the full catalog for name/image/brand.
    const mostViewed = Object.entries(productViews)
      .map(([id, views]) => {
        const prod = products.find(pp => String(pp.id) === String(id));
        return prod ? { id: prod.id, name: prod.name, imageUrl: prod.imageUrl, brandName: prod.brandName, views } : null;
      })
      .filter(Boolean)
      .sort((x, y) => y.views - x.views)
      .slice(0, 5);

    return {
      cur, prev, days, xLabels, aovSeries,
      grossCur, grossDelta: pct(grossCur, grossPrev),
      ordCur, ordDelta: pct(ordCur, ordPrev),
      aovCur, aovDelta: pct(aovCur, aovPrev),
      custCur, custDelta: pct(custCur, custPrev),
      payments, statuses, stSales, topProducts, mostViewed,
      pending: orders.filter(o => (o.status || '').toLowerCase() === 'pending').length,
      toCapture: orders.filter(o =>
        (o.status || '').toLowerCase() === 'pending' &&
        ['card', 'tabby'].includes((o.paymentMethod || '').toLowerCase())
      ).length,
    };
  }, [allOrders.orders, productViews, products]);

  const lowStockAll = useMemo(() => products.filter(p => p.stock_quantity <= 5), [products]);
  const lowStock = lowStockAll.slice(0, 4);

  if (loading || !user || user.role !== 'admin') return <PageLoader />;

  const actions = [
    { icon: MessageSquare, label: 'New customer messages', count: notif.unreadChatsCount || 0, href: '/admin/chat',     bg: '#e7f0ff', fg: '#1f6fdb' },
    { icon: ShoppingBag,   label: 'Orders to fulfill',      count: a.pending,                   href: '/admin/orders',   bg: '#fff2e0', fg: '#b86b00' },
    { icon: CreditCard,    label: 'Payments to capture',    count: a.toCapture,                 href: '/admin/payments', bg: '#e6f7f1', fg: '#0c7c4a' },
    { icon: AlertTriangle, label: 'Products low on stock',  count: lowStockAll.length,          href: '/admin/products', bg: '#fde8e8', fg: '#c0362c' },
  ].filter(x => x.count > 0);

  const totalSales = a.grossCur;
  const breakdown = a.statuses.map(s => ({
    label: s.label,
    value: a.stSales[s.key] || 0,
    color: s.color,
    display: aed(a.stSales[s.key] || 0, 2),
  }));

  return (
    <div className="space-y-5">

      {/* ── Hero with dotted globe + metric bar + action center ── */}
      <div className="sp-hero -mx-4 sm:-mx-6 px-4 sm:px-6 pt-1">
        <span aria-hidden className="sp-globe-ring r1" />
        <span aria-hidden className="sp-globe-ring r2" />
        <span aria-hidden className="sp-globe" />

        <div className="relative z-10 flex flex-wrap items-start gap-x-7 gap-y-4">
          <div className="min-w-[110px]">
            <p className="text-[13px] font-semibold whitespace-nowrap" style={{ color: 'var(--sp-text)' }}>All channels</p>
            <p className="text-[12px] whitespace-nowrap" style={{ color: 'var(--sp-text-secondary)' }}>Last 30 days</p>
          </div>
          <Metric label="Visitors" value={visits.visitors.toLocaleString()} delta={visits.visitorsDelta} />
          <Metric label="Total sales" value={aed(a.grossCur)} delta={a.grossDelta} />
          <Metric label="Orders" value={a.ordCur} delta={a.ordDelta} />
          <Metric label="Pending" value={a.pending} />
          <Metric label="Customers" value={a.custCur} delta={a.custDelta} />
          <Metric label="Products" value={products.length} />

          <div className="ml-auto text-right pl-2">
            <p className="text-[12px] whitespace-nowrap" style={{ color: 'var(--sp-text-secondary)' }}>Live visitors</p>
            <div className="flex items-center justify-end gap-2 mt-1.5">
              <span className="text-[19px] font-semibold leading-none" style={{ color: 'var(--sp-text)' }}>{live}</span>
              <span className="sp-live-ring" aria-hidden />
            </div>
          </div>
        </div>

        <div className="relative z-10 text-center pt-14 pb-12 sm:pt-20 sm:pb-14">
          <h1 className="text-[28px] sm:text-[34px] font-semibold leading-[1.12] tracking-[-0.01em]" style={{ color: 'var(--sp-text)' }}>
            {greeting}!
          </h1>
          <h2 className="text-[28px] sm:text-[34px] font-semibold leading-[1.12] tracking-[-0.01em] mb-7" style={{ color: 'var(--sp-text)' }}>
            Let&apos;s continue growing your business.
          </h2>

          {/* Action center */}
          <div className="mx-auto w-full max-w-[480px] text-left sp-card overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--sp-border)' }}>
              <span className="sp-section-title">Needs your attention</span>
            </div>
            {actions.length === 0 ? (
              <div className="px-4 py-7 flex flex-col items-center gap-2">
                <CheckCircle2 size={26} strokeWidth={1.5} style={{ color: '#1f9d55' }} />
                <p className="text-[13px]" style={{ color: 'var(--sp-text-subdued)' }}>You&apos;re all caught up.</p>
              </div>
            ) : actions.map(({ icon: Icon, label, count, href, bg, fg }, i) => (
              <button
                key={label}
                onClick={() => router.push(href)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#fafafa] transition-colors cursor-pointer"
                style={{ borderBottom: i < actions.length - 1 ? '1px solid #f1f1f1' : 'none' }}
              >
                <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: bg, color: fg }}>
                  <Icon size={16} />
                </span>
                <span className="flex-1 text-[13.5px] font-medium text-left" style={{ color: 'var(--sp-text)' }}>{label}</span>
                <span className="min-w-[24px] h-6 px-2 rounded-full text-[12px] font-bold flex items-center justify-center" style={{ background: bg, color: fg }}>
                  {count}
                </span>
                <ChevronRight size={16} style={{ color: 'var(--sp-text-subdued)' }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Performance KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi label="Gross sales"      value={aed(a.grossCur)}      delta={a.grossDelta} spark={a.cur.sales}     color="#1f6fdb" />
        <Kpi label="Orders"           value={a.ordCur}             delta={a.ordDelta}   spark={a.cur.count}     color="#00b8a9" />
        <Kpi label="Average order value" value={aed(a.aovCur, 2)}  delta={a.aovDelta}   spark={a.aovSeries}     color="#7b61ff" />
        <Kpi label="Customers"        value={a.custCur}            delta={a.custDelta}  spark={a.cur.customers} color="#f1a33c" />
      </div>

      {/* ── Sales over time + breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 sp-card sp-card-pad">
          <p className="text-[13px]" style={{ color: 'var(--sp-text-secondary)' }}>Total sales over time</p>
          <div className="flex items-center gap-2 mt-1 mb-4">
            <span className="text-[24px] font-semibold leading-none" style={{ color: 'var(--sp-text)' }}>{aed(a.grossCur, 2)}</span>
            <Delta delta={a.grossDelta} />
          </div>
          <TimeChart current={a.cur.sales} previous={a.prev.sales} xLabels={a.xLabels} format={v => `AED ${Math.round(v).toLocaleString()}`} />
          <div className="flex items-center gap-4 mt-3 pl-1">
            <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--sp-text-secondary)' }}>
              <span className="w-3 h-[3px] rounded-full" style={{ background: '#1f6fdb' }} /> Last 30 days
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--sp-text-secondary)' }}>
              <span className="w-3 h-0 border-t-2 border-dashed" style={{ borderColor: '#9fc3ef' }} /> Previous 30 days
            </span>
          </div>
        </div>

        <div className="sp-card sp-card-pad">
          <p className="sp-section-title mb-4">Sales breakdown</p>
          <div className="space-y-3.5">
            {breakdown.length === 0 && (
              <p className="text-[13px] py-4 text-center" style={{ color: 'var(--sp-text-subdued)' }}>No sales in this period</p>
            )}
            {breakdown.map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-[13px] inline-flex items-center gap-2" style={{ color: 'var(--sp-text-secondary)' }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: row.color }} />
                  {row.label}
                </span>
                <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--sp-text)' }}>{row.display}</span>
              </div>
            ))}
            {breakdown.length > 0 && (
              <div className="flex items-center justify-between pt-3 mt-1" style={{ borderTop: '1px solid var(--sp-border)' }}>
                <span className="text-[13px] font-semibold" style={{ color: 'var(--sp-text)' }}>Total sales</span>
                <span className="text-[14px] font-bold tabular-nums" style={{ color: 'var(--sp-text)' }}>{aed(totalSales, 2)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Top products + payment method ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 sp-card sp-card-pad">
          <div className="flex items-center justify-between mb-4">
            <p className="sp-section-title">Top products by sales</p>
            <span className="text-[12px]" style={{ color: 'var(--sp-text-subdued)' }}>Last 30 days</span>
          </div>
          <div className="space-y-3.5">
            {a.topProducts.length === 0 && (
              <p className="text-[13px] py-6 text-center" style={{ color: 'var(--sp-text-subdued)' }}>No product sales in this period</p>
            )}
            {a.topProducts.map((p, i) => {
              const maxRev = Math.max(...a.topProducts.map(t => t.revenue), 1);
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-[12px] font-semibold w-3.5 text-center tabular-nums shrink-0" style={{ color: 'var(--sp-text-subdued)' }}>{i + 1}</span>
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: '#f1f1f1', border: '1px solid var(--sp-border)' }}>
                    {p.imageUrl
                      ? <Image src={p.imageUrl} alt={p.name} fill className="object-contain p-0.5" />
                      : <Package size={14} style={{ color: 'var(--sp-text-subdued)' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <p className="text-[13px] font-medium truncate min-w-0" style={{ color: 'var(--sp-text)' }}>
                          {p.name}{p.brandName ? <span className="font-normal" style={{ color: 'var(--sp-text-subdued)' }}> · {p.brandName}</span> : null}
                        </p>
                        {p.fastMoving && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0" style={{ background: '#fff2e0', color: '#b86b00' }}>
                            <Zap size={9} strokeWidth={2.6} /> Fast moving
                          </span>
                        )}
                      </div>
                      <span className="text-[13px] font-semibold tabular-nums shrink-0" style={{ color: 'var(--sp-text)' }}>{aed(p.revenue, 2)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#f1f1f1' }}>
                        <div className="h-full rounded-full" style={{ width: `${(p.revenue / maxRev) * 100}%`, background: '#1f6fdb' }} />
                      </div>
                      <span className="text-[11px] tabular-nums shrink-0" style={{ color: 'var(--sp-text-subdued)' }}>{p.units} sold</span>
                      <span className="text-[11px] tabular-nums shrink-0 inline-flex items-center gap-0.5" style={{ color: 'var(--sp-text-subdued)' }}>
                        <Eye size={11} /> {p.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="sp-card sp-card-pad">
          <p className="sp-section-title mb-4">Sales by payment method</p>
          <div className="flex items-center gap-5">
            <Donut
              segments={a.payments}
              centerLabel={aedShort(a.grossCur)}
              centerSub="last 30 days"
            />
            <div className="flex-1 space-y-2.5 min-w-0">
              {a.payments.length === 0 && <p className="text-[13px]" style={{ color: 'var(--sp-text-subdued)' }}>No sales yet</p>}
              {a.payments.map(p => (
                <div key={p.label} className="flex items-center justify-between gap-2">
                  <span className="text-[13px] inline-flex items-center gap-2 truncate" style={{ color: 'var(--sp-text-secondary)' }}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                    <span className="truncate">{p.label}</span>
                  </span>
                  <span className="text-[13px] font-semibold tabular-nums shrink-0" style={{ color: 'var(--sp-text)' }}>{aed(p.value, 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Most viewed products ── */}
      <div className="sp-card sp-card-pad">
        <div className="flex items-center justify-between mb-4">
          <p className="sp-section-title">Most viewed products</p>
          <span className="text-[12px]" style={{ color: 'var(--sp-text-subdued)' }}>Last 30 days</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {a.mostViewed.length === 0 && (
            <p className="text-[13px] py-6 text-center col-span-full" style={{ color: 'var(--sp-text-subdued)' }}>No product views recorded yet</p>
          )}
          {a.mostViewed.map((p, i) => {
            const maxViews = Math.max(...a.mostViewed.map(t => t.views), 1);
            return (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-[12px] font-semibold w-3.5 text-center tabular-nums shrink-0" style={{ color: 'var(--sp-text-subdued)' }}>{i + 1}</span>
                <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: '#f1f1f1', border: '1px solid var(--sp-border)' }}>
                  {p.imageUrl
                    ? <Image src={p.imageUrl} alt={p.name} fill className="object-contain p-0.5" />
                    : <Package size={14} style={{ color: 'var(--sp-text-subdued)' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate" style={{ color: 'var(--sp-text)' }}>
                    {p.name}{p.brandName ? <span className="font-normal" style={{ color: 'var(--sp-text-subdued)' }}> · {p.brandName}</span> : null}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#f1f1f1' }}>
                      <div className="h-full rounded-full" style={{ width: `${(p.views / maxViews) * 100}%`, background: '#7b61ff' }} />
                    </div>
                    <span className="text-[11px] font-semibold tabular-nums shrink-0 inline-flex items-center gap-0.5" style={{ color: 'var(--sp-text-subdued)' }}>
                      <Eye size={11} /> {p.views.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Visitors + orders by status + AOV over time ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <div className="sp-card sp-card-pad">
          <p className="text-[13px]" style={{ color: 'var(--sp-text-secondary)' }}>Website visitors over time</p>
          <div className="flex items-center gap-2 mt-1 mb-3">
            <span className="text-[20px] font-semibold leading-none" style={{ color: 'var(--sp-text)' }}>{visits.visitors.toLocaleString()}</span>
            <Delta delta={visits.visitorsDelta} />
            {visits.views > 0 && (
              <span className="text-[12px]" style={{ color: 'var(--sp-text-subdued)' }}>· {visits.views.toLocaleString()} views</span>
            )}
          </div>
          <TimeChart current={visits.series} previous={[]} xLabels={a.xLabels} height={150} format={v => Math.round(v).toLocaleString()} />
        </div>

        <div className="sp-card sp-card-pad">
          <p className="sp-section-title mb-4">Orders by status</p>
          <BarList items={a.statuses} />
        </div>

        <div className="sp-card sp-card-pad">
          <p className="text-[13px]" style={{ color: 'var(--sp-text-secondary)' }}>Average order value over time</p>
          <div className="flex items-center gap-2 mt-1 mb-3">
            <span className="text-[20px] font-semibold leading-none" style={{ color: 'var(--sp-text)' }}>{aed(a.aovCur, 2)}</span>
            <Delta delta={a.aovDelta} />
          </div>
          <TimeChart current={a.aovSeries} previous={[]} xLabels={a.xLabels} height={150} format={v => `AED ${Math.round(v)}`} />
        </div>
      </div>

      {/* ── Recent orders + low stock ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 sp-card overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--sp-border)' }}>
            <h2 className="sp-section-title">Recent orders</h2>
            <button onClick={() => router.push('/admin/orders')} className="sp-btn sp-btn-plain text-[13px]">
              View all <ChevronRight size={14} />
            </button>
          </div>
          <table className="sp-table">
            <thead>
              <tr>
                <th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(allOrders.orders || []).slice(0, 8).map(order => (
                <tr key={order.id} onClick={() => router.push(`/admin/orders/${order.id}`)} className="cursor-pointer">
                  <td className="font-semibold">#{order.id}</td>
                  <td className="truncate max-w-[180px]" style={{ color: 'var(--sp-text-secondary)' }}>{order.customerEmail}</td>
                  <td style={{ color: 'var(--sp-text-secondary)' }}>
                    {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </td>
                  <td>
                    <span className={`sp-badge ${STATUS_BADGE[order.status] || 'sp-badge-neutral'}`}>
                      <span className="dot" />{order.status}
                    </span>
                  </td>
                  <td className="text-right font-semibold">AED {Number(order.totalAmount).toFixed(2)}</td>
                </tr>
              ))}
              {(allOrders.orders || []).length === 0 && (
                <tr><td colSpan={5} className="text-center py-8" style={{ color: 'var(--sp-text-subdued)' }}>No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-5">
          <div className="sp-card sp-card-pad">
            <div className="flex items-center justify-between mb-4">
              <h3 className="sp-section-title">Low stock</h3>
              <AlertTriangle size={15} style={{ color: '#b97a00' }} />
            </div>
            <div className="space-y-3.5">
              {lowStock.map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden" style={{ background: '#f1f1f1', border: '1px solid var(--sp-border)' }}>
                    <Image src={p.imageUrl} alt={p.name} fill className="object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate" style={{ color: 'var(--sp-text)' }}>{p.name}</p>
                    <p className="text-[12px]" style={{ color: '#b42318' }}>{p.stock_quantity} in stock</p>
                  </div>
                  <button onClick={() => router.push('/admin/products')} style={{ color: 'var(--sp-text-subdued)' }}>
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              ))}
              {lowStock.length === 0 && (
                <div className="py-3 text-center">
                  <CheckCircle2 className="mx-auto mb-2" size={26} strokeWidth={1.5} style={{ color: '#0c7c4a' }} />
                  <p className="text-[12px]" style={{ color: 'var(--sp-text-subdued)' }}>Everything is stocked</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Brands', icon: Tag, href: '/admin/brands' },
              { label: 'Categories', icon: Package, href: '/admin/categories' },
              { label: 'Customers', icon: Users, href: '/admin/users' },
              { label: 'Inbox', icon: MessageSquare, href: '/admin/chat' },
            ].map(({ label, icon: Icon, href }) => (
              <button
                key={label}
                onClick={() => router.push(href)}
                className="sp-card p-4 flex flex-col items-center gap-2 hover:bg-[#fafafa] transition-colors cursor-pointer"
              >
                <Icon size={20} style={{ color: 'var(--sp-text-secondary)' }} />
                <span className="text-[12px] font-medium" style={{ color: 'var(--sp-text)' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
