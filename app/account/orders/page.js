'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Search, X } from 'lucide-react';
import AccountShell from '../_components/AccountShell';
import { useAccountData } from '../_components/useAccountData';

function statusStyle(status) {
  switch ((status || '').toLowerCase()) {
    case 'delivered':  return 'bg-green-50 text-green-700';
    case 'shipped':    return 'bg-blue-50 text-blue-600';
    case 'processing': return 'bg-amber-50 text-amber-600';
    case 'cancelled':  return 'bg-red-50 text-red-500';
    default:           return 'bg-gray-100 text-gray-500';
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AccountOrdersPage() {
  const { orders, wishlistItems, isLoading } = useAccountData();
  const wishCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0;
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return orders;
    const q = query.toLowerCase();
    return orders.filter(o =>
      String(o.id).includes(q) ||
      (o.status || '').toLowerCase().includes(q) ||
      (o.items || []).some(i => (i.name || '').toLowerCase().includes(q))
    );
  }, [orders, query]);

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

      {/* Order list */}
      <div className="space-y-3 w-full">
        {isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            {query ? 'No orders match your search.' : 'No orders yet.'}
          </div>
        ) : (
          filtered.map((o) => {
            const items   = o.items || [];
            const total   = Number(o.totalAmount || o.total_amount || o.total || 0);
            const date    = formatDate(o.createdAt || o.created_at);
            // Up to 3 product images to preview
            const previews = items.slice(0, 3);
            const extra   = items.length - previews.length;

            return (
              <Link
                key={o.id}
                href={`/account/orders/${o.id}`}
                className="flex items-center gap-4 p-4 bg-white rounded-lg border border-[#eaeaea] hover:border-gray-300 transition-colors group"
              >
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
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusStyle(o.status)}`}>
                      {o.status}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    {date}{items.length > 0 ? ` · ${items.length} item${items.length > 1 ? 's' : ''}` : ''}
                  </p>
                  {/* First product name as hint */}
                  {items[0]?.name && (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{items[0].name}{items.length > 1 ? ` & ${items.length - 1} more` : ''}</p>
                  )}
                </div>

                {/* Amount + CTA */}
                <div className="text-right shrink-0">
                  <div className="text-[15px] font-bold text-gray-900">AED {total.toFixed(0)}</div>
                  <span className="text-[11px] text-purple-600 font-medium group-hover:underline">View Details →</span>
                </div>
              </Link>
            );
          })
        )}
      </div>
      </div>
    </AccountShell>
  );
}
