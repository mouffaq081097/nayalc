'use client';

import React from 'react';
import { AccountMobileTopBar } from '../_components/AccountMobileTopBar';
import { useAccountData } from '../_components/useAccountData';
import { AccountSectionTitle } from '../_components/AccountSectionTitle';
import { Button } from '../../components/ui/button';
import { useRouter } from 'next/navigation';

export default function AccountDashboardPage() {
  const router = useRouter();
  const { user, orders, wishlistItems, addresses, loyaltyData } = useAccountData();

  return (
    <>
      <AccountMobileTopBar title="Dashboard" />
      <div className="px-4 pb-28 pt-6 md:px-6 md:pt-12 md:pb-32">
        <div className="mx-auto max-w-2xl md:max-w-[1400px]">
          <AccountSectionTitle
            eyebrow="Account"
            title={`Welcome, ${user?.first_name || 'User'}.`}
            subtitle="Your quick overview."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-[var(--radius-card)] border border-black/[0.06] bg-white/85 p-6 shadow-sm backdrop-blur-xl">
              <p className="app-mobile-label">Orders</p>
              <p className="mt-2 text-3xl font-black tabular-nums text-[#1d1d1f]">
                {orders.length}
              </p>
              <Button
                type="button"
                variant="pillSecondary"
                size="pill"
                onClick={() => router.push('/account/orders')}
                className="mt-4 w-full"
              >
                View orders
              </Button>
            </div>

            <div className="rounded-[var(--radius-card)] border border-black/[0.06] bg-white/85 p-6 shadow-sm backdrop-blur-xl">
              <p className="app-mobile-label">Wishlist</p>
              <p className="mt-2 text-3xl font-black tabular-nums text-[#1d1d1f]">
                {wishlistItems.length}
              </p>
              <Button
                type="button"
                variant="pillSecondary"
                size="pill"
                onClick={() => router.push('/account/wishlist')}
                className="mt-4 w-full"
              >
                View wishlist
              </Button>
            </div>

            <div className="rounded-[var(--radius-card)] border border-black/[0.06] bg-white/85 p-6 shadow-sm backdrop-blur-xl">
              <p className="app-mobile-label">Addresses</p>
              <p className="mt-2 text-3xl font-black tabular-nums text-[#1d1d1f]">
                {addresses.length}
              </p>
              <Button
                type="button"
                variant="pillSecondary"
                size="pill"
                onClick={() => router.push('/account/addresses')}
                className="mt-4 w-full"
              >
                Manage addresses
              </Button>
            </div>

            <div className="rounded-[var(--radius-card)] border border-black/[0.06] bg-gray-900 p-6 text-white shadow-sm">
              <p className="app-mobile-label text-white/60">Loyalty</p>
              <p className="mt-2 text-3xl font-black tabular-nums">
                {Number(loyaltyData?.stats?.points || 0).toLocaleString()}
              </p>
              <Button
                type="button"
                variant="pillPrimary"
                size="pill"
                onClick={() => router.push('/account/loyalty')}
                className="mt-4 w-full bg-white text-[#1d1d1f] hover:bg-brand-pink hover:text-white"
              >
                View loyalty
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

