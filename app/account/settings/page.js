'use client';

import React from 'react';
import { AccountMobileTopBar } from '../_components/AccountMobileTopBar';
import { AccountSectionTitle } from '../_components/AccountSectionTitle';
import { Bell, ShieldCheck, ChevronRight } from 'lucide-react';

export default function AccountSettingsPage() {
  return (
    <>
      <AccountMobileTopBar title="Settings" />
      <div className="px-4 pb-28 pt-6 md:px-6 md:pt-12 md:pb-32">
        <div className="mx-auto max-w-2xl md:max-w-[1400px]">
          <AccountSectionTitle
            eyebrow="Account"
            title="Settings"
            subtitle="Personal calibration and privacy preferences."
          />

          <div className="overflow-hidden rounded-[var(--radius-card)] border border-black/[0.06] bg-white/90 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-[#1d1d1f]">
                  <Bell size={18} />
                </span>
                <div>
                  <p className="text-[15px] font-semibold tracking-tight text-[#1d1d1f]">
                    Notifications
                  </p>
                  <p className="text-sm text-neutral-600">
                    Shipment alerts and updates
                  </p>
                </div>
              </div>
              <div className="h-8 w-14 rounded-full bg-black/[0.06] p-1">
                <div className="h-6 w-6 rounded-full bg-white shadow-sm" />
              </div>
            </div>

            <div className="h-px w-full bg-black/[0.06]" />

            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-black/[0.02] active:bg-black/[0.04]"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-[#1d1d1f]">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <p className="text-[15px] font-semibold tracking-tight text-[#1d1d1f]">
                    Privacy
                  </p>
                  <p className="text-sm text-neutral-600">Data & security</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-black/30" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

