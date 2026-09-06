'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { Package, Search, X, Truck, CheckCircle, RefreshCw, FileText, ChevronDown } from 'lucide-react';
import AccountShell from '../_components/AccountShell';
import { useAccountData } from '../_components/useAccountData';
import { useAppContext } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import { statusMeta } from '../_components/orderStatus';

const TAB_ORDER = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
  { id: 'highest', label: 'Highest total' },
  { id: 'lowest', label: 'Lowest total' },
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function orderTotal(o) {
  return Number(o.totalAmount || o.total_amount || o.total || 0);
}

export default function AccountOrdersPage() {
  const { orders, wishlistItems, isLoading } = useAccountData();
  const { products } = useAppContext();
  const { addToCart } = useCart();
  const wishCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0;

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [buyingAgainId, setBuyingAgainId] = useState(null);

  const tabCounts = useMemo(() => {
    const counts = { all: orders.length };
    for (const o of orders) {
      const key = (o.status || '').toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [orders]);

  const visibleTabs = useMemo(
    () => ['all', ...TAB_ORDER.filter(key => tabCounts[key] > 0)],
    [tabCounts]
  );

  const filtered = useMemo(() => {
    let list = orders;

    if (activeTab !== 'all') {
      list = list.filter(o => (o.status || '').toLowerCase() === activeTab);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(o =>
        String(o.id).includes(q) ||
        (o.status || '').toLowerCase().includes(q) ||
        (o.items || []).some(i => (i.name || '').toLowerCase().includes(q))
      );
    }

    const sorted = [...list];
    switch (sortBy) {
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt || a.created_at) - new Date(b.createdAt || b.created_at));
        break;
      case 'highest':
        sorted.sort((a, b) => orderTotal(b) - orderTotal(a));
        break;
      case 'lowest':
        sorted.sort((a, b) => orderTotal(a) - orderTotal(b));
        break;
      default:
        sorted.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
    }
    return sorted;
  }, [orders, activeTab, query, sortBy]);

  const handleBuyAgain = (e, order) => {
    e.preventDefault();
    e.stopPropagation();
    const items = order.items || [];
    let added = 0;
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (product && Number(product.stock_quantity) > 0) {
        addToCart(product, item.quantity || 1);
        added += 1;
      }
    }
    if (added === 0) {
      toast.error('These items are no longer available.');
      return;
    }
    if (added < items.length) {
      toast.info('Some items were out of stock and skipped.');
    }
    setBuyingAgainId(order.id);
    setTimeout(() => setBuyingAgainId(null), 2000);
  };

  return (
    <AccountShell wishCount={wishCount}>
      <div className="w-full">

        {/* Search bar */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by order ID, product or status…"
            className="w-full pl-9 pr-9 h-9 text-[13px] rounded-md border border-[#eaeaea] bg-white text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status tabs + sort */}
        {orders.length > 0 && (
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {visibleTabs.map(key => {
                const meta = key === 'all' ? { label: 'All' } : statusMeta(key);
                const active = activeTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`shrink-0 px-3 h-8 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap ${
                      active ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {meta.label} <span className={active ? 'text-purple-100' : 'text-gray-400'}>{tabCounts[key] || 0}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-7 h-8 text-[12px] font-medium rounded-md border border-[#eaeaea] bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                {SORT_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Order list */}
        <div className="space-y-3 w-full">
          {isLoading ? (
            <div className="py-16 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              {query || activeTab !== 'all' ? 'No orders match your filters.' : 'No orders yet.'}
            </div>
          ) : (
            filtered.map((o) => {
              const items = o.items || [];
              const total = orderTotal(o);
              const date = formatDate(o.createdAt || o.created_at);
              const previews = items.slice(0, 3);
              const extra = items.length - previews.length;
              const { label, badge, Icon } = statusMeta(o.status);
              const justAdded = buyingAgainId === o.id;

              return (
                <div key={o.id} className="bg-white rounded-lg border border-[#eaeaea] hover:border-gray-300 transition-colors">
                  <Link href={`/account/orders/${o.id}`} className="flex items-center gap-4 p-4 group">
                    {/* Product image stack */}
                    <div className="flex -space-x-3 shrink-0">
                      {previews.length > 0 ? (
                        previews.map((item, idx) => (
                          <div
                            key={idx}
                            className="w-14 h-14 rounded-xl border-2 border-white bg-white overflow-hidden relative shadow-sm"
                            style={{ zIndex: previews.length - idx }}
                          >
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt={item.name || ''}
                                fill
                                className="object-contain p-1"
                                sizes="56px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <Package size={16} className="text-gray-300" />
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="w-14 h-14 rounded-xl border-2 border-white bg-gray-100 flex items-center justify-center shadow-sm">
                          <Package size={18} className="text-gray-300" />
                        </div>
                      )}
                      {extra > 0 && (
                        <div className="w-14 h-14 rounded-xl border-2 border-white bg-purple-50 flex items-center justify-center text-[11px] font-bold text-purple-600 shadow-sm" style={{ zIndex: 0 }}>
                          +{extra}
                        </div>
                      )}
                    </div>

                    {/* Order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-gray-900">Order #{o.id}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${badge}`}>
                          <Icon size={10} strokeWidth={2.5} />
                          {label}
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-500 mt-0.5">
                        {date}{items.length > 0 ? ` · ${items.length} item${items.length > 1 ? 's' : ''}` : ''}
                      </p>
                      {items[0]?.name && (
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">{items[0].name}{items.length > 1 ? ` & ${items.length - 1} more` : ''}</p>
                      )}
                    </div>

                    {/* Amount + CTA */}
                    <div className="text-right shrink-0">
                      <div className="text-[15px] font-bold text-gray-900">AED {total.toFixed(0)}</div>
                      <span className="text-[11px] text-purple-600 font-medium group-hover:underline">View details →</span>
                    </div>
                  </Link>

                  {/* Quick actions */}
                  <div className="flex items-center gap-2 px-4 pb-3">
                    <button
                      onClick={(e) => handleBuyAgain(e, o)}
                      className={`flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[11px] font-medium border transition-colors ${
                        justAdded ? 'border-green-200 bg-green-50 text-green-700' : 'border-[#eaeaea] text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {justAdded ? <CheckCircle size={11} /> : <RefreshCw size={11} />}
                      {justAdded ? 'Added to cart' : 'Buy again'}
                    </button>

                    {o.courierWebsite && (
                      <a
                        href={o.courierWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[11px] font-medium border border-[#eaeaea] text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <Truck size={11} />
                        Track order
                      </a>
                    )}

                    <a
                      href={`/api/orders/${o.id}/invoice`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[11px] font-medium border border-[#eaeaea] text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <FileText size={11} />
                      Invoice
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AccountShell>
  );
}
