'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccountMobileTopBar } from '../_components/AccountMobileTopBar';
import { AccountSectionTitle } from '../_components/AccountSectionTitle';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { User, Phone, Mail, CheckCircle } from 'lucide-react';

const glass = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(216,180,254,0.35)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 2px 16px rgba(147,51,234,0.06)',
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '14px',
  border: '1px solid rgba(216,180,254,0.45)',
  background: 'rgba(248,240,255,0.5)',
  color: '#3b0764',
  fontSize: '14px',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'rgb(147,51,234)',
  marginBottom: '6px',
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { fetchWithAuth } = useAppContext();
  const router = useRouter();

  const [form, setForm] = useState({ first_name: '', last_name: '', phone_number: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchWithAuth(`/api/users/${user.id}/profile`)
      .then(r => r.json())
      .then(data => {
        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone_number: data.phone_number || '',
        });
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setSaved(false);
  };

  const handleSubmit = async (e) => {
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
      if (!res.ok) throw new Error('Failed to save');
      setSaved(true);
    } catch {
      setError('Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AccountMobileTopBar title="My Profile" />
      <div className="px-4 pb-28 pt-6">
        <div className="mx-auto max-w-2xl">
          <AccountSectionTitle
            eyebrow="Account"
            title="My Profile"
            subtitle="Update your name and contact number."
          />

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(196,167,254,0.3)', borderTopColor: 'rgb(147,104,236)' }} />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="rounded-3xl overflow-hidden mb-4" style={glass}>
                <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(216,180,254,0.25)' }}>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: 'rgb(147,51,234)' }}>
                    Personal details
                  </p>
                </div>
                <div className="p-6 space-y-5">
                  {/* Name row */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label style={labelStyle}>First name</label>
                      <div className="relative">
                        <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgb(147,104,236)' }} />
                        <input
                          type="text"
                          value={form.first_name}
                          onChange={handleChange('first_name')}
                          placeholder="First name"
                          style={{ ...inputStyle, paddingLeft: '34px' }}
                        />
                      </div>
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

                  {/* Email (read-only) */}
                  <div>
                    <label style={labelStyle}>Email</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(147,104,236,0.5)' }} />
                      <input
                        type="email"
                        value={user?.email || ''}
                        readOnly
                        style={{ ...inputStyle, paddingLeft: '34px', opacity: 0.6, cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label style={labelStyle}>Phone number</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgb(147,104,236)' }} />
                      <input
                        type="tel"
                        value={form.phone_number}
                        onChange={handleChange('phone_number')}
                        placeholder="+971 50 000 0000"
                        style={{ ...inputStyle, paddingLeft: '34px' }}
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-[12px] font-medium" style={{ color: 'rgba(239,68,68,0.85)' }}>{error}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-full text-[12px] font-black uppercase tracking-widest text-white transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))', boxShadow: '0 4px 20px rgba(147,51,234,0.25)' }}
              >
                {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
