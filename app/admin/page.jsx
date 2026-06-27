'use client';
import React, { useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  ArrowUpRight, ChevronRight, Plus, AlertTriangle, CheckCircle2,
  Package, Tag, Users, MessageSquare,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import PageLoader from '@/app/components/PageLoader';

const STATUS_BADGE = {
  Delivered:  'sp-badge-success',
  Shipped:    'sp-badge-info',
  Processing: 'sp-badge-info',
  Pending:    'sp-badge-warning',
  Cancelled:  'sp-badge-critical',
};

const Metric = ({ label, value, delta, deltaUp }) => (
  <div className="px-5 py-1 min-w-[120px]">
    <p className="text-[12px] mb-1" style={{ color: 'var(--sp-text-secondary)' }}>{label}</p>
    <div className="flex items-baseline gap-2">
      <span className="text-[18px] font-semibold" style={{ color: 'var(--sp-text)' }}>{value}</span>
      {delta != null && (
        <span className="text-[12px] font-medium" style={{ color: deltaUp ? '#0c7c4a' : '#8a8a8a' }}>
          {deltaUp ? '▲' : '—'} {delta}
        </span>
      )}
    </div>
  </div>
);

const AdminDashboard = () => {
  const { products, allOrders, fetchAllOrders } = useAppContext();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === 'admin') fetchAllOrders(1, 100);
  }, [fetchAllOrders, user]);

  const stats = useMemo(() => {
    const now = new Date();
    const ago30 = new Date(now.setDate(now.getDate() - 30));
    const recent = allOrders.orders.filter(o => new Date(o.createdAt) >= ago30 && o.status !== 'Cancelled');
    return {
      revenue:   recent.reduce((s, o) => s + Number(o.totalAmount), 0),
      orders:    recent.length,
      pending:   allOrders.orders.filter(o => o.status === 'Pending').length,
      customers: new Set(allOrders.orders.map(o => o.customerEmail)).size,
    };
  }, [allOrders.orders]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  if (loading || !user || user.role !== 'admin') return <PageLoader />;

  const lowStock = products.filter(p => p.stock_quantity <= 5).slice(0, 4);

  return (
    <div className="space-y-5">

      {/* Metric strip */}
      <div className="sp-card overflow-hidden">
        <div className="flex flex-wrap items-center divide-x" style={{ borderColor: 'var(--sp-border)' }}>
          <div className="px-5 py-3">
            <p className="text-[13px] font-semibold" style={{ color: 'var(--sp-text)' }}>All channels</p>
            <p className="text-[12px]" style={{ color: 'var(--sp-text-secondary)' }}>Last 30 days</p>
          </div>
          <Metric label="Total sales" value={`AED ${stats.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
          <Metric label="Orders" value={stats.orders} delta={`${stats.orders}`} deltaUp />
          <Metric label="Pending" value={stats.pending} />
          <Metric label="Customers" value={stats.customers} />
          <Metric label="Products" value={products.length} />
        </div>
      </div>

      {/* Greeting */}
      <div className="sp-card sp-card-pad text-center py-10">
        <h1 className="text-[26px] sm:text-[30px] font-semibold leading-tight" style={{ color: 'var(--sp-text)' }}>
          {greeting}!
        </h1>
        <p className="text-[20px] sm:text-[24px] mt-1" style={{ color: 'var(--sp-text-secondary)' }}>
          Let&apos;s continue growing your business.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <button onClick={() => router.push('/admin/products')} className="sp-btn sp-btn-primary">
            <Plus size={15} /> Add product
          </button>
          <button onClick={() => router.push('/admin/orders')} className="sp-btn sp-btn-secondary">
            View orders
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent orders */}
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
              {allOrders.orders.slice(0, 8).map(order => (
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
              {allOrders.orders.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8" style={{ color: 'var(--sp-text-subdued)' }}>No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Side column */}
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
