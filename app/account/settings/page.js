'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AccountShell from '../_components/AccountShell';
import { useAccountData } from '../_components/useAccountData';
import { useAuth } from '../../context/AuthContext';

const NOTIFICATION_SETTINGS = [
  { key: 'order_updates',  label: 'Order Updates',         desc: 'SMS & email for shipping updates',   defaultOn: true  },
  { key: 'promotions',     label: 'Promotions',            desc: 'New launches & exclusive offers',    defaultOn: true  },
  { key: 'loyalty_alerts', label: 'Loyalty Alerts',        desc: 'Points earned, tier changes',        defaultOn: true  },
  { key: 'restock_alerts', label: 'Restock Alerts',        desc: 'Wishlist item back in stock',        defaultOn: false },
];

const PRIVACY_SETTINGS = [
  { key: 'personalised',   label: 'Personalised Recommendations', desc: 'Based on purchase history',       defaultOn: true  },
  { key: 'analytics',      label: 'Analytics',                    desc: 'Help us improve your experience', defaultOn: false },
];

function Toggle({ on, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!on)}
      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 focus:outline-none ${on ? 'bg-purple-500' : 'bg-gray-200'}`}>
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}

function VercelCard({ title, children }) {
  return (
    <div className="w-full bg-white border border-[#eaeaea] rounded-lg overflow-hidden mb-5">
      <div className="px-6 py-4 border-b border-[#eaeaea]">
        <h2 className="text-[14px] font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="divide-y divide-[#eaeaea]">
        {children}
      </div>
    </div>
  );
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { wishlistItems } = useAccountData();
  const wishCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0;

  const [notifications, setNotifications] = useState({});
  const [privacy,        setPrivacy]       = useState({});

  return (
    <AccountShell wishCount={wishCount}>

      {/* Notifications */}
      <VercelCard title="Notifications">
        {NOTIFICATION_SETTINGS.map(item => (
          <div key={item.key} className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-[13px] font-medium text-gray-900">{item.label}</p>
              <p className="text-[12px] text-gray-400 mt-0.5">{item.desc}</p>
            </div>
            <Toggle
              on={notifications[item.key] ?? item.defaultOn}
              onChange={v => setNotifications(p => ({ ...p, [item.key]: v }))}
            />
          </div>
        ))}
      </VercelCard>

      {/* Privacy */}
      <VercelCard title="Privacy">
        {PRIVACY_SETTINGS.map(item => (
          <div key={item.key} className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-[13px] font-medium text-gray-900">{item.label}</p>
              <p className="text-[12px] text-gray-400 mt-0.5">{item.desc}</p>
            </div>
            <Toggle
              on={privacy[item.key] ?? item.defaultOn}
              onChange={v => setPrivacy(p => ({ ...p, [item.key]: v }))}
            />
          </div>
        ))}
      </VercelCard>

      {/* Account actions */}
      <VercelCard title="Account">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-gray-900">Change Password</p>
            <p className="text-[12px] text-gray-400 mt-0.5">Update your account password</p>
          </div>
          <button onClick={() => router.push('/auth/reset-password')}
            className="h-8 px-4 text-[12px] font-medium text-gray-700 bg-white border border-[#eaeaea] rounded-md hover:bg-gray-50 transition-colors">
            Change
          </button>
        </div>
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-gray-900">Sign Out</p>
            <p className="text-[12px] text-gray-400 mt-0.5">Sign out of your account on this device</p>
          </div>
          <button onClick={() => { logout(); router.push('/'); }}
            className="h-8 px-4 text-[12px] font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-colors">
            Sign Out
          </button>
        </div>
        <div className="px-6 py-4 flex items-center justify-between bg-red-50/40">
          <div>
            <p className="text-[13px] font-medium text-red-600">Delete Account</p>
            <p className="text-[12px] text-red-400 mt-0.5">Permanently delete your account and all data</p>
          </div>
          <button className="h-8 px-4 text-[12px] font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors">
            Delete
          </button>
        </div>
      </VercelCard>

    </AccountShell>
  );
}
