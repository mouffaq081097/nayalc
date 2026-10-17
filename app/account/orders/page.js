'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { Package, Search, X, ChevronDown, ChevronRight } from 'lucide-react';
import AccountPage, { SOLID_PILL, Spinner, TEXT_LINK } from '../_components/AccountPage';
import { useAccountData } from '../_components/useAccountData';
import { useAppContext } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import { statusMeta } from '../_components/orderStatus';
import { trackingUrl } from '@/lib/courier';
import { formatAED } from '../../lib/utils';

const TAB_ORDER = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
  { id: 'highest', label: 'Highest total' },
  { id: 'lowest', label: 'Lowest total' },
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function orderTotal(o) {
  return Number(o.totalAmount || o.total_amount || o.total || 0);
}

export default function AccountOrdersPage() {
  const { orders, isLoading } = useAccountData();
  const { products } = useAppContext();
  const { addToCart } = useCart();

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
    <AccountPage title="Your orders" subtitle={orders.length > 0 ? `${orders.length} order${orders.length === 1 ? '' : 's'}` : undefined}>
      {orders.length > 0 && (
        <div className="mt-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          {/* Status tabs, as the tier tabs on Naya Rewards */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 md:mx-0 md:px-0 md:flex-1" role="tablist" aria-label="Order status">
            {visibleTabs.map(key => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(key)}
                  className={`shrink-0 h-10 px-4 rounded-md text-[14px] whitespace-nowrap transition-colors ${active ? 'bg-[#111114] text-white' : 'bg-[#f3f2ef] text-[#6b6b72] hover:text-[#111114]'}`}
                >
                  {key === 'all' ? 'All' : statusMeta(key).label} <span className={active ? 'text-white/60' : 'text-[#9a9aa2]'}>{tabCounts[key] || 0}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:w-64">
              <Search size={15} className="absolute left-0 top-1/2 -translate-y-1/2 text-[#6b6b72]" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search orders"
                className="w-full h-10 pl-6 pr-6 bg-transparent border-b border-[#111114] text-[14px] placeholder:text-[#9a9aa2] focus:outline-none"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-0 top-1/2 -translate-y-1/2 text-[#6b6b72] hover:text-[#111114]">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                aria-label="Sort orders"
                className="appearance-none h-10 pl-0 pr-6 bg-transparent text-[14px] focus:outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {isLoading ? <Spinner /> : orders.length === 0 ? (
        <div className="mt-8 rounded-md bg-[#f6f5f2] py-14 px-6 text-center">
          <p className="text-[16px]">You haven&apos;t placed any orders yet.</p>
          <Link href="/all-products" className={`${SOLID_PILL} mt-6`}>Start shopping</Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-8 py-10 text-center text-[15px] text-[#6b6b72]">No orders match your search.</p>
      ) : (
        <ul className="mt-6 border-t border-[#111114] divide-y divide-[#ececec]">
          {filtered.map((o) => {
            const items = o.items || [];
            const previews = items.slice(0, 3);
            const extra = items.length - previews.length;
            const meta = statusMeta(o.status, o.awaitingStock);
            const justAdded = buyingAgainId === o.id;
            const track = trackingUrl(o);

            return (
              <li key={o.id} className="py-5 md:py-6">
                <Link href={`/account/orders/${o.id}`} className="flex items-center gap-4 group">
                  <div className="flex -space-x-3 shrink-0">
                    {previews.map((item, idx) => (
                      <span key={idx} className="relative w-14 h-14 md:w-[72px] md:h-[72px] bg-[#f6f5f2] border-2 border-white" style={{ zIndex: previews.length - idx }}>
                        {item.imageUrl
                          ? <Image src={item.imageUrl} alt="" fill sizes="72px" className="object-contain p-1 mix-blend-multiply" />
                          : <Package size={18} strokeWidth={1.25} className="absolute inset-0 m-auto text-gray-400" />}
                      </span>
                    ))}
                    {previews.length === 0 && (
                      <span className="w-14 h-14 md:w-[72px] md:h-[72px] bg-[#f6f5f2] flex items-center justify-center"><Package size={20} strokeWidth={1.25} className="text-gray-400" /></span>
                    )}
                    {extra > 0 && (
                      <span className="w-14 h-14 md:w-[72px] md:h-[72px] bg-[#f6f5f2] border-2 border-white flex items-center justify-center text-[13px] text-[#6b6b72]">+{extra}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] md:text-[16px] font-medium">Order #{o.id}</p>
                    <p className="text-[13px] text-[#6b6b72]">
                      {formatDate(o.createdAt || o.created_at)} · {items.length} {items.length === 1 ? 'item' : 'items'}
                    </p>
                    {items[0]?.name && (
                      <p className="hidden md:block text-[13px] text-[#9a9aa2] truncate">{items[0].name}{items.length > 1 ? ` & ${items.length - 1} more` : ''}</p>
                    )}
                    <span className={`sm:hidden inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${meta.badge}`}>{meta.label}</span>
                  </div>
                  <span className={`hidden sm:inline-block shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium ${meta.badge}`}>{meta.label}</span>
                  <span className="shrink-0 text-[15px] md:text-[16px] tabular-nums">{formatAED(orderTotal(o))}</span>
                  <ChevronRight size={18} className="shrink-0 text-gray-400 group-hover:text-[#111114]" />
                </Link>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 pl-[calc(56px+16px)] md:pl-[calc(72px+16px)]">
                  <button type="button" onClick={(e) => handleBuyAgain(e, o)} className={justAdded ? 'text-[13px] text-[#22a35a]' : TEXT_LINK}>
                    {justAdded ? 'Added to bag' : 'Buy again'}
                  </button>
                  {track && <a href={track} target="_blank" rel="noopener noreferrer" className={TEXT_LINK}>Track order</a>}
                  <a href={`/api/orders/${o.id}/invoice`} target="_blank" rel="noopener noreferrer" className={TEXT_LINK}>Invoice</a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AccountPage>
  );
}
