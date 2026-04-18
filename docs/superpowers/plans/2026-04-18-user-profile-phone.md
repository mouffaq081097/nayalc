# User Profile Page with Phone Number Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Profile page under `/account/profile` where users can view and update their first name, last name, and phone number, stored on `users.phone_number`.

**Architecture:** New API route `/api/users/[userId]/profile` reads/writes directly to the `users` table (not `user_addresses`), making phone a canonical user-level field. The profile page fetches `phone_number` from this endpoint using `fetchWithAuth` from `useAppContext()` and reads name/email from `useAuth()`. No changes to UserContext are required.

**Tech Stack:** Next.js 15 App Router, raw SQL (Vercel Postgres), Cloud Luxe design system, `useAuth()` + `useAppContext()` hooks.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `app/api/users/[userId]/profile/route.js` | GET + PUT `users.phone_number`, `first_name`, `last_name` |
| Create | `app/account/profile/page.js` | Profile form UI — name fields + phone input |
| Modify | `app/account/_components/AccountMenuList.js` | Add "Profile" nav entry with `User` icon |

---

## Task 1: Profile API route

**Files:**
- Create: `app/api/users/[userId]/profile/route.js`

- [ ] **Step 1: Create the route file**

```js
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
  const { userId } = await params;
  try {
    const { rows } = await db.query(
      `SELECT first_name, last_name, email, phone_number FROM users WHERE id = $1`,
      [userId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { userId } = await params;
  const { first_name, last_name, phone_number } = await request.json();

  if (!first_name?.trim() || !last_name?.trim()) {
    return NextResponse.json({ message: 'First name and last name are required' }, { status: 400 });
  }

  try {
    await db.query(
      `UPDATE users SET first_name = $1, last_name = $2, phone_number = $3 WHERE id = $4`,
      [first_name.trim(), last_name.trim(), phone_number?.trim() || null, userId]
    );
    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Smoke-test the endpoint**

Start the dev server (`npm run dev`) and open a browser console. While logged in, run:
```js
fetch('/api/users/<your-user-id>/profile').then(r=>r.json()).then(console.log)
```
Expected: `{ first_name, last_name, email, phone_number }` object with no 500 error.

- [ ] **Step 3: Commit**

```bash
git add app/api/users/[userId]/profile/route.js
git commit -m "feat: add profile API route to read/write users.phone_number"
```

---

## Task 2: Profile page

**Files:**
- Create: `app/account/profile/page.js`

- [ ] **Step 1: Create the page**

```js
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
```

- [ ] **Step 2: Verify the page loads**

Navigate to `/account/profile` while logged in. Expected: the page loads, fields are pre-filled with current name, email is read-only, phone may be empty.

- [ ] **Step 3: Test save**

Enter a phone number (e.g. `+971501234567`) and click "Save changes". Expected: button shows "✓ Saved". Reload page — phone number should persist.

- [ ] **Step 4: Commit**

```bash
git add app/account/profile/page.js
git commit -m "feat: add account profile page with phone number field"
```

---

## Task 3: Add Profile to navigation menu

**Files:**
- Modify: `app/account/_components/AccountMenuList.js:1-16`

- [ ] **Step 1: Add User icon import and Profile entry**

In [AccountMenuList.js](app/account/_components/AccountMenuList.js), update the import line and `sections` array:

```js
// Change this import line (line 4):
import { Sparkles, Package, Heart, MapPin, Settings, Star, ChevronRight, LogOut, User } from 'lucide-react';

// Change the sections array (lines 9-16) — add Profile as second item:
const sections = [
  { id: 'dashboard', label: 'Dashboard',  href: '/account/dashboard',  icon: Sparkles },
  { id: 'profile',   label: 'Profile',    href: '/account/profile',    icon: User     },
  { id: 'orders',    label: 'Orders',     href: '/account/orders',     icon: Package  },
  { id: 'wishlist',  label: 'Wishlist',   href: '/account/wishlist',   icon: Heart    },
  { id: 'addresses', label: 'Addresses',  href: '/account/addresses',  icon: MapPin   },
  { id: 'settings',  label: 'Settings',   href: '/account/settings',   icon: Settings },
  { id: 'loyalty',   label: 'Loyalty',    href: '/account/loyalty',    icon: Star     },
];
```

- [ ] **Step 2: Verify menu shows Profile**

Navigate to `/account` on mobile viewport. Expected: "Profile" appears as the second item below "Dashboard" with a person icon.

- [ ] **Step 3: Tap Profile and confirm navigation**

Tap Profile — should navigate to `/account/profile` with the back button returning to `/account`.

- [ ] **Step 4: Commit**

```bash
git add app/account/_components/AccountMenuList.js
git commit -m "feat: add Profile entry to account navigation menu"
```

---

## Self-Review

**Spec coverage:**
- ✅ Users can view their name and email on a dedicated profile page
- ✅ Users can enter/edit their phone number
- ✅ Phone is stored on `users.phone_number` (canonical, not per-address)
- ✅ No DB migration needed — column already exists
- ✅ Profile is accessible from the account nav menu
- ✅ Cloud Luxe design system applied throughout

**No placeholders:** All code blocks are complete and self-contained.

**Type consistency:** `first_name`, `last_name`, `phone_number` are used consistently across API route and page component.
