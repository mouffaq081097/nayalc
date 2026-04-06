'use client';

import React from 'react';
import { AccountMobileTopBar } from '../_components/AccountMobileTopBar';
import { useAccountData } from '../_components/useAccountData';
import { AccountSectionTitle } from '../_components/AccountSectionTitle';
import { MapPin } from 'lucide-react';

export default function AccountAddressesPage() {
  const { addresses } = useAccountData();

  return (
    <>
      <AccountMobileTopBar title="Addresses" />
      <div className="px-4 pb-28 pt-6 md:px-6 md:pt-12 md:pb-32">
        <div className="mx-auto max-w-2xl md:max-w-[1400px]">
          <AccountSectionTitle
            eyebrow="Account"
            title="Addresses"
            subtitle="Delivery coordinates for your future orders."
          />

          {addresses.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-black/[0.06] bg-white/80 p-10 text-center shadow-sm backdrop-blur-xl">
              <MapPin size={40} strokeWidth={1.25} className="mx-auto text-black/20" />
              <p className="mt-4 text-sm font-semibold text-[#1d1d1f]">No addresses yet.</p>
              <p className="mt-2 text-sm text-neutral-600">
                Add an address during checkout and it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr, index) => (
                <div
                  key={addr.id || `addr-${index}`}
                  className="rounded-[var(--radius-card)] border border-black/[0.06] bg-white/85 p-5 shadow-sm backdrop-blur-xl"
                >
                  <p className="text-[13px] font-semibold text-[#1d1d1f]">
                    {addr.addressLabel || 'Address'}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {[addr.addressLine1, addr.addressLine2, addr.city, addr.country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

