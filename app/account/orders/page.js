'use client';

import React from 'react';
import { AccountMobileTopBar } from '../_components/AccountMobileTopBar';
import { useAccountData } from '../_components/useAccountData';
import { AccountSectionTitle } from '../_components/AccountSectionTitle';
import { Package } from 'lucide-react';

export default function AccountOrdersPage() {
  const { orders } = useAccountData();

  return (
    <>
      <AccountMobileTopBar title="Orders" />
      <div className="px-4 pb-28 pt-6 md:px-6 md:pt-12 md:pb-32">
        <div className="mx-auto max-w-2xl md:max-w-[1400px]">
          <AccountSectionTitle
            eyebrow="Account"
            title="Orders"
            subtitle="Your recent acquisitions and order history."
          />

          {orders.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-black/[0.06] bg-white/80 p-10 text-center shadow-sm backdrop-blur-xl">
              <Package size={40} strokeWidth={1.25} className="mx-auto text-black/20" />
              <p className="mt-4 text-sm font-semibold text-[#1d1d1f]">No orders yet.</p>
              <p className="mt-2 text-sm text-neutral-600">
                When you place an order, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order, index) => (
                <div
                  key={order.id || `order-${index}`}
                  className="rounded-[var(--radius-card)] border border-black/[0.06] bg-white/85 p-5 shadow-sm backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-semibold text-[#1d1d1f]">
                        Order #{order.id}
                      </p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-black/40">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-semibold text-[#1d1d1f]">
                        AED {Number(order.totalAmount || 0).toFixed(2)}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-pink">
                        {String(order.status || 'Processing')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

