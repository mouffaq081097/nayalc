'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Sparkles, Package, Heart, Star } from 'lucide-react';
import { AccountMobileTopBar } from '../_components/AccountMobileTopBar';
import { useAccountData } from '../_components/useAccountData';
import { setAccountNavDirection } from '../_components/navDirection';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/account/dashboard', Icon: Sparkles },
  { id: 'profile',   label: 'Profile',   href: '/account/profile',   Icon: User    },
  { id: 'orders',    label: 'Orders',    href: '/account/orders',    Icon: Package },
  { id: 'wishlist',  label: 'Wishlist',  href: '/account/wishlist',  Icon: Heart   },
  { id: 'loyalty',   label: 'Loyalty',   href: '/account/loyalty',   Icon: Star    },
];

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '10px',
  border: '1px solid rgba(216,180,254,0.4)',
  background: 'rgba(255,255,255,0.85)',
  color: '#3b0764',
  fontSize: '14px',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontSize: '9.5px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'rgb(147,104,236)',
  marginBottom: '5px',
};

const groupLabelStyle = {
  fontSize: 10,
  fontWeight: 700,
  color: 'rgb(147,104,236)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  borderBottom: '1px solid rgba(216,180,254,0.3)',
  paddingBottom: 6,
  marginBottom: 12,
};

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { fetchWithAuth } = useAppContext();
  const { orders, loyaltyData } = useAccountData();

  const [form, setForm] = useState({ first_name: '', last_name: '', phone_number: '' });
  const [fetched, setFetched] = useState({ first_name: '', last_name: '', phone_number: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    fetchWithAuth(`/api/users/${user.id}/profile`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const vals = {
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone_number: data.phone_number || '',
        };
        setForm(vals);
        setFetched(vals);
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id, fetchWithAuth]);

  const handleChange = field => e => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setSaved(false);
  };

  const handleDiscard = () => {
    setForm(fetched);
    setError(null);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First name and last name are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setFetched({ ...form });
      setSaved(true);
    } catch {
      setError('Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = (user?.first_name?.[0] || '?').toUpperCase();
  const tier = loyaltyData?.stats?.tier || 'Silver';
  const points = loyaltyData?.stats?.points ?? 0;
  const orderCount = orders?.length ?? 0;

  return (
    <>
      {/* Mobile sticky top bar */}
      <AccountMobileTopBar title="My Profile" />

      {/* Mobile identity bar — hidden on md+ */}
      <div className="md:hidden" style={{
        background: 'rgba(255,255,255,0.95)',
        borderBottom: '1px solid rgba(216,180,254,0.25)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 900, color: '#fff',
          boxShadow: '0 4px 14px rgba(147,104,236,0.35)',
          border: '2px solid rgba(255,255,255,1)',
          flexShrink: 0,
        }}>{initials}</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#3b0764' }}>
            {user?.first_name} {user?.last_name}
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgb(147,104,236)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
            ✦ {tier} Member
          </div>
          <div style={{ fontSize: 11, color: 'rgba(59,7,100,0.45)', marginTop: 1, fontWeight: 600 }}>
            {points.toLocaleString()} loyalty points
          </div>
        </div>
      </div>

      {/* Page body */}
      <div className="flex" style={{ minHeight: '100vh', background: 'var(--cl-bg)' }}>

        {/* ── Left panel — desktop only ── */}
        <div className="hidden md:flex" style={{
          width: 260,
          flexShrink: 0,
          background: 'rgba(255,255,255,0.95)',
          borderRight: '1px solid rgba(216,180,254,0.25)',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 24px 32px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}>
          {/* Avatar */}
          <div style={{
            width: 84, height: 84, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 900, color: '#fff',
            boxShadow: '0 8px 28px rgba(147,104,236,0.35)',
            border: '3px solid rgba(255,255,255,1)',
          }}>{initials}</div>

          {/* Name + email */}
          <div style={{ fontSize: 17, fontWeight: 800, color: '#3b0764', marginTop: 14, letterSpacing: '-0.3px', textAlign: 'center' }}>
            {user?.first_name} {user?.last_name}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(59,7,100,0.45)', marginTop: 3, textAlign: 'center' }}>
            {user?.email}
          </div>

          {/* Tier badge */}
          <div style={{
            marginTop: 12,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'linear-gradient(135deg, rgba(196,167,254,0.18), rgba(249,168,212,0.12))',
            border: '1px solid rgba(216,180,254,0.4)',
            borderRadius: 50, padding: '4px 12px',
          }}>
            <Star size={10} style={{ color: 'rgb(126,105,230)' }} strokeWidth={2.5} />
            <span style={{ fontSize: 9.5, fontWeight: 800, color: 'rgb(126,105,230)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {tier} Member
            </span>
          </div>

          {/* Divider */}
          <div style={{ width: 40, height: 1.5, background: 'linear-gradient(90deg, rgb(196,167,254), rgb(249,168,212))', borderRadius: 2, margin: '20px 0' }} />

          {/* Stats */}
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'rgb(126,105,230)', lineHeight: 1 }}>
                {points.toLocaleString()}
              </div>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: 'rgb(147,104,236)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>Points</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'rgb(126,105,230)', lineHeight: 1 }}>
                {orderCount}
              </div>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: 'rgb(147,104,236)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>Orders</div>
            </div>
          </div>

          {/* Brand quote */}
          <div style={{ fontSize: 11, color: 'rgba(59,7,100,0.45)', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.6, marginTop: 20, padding: '0 4px' }}>
            "Luxury is in each detail."
          </div>

          {/* Mini nav */}
          <div style={{ width: '100%', marginTop: 28, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV_ITEMS.map(({ id, label, href, Icon }) => {
              const isActive = id === 'profile';
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setAccountNavDirection(1); router.push(href); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 10, width: '100%',
                    background: isActive ? 'rgba(196,167,254,0.15)' : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    color: isActive ? 'rgb(126,105,230)' : 'rgba(59,7,100,0.5)',
                    fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                  }}
                >
                  <Icon size={15} strokeWidth={1.75} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right panel (form) ── */}
        <div className="px-4 py-8 md:px-10 md:py-10" style={{ flex: 1, background: 'var(--cl-bg)', overflowY: 'auto' }}>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 20, height: 1.5, background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))', borderRadius: 2 }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: 'rgb(126,105,230)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>My Profile</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#3b0764', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              Personal details
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(59,7,100,0.45)', marginTop: 4 }}>
              Update your name and contact information.
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
              <div className="animate-spin" style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(196,167,254,0.3)', borderTopColor: 'rgb(147,104,236)' }} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ maxWidth: 560 }}>

              {/* Personal info group */}
              <div style={{ marginBottom: 20 }}>
                <div style={groupLabelStyle}>Personal info</div>
                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 10 }}>
                  <div>
                    <label style={labelStyle}>First name</label>
                    <input
                      type="text"
                      value={form.first_name}
                      onChange={handleChange('first_name')}
                      placeholder="First name"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Last name</label>
                    <input
                      type="text"
                      value={form.last_name}
                      onChange={handleChange('last_name')}
                      placeholder="Last name"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Contact group */}
              <div style={{ marginBottom: 28 }}>
                <div style={groupLabelStyle}>Contact</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Email address</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      readOnly
                      style={{ ...inputStyle, opacity: 0.55, cursor: 'not-allowed' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone number</label>
                    <input
                      type="tel"
                      value={form.phone_number}
                      onChange={handleChange('phone_number')}
                      placeholder="+971 50 000 0000"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(239,68,68,0.85)', marginBottom: 16 }}>
                  {error}
                </p>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="font-black uppercase tracking-widest"
                  style={{
                    background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))',
                    color: '#fff', fontSize: 11, border: 'none',
                    borderRadius: 50, padding: '11px 28px', cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(147,104,236,0.3)',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="font-bold"
                  style={{
                    background: 'transparent',
                    border: '1.5px solid rgba(216,180,254,0.5)',
                    color: 'rgb(126,105,230)', fontSize: 11,
                    borderRadius: 50, padding: '10px 20px', cursor: 'pointer',
                  }}
                >
                  Discard
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
