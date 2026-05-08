'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { useAccountData } from '../_components/useAccountData';
import AccountShell from '../_components/AccountShell';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';

/* ── Vercel-style section card ──────────────────────────────────────────── */
function SectionCard({ title, description, children, footer }) {
  return (
    <div className="w-full bg-white border border-[#eaeaea] rounded-lg overflow-hidden mb-5">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-[#eaeaea]">
        <h2 className="text-[15px] font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">{description}</p>}
      </div>
      {/* Body */}
      {children && (
        <div className="px-6 py-5">
          {children}
        </div>
      )}
      {/* Footer */}
      {footer && (
        <div className="px-6 py-3 bg-[#fafafa] border-t border-[#eaeaea] flex items-center justify-between gap-4">
          {footer}
        </div>
      )}
    </div>
  );
}

function SaveBtn({ onClick, saving, saved, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving || disabled}
      className="h-8 px-4 rounded-md text-[12px] font-semibold text-white transition-all disabled:opacity-40"
      style={{ background: saving || saved ? '#555' : '#000' }}
    >
      {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
    </button>
  );
}

export default function ProfilePage() {
  const { user }          = useAuth();
  const { fetchWithAuth } = useAppContext();
  const { wishlistItems } = useAccountData();
  const { update }        = useSession();
  const fileRef           = useRef(null);
  const wishCount         = Array.isArray(wishlistItems) ? wishlistItems.length : 0;

  const [profile,   setProfile]   = useState(null);
  const [uploading, setUploading] = useState(false);

  // Per-field save state
  const [name,    setName]    = useState({ first: '', last: '', saving: false, saved: false });
  const [phone,   setPhone]   = useState({ value: '', saving: false, saved: false });

  const initials  = [user?.first_name?.[0], user?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || 'NL';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'January 2025';

  useEffect(() => {
    if (!user?.id) return;
    fetchWithAuth(`/api/users/${user.id}/profile`)
      .then(r => r.json())
      .then(data => {
        setProfile(data);
        setName(n => ({ ...n, first: data.first_name || '', last: data.last_name || '' }));
        setPhone(p => ({ ...p, value: data.phone_number || '' }));
      })
      .catch(() => {});
  }, [user?.id, fetchWithAuth]);

  const saveName = async () => {
    if (!name.first.trim()) { toast.error('First name is required.'); return; }
    setName(n => ({ ...n, saving: true }));
    try {
      const res = await fetchWithAuth(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        body: JSON.stringify({ first_name: name.first, last_name: name.last, phone_number: phone.value }),
      });
      if (!res.ok) throw new Error();
      await update({ first_name: name.first, last_name: name.last });
      setProfile(p => ({ ...p, first_name: name.first, last_name: name.last }));
      setName(n => ({ ...n, saving: false, saved: true }));
      setTimeout(() => setName(n => ({ ...n, saved: false })), 2000);
      toast.success('Name updated!');
    } catch { toast.error('Could not save.'); setName(n => ({ ...n, saving: false })); }
  };

  const savePhone = async () => {
    setPhone(p => ({ ...p, saving: true }));
    try {
      await fetchWithAuth(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        body: JSON.stringify({ first_name: profile?.first_name || '', last_name: profile?.last_name || '', phone_number: phone.value }),
      });
      setProfile(p => ({ ...p, phone_number: phone.value }));
      setPhone(p => ({ ...p, saving: false, saved: true }));
      setTimeout(() => setPhone(p => ({ ...p, saved: false })), 2000);
      toast.success('Phone updated!');
    } catch { toast.error('Could not save.'); setPhone(p => ({ ...p, saving: false })); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image.'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB.'); return; }
    setUploading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await fetchWithAuth(`/api/users/${user.id}/profile-image`, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      await update({ profile_image: data.imageUrl });
      toast.success('Avatar updated!');
    } catch { toast.error('Upload failed.'); }
    finally { setUploading(false); }
  };

  return (
    <AccountShell wishCount={wishCount}>

      {/* Avatar */}
      <SectionCard
        title="Avatar"
        description="This is your avatar. Click on the avatar to upload a custom one from your files."
        footer={
          <p className="text-[12px] text-gray-400">An avatar is optional but strongly recommended.</p>
        }
      >
        <div className="flex items-center justify-between">
          <div className="text-[13px] text-gray-500">
            <p className="font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">Member since {memberSince}</p>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="relative w-16 h-16 rounded-full overflow-hidden group shrink-0 shadow-sm ring-2 ring-gray-100 hover:ring-purple-200 transition-all"
          >
            <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold"
              style={{ background: 'linear-gradient(135deg,#c087fc,#9869f7)' }}>
              {user?.profile_image
                ? <Image src={user.profile_image} alt={initials} fill className="object-cover" />
                : initials}
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Camera size={14} className="text-white" />}
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>
      </SectionCard>

      {/* Full Name */}
      <SectionCard
        title="Full Name"
        description="Please enter your full name, or a display name you are comfortable with."
        footer={
          <>
            <p className="text-[12px] text-gray-400">Please use 48 characters at maximum.</p>
            <SaveBtn onClick={saveName} saving={name.saving} saved={name.saved} />
          </>
        }
      >
        <div className="flex gap-3">
          <input
            type="text"
            value={name.first}
            onChange={e => setName(n => ({ ...n, first: e.target.value, saved: false }))}
            placeholder="First name"
            className="flex-1 h-9 px-3 text-[13px] text-gray-900 bg-white border border-[#eaeaea] rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 placeholder:text-gray-300"
          />
          <input
            type="text"
            value={name.last}
            onChange={e => setName(n => ({ ...n, last: e.target.value, saved: false }))}
            placeholder="Last name"
            className="flex-1 h-9 px-3 text-[13px] text-gray-900 bg-white border border-[#eaeaea] rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 placeholder:text-gray-300"
          />
        </div>
      </SectionCard>

      {/* Email */}
      <SectionCard
        title="Email Address"
        description="Your email address is used to sign in and receive order updates."
        footer={<p className="text-[12px] text-gray-400">Email cannot be changed. Contact support if needed.</p>}
      >
        <input
          type="email"
          value={user?.email || ''}
          readOnly
          className="w-full h-9 px-3 text-[13px] text-gray-400 bg-[#fafafa] border border-[#eaeaea] rounded-md cursor-not-allowed"
        />
      </SectionCard>

      {/* Phone */}
      <SectionCard
        title="Phone Number"
        description="Your phone number may be used for delivery updates and account security."
        footer={
          <>
            <p className="text-[12px] text-gray-400">Include country code, e.g. +971 50 000 0000</p>
            <SaveBtn onClick={savePhone} saving={phone.saving} saved={phone.saved} />
          </>
        }
      >
        <input
          type="tel"
          value={phone.value}
          onChange={e => setPhone(p => ({ ...p, value: e.target.value, saved: false }))}
          placeholder="+971 50 000 0000"
          className="w-72 h-9 px-3 text-[13px] text-gray-900 bg-white border border-[#eaeaea] rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 placeholder:text-gray-300"
        />
      </SectionCard>

      {/* Skin Profile */}
      <SectionCard
        title="Skin Profile"
        description="Your skin concerns help us personalise product recommendations for you."
        footer={<p className="text-[12px] text-gray-400">Update your skin quiz anytime to refresh recommendations.</p>}
      >
        <div className="flex flex-wrap gap-2">
          {(profile?.skin_concerns?.length > 0
            ? profile.skin_concerns
            : ['Combination', 'Sensitive', 'Anti-Aging', 'Hydration', 'Brightening']
          ).map(tag => (
            <span key={tag} className="px-3 py-1 text-[12px] font-medium rounded-full border border-[#eaeaea] bg-[#fafafa] text-gray-600">
              {tag}
            </span>
          ))}
        </div>
      </SectionCard>

    </AccountShell>
  );
}
