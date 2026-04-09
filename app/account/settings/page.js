'use client';

import React from 'react';
import { AccountMobileTopBar } from '../_components/AccountMobileTopBar';
import { AccountSectionTitle } from '../_components/AccountSectionTitle';
import { Bell, ShieldCheck, Lock, CreditCard, ChevronRight } from 'lucide-react';

const glass = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(216,180,254,0.35)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 2px 16px rgba(147,51,234,0.06)',
};

const items = [
  { label: 'Notifications',    desc: 'Shipment alerts and updates',     Icon: Bell        },
  { label: 'Privacy',          desc: 'Data & security preferences',     Icon: ShieldCheck },
  { label: 'Change Password',  desc: 'Update your access credentials',  Icon: Lock        },
  { label: 'Payment Methods',  desc: 'Manage saved payment options',    Icon: CreditCard  },
];

export default function AccountSettingsPage() {
  return (
    <>
      <AccountMobileTopBar title="Settings" />
      <div className="px-4 pb-28 pt-6">
        <div className="mx-auto max-w-2xl">
          <AccountSectionTitle
            eyebrow="Account"
            title="Settings"
            subtitle="Preferences and privacy controls."
          />

          <div className="overflow-hidden rounded-3xl" style={glass}>
            {items.map((item, i) => (
              <React.Fragment key={item.label}>
                {i > 0 && <div style={{ height: 1, background: 'rgba(216,180,254,0.25)', marginLeft: 72 }} />}
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-all active:bg-purple-50/50"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ background: 'rgba(196,167,254,0.18)', color: 'rgb(126,105,230)' }}>
                      <item.Icon size={17} strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="text-[14px] font-semibold tracking-tight" style={{ color: '#3b0764' }}>{item.label}</p>
                      <p className="text-[12px]" style={{ color: 'rgba(59,7,100,0.45)' }}>{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={15} style={{ color: 'rgba(147,51,234,0.4)', flexShrink: 0 }} />
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
