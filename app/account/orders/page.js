'use client';

import React from 'react';
import Link from 'next/link';
import { AccountMobileTopBar } from '../_components/AccountMobileTopBar';
import { useAccountData } from '../_components/useAccountData';
import { AccountSectionTitle } from '../_components/AccountSectionTitle';
import { Package, ArrowRight } from 'lucide-react';

const glass = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(216,180,254,0.35)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 2px 16px rgba(147,51,234,0.06)',
};

export default function AccountOrdersPage() {
  const { orders } = useAccountData();

  return (
    <>
      <AccountMobileTopBar title="Orders" />
      <div className="px-4 pb-28 pt-6">
        <div className="mx-auto max-w-2xl">
          <AccountSectionTitle
            eyebrow="Account"
            title="Orders"
            subtitle="Your recent acquisitions and order history."
          />

          {orders.length === 0 ? (
            <div className="rounded-3xl p-10 text-center" style={{ ...glass, border: '1.5px dashed rgba(216,180,254,0.5)' }}>
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(196,167,254,0.18)' }}>
                <Package size={24} strokeWidth={1.5} style={{ color: 'rgba(147,51,234,0.4)' }} />
              </div>
              <p className="text-base font-bold mb-1" style={{ color: '#3b0764' }}>No orders yet</p>
              <p className="text-sm" style={{ color: 'rgba(59,7,100,0.45)' }}>
                When you place an order, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order, index) => (
                <Link
                  key={order.id || `order-${index}`}
                  href={`/account/orders/${order.id}`}
                  className="block rounded-2xl p-5 transition-all active:scale-[0.99] hover:-translate-y-0.5"
                  style={glass}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(196,167,254,0.18)' }}>
                        <Package size={18} strokeWidth={1.5} style={{ color: 'rgb(126,105,230)' }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold leading-none mb-1" style={{ color: '#3b0764' }}>
                          Order #{order.id}
                        </p>
                        <p className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: 'rgba(59,7,100,0.40)' }}>
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-[13px] font-bold mb-0.5" style={{ color: '#3b0764' }}>
                          AED {Number(order.totalAmount || 0).toFixed(2)}
                        </p>
                        <p className="text-[9px] font-black uppercase tracking-[0.1em]" style={{ color: 'rgb(126,105,230)' }}>
                          {String(order.status || 'Processing')}
                        </p>
                      </div>
                      <ArrowRight size={14} style={{ color: 'rgba(196,167,254,0.7)' }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
