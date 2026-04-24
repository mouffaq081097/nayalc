# Password Reset Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the JWT replay vulnerability in the password reset flow and restyle the reset-password page to Cloud Luxe lavender.

**Architecture:** The security fix embeds a 16-char prefix of the user's current `password_hash` in the JWT at issuance time. On use, the API re-fetches the current hash from the DB and checks the prefix matches — if the password was already changed (token used), the prefix won't match and the request is rejected. The styling fix replaces all `brand-pink`/`bg-black` tokens in the reset-password page with Cloud Luxe lavender equivalents.

**Tech Stack:** Next.js 15 App Router, `jose` (JWT), `bcryptjs`, Vercel Postgres (`lib/db.js`), Tailwind CSS 4

---

## File Map

| File | Change |
|---|---|
| `app/api/auth/forgot-password/route.js` | Add `password_hash` to SELECT; embed `pwdHash` prefix in JWT; guard OAuth accounts |
| `app/api/auth/reset-password/route.js` | Re-fetch `password_hash` after JWT verify; reject if prefix mismatch |
| `app/auth/reset-password/page.js` | Replace all `brand-pink` / `bg-black` with Cloud Luxe lavender |

---

## Task 1 — Secure token issuance in forgot-password route

**Files:**
- Modify: `app/api/auth/forgot-password/route.js`

- [ ] **Step 1: Replace the file with the secured version**

Open `app/api/auth/forgot-password/route.js` and replace its entire contents with:

```js
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/mail';
import { SignJWT } from 'jose';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const client = await db.connect();
    try {
      const result = await client.query(
        'SELECT id, email, password_hash FROM users WHERE LOWER(email) = LOWER($1)',
        [email]
      );

      // Return ambiguous message for unknown emails or OAuth-only accounts (no password_hash)
      if (result.rows.length === 0 || !result.rows[0].password_hash) {
        return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
      }

      const user = result.rows[0];
      const pwdHash = user.password_hash.slice(0, 16);

      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
      const resetToken = await new SignJWT({ userId: user.id, email: user.email, pwdHash })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret);

      await sendPasswordResetEmail(user.email, resetToken);

      return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/auth/forgot-password/route.js
git commit -m "fix: embed password hash prefix in reset JWT to prevent replay"
```

---

## Task 2 — Enforce hash-prefix check in reset-password route

**Files:**
- Modify: `app/api/auth/reset-password/route.js`

- [ ] **Step 1: Replace the file with the secured version**

Open `app/api/auth/reset-password/route.js` and replace its entire contents with:

```js
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, secret);
      payload = verifiedPayload;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 401 });
    }

    const client = await db.connect();
    try {
      // Re-fetch current password_hash to verify the token hasn't been used already
      const userResult = await client.query(
        'SELECT password_hash FROM users WHERE id = $1 AND email = $2',
        [payload.userId, payload.email]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 401 });
      }

      const currentHash = userResult.rows[0].password_hash;

      // If hash changed since token was issued, the prefix won't match — token is dead
      if (!currentHash || !payload.pwdHash || !currentHash.startsWith(payload.pwdHash)) {
        return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 401 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const result = await client.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2 AND email = $3 RETURNING id',
        [hashedPassword, payload.userId, payload.email]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Password reset successful' }, { status: 200 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Manual verification — happy path**

With the dev server running (`npm run dev`):

1. Go to `/auth` → click "Forgot Password" → enter your account email → submit
2. Check your inbox for the reset email — click the link
3. On `/auth/reset-password?token=...` — enter a new password (≥8 chars) → submit
4. Expected: success message "Your password has been successfully restored." and redirect to `/auth` after 3s
5. Log in with the new password — confirm it works

- [ ] **Step 3: Manual verification — replay attack blocked**

1. Repeat step 1-2 above to get a fresh token in your email
2. Submit the reset form once (password changed successfully)
3. Copy the `token` query param from the URL
4. In a new tab, go directly to `/auth/reset-password?token=<copied-token>`
5. Try to submit with another new password
6. Expected: error message "Invalid or expired reset token" — the token is dead

- [ ] **Step 4: Commit**

```bash
git add app/api/auth/reset-password/route.js
git commit -m "fix: reject reset tokens whose password hash prefix no longer matches"
```

---

## Task 3 — Cloud Luxe styling on reset-password page

**Files:**
- Modify: `app/auth/reset-password/page.js`

- [ ] **Step 1: Replace the file with the Cloud Luxe version**

Open `app/auth/reset-password/page.js` and replace its entire contents with:

```js
'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Lock, Eye, ArrowLeft, ShieldCheck, Check, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Your password has been successfully restored.');
        setTimeout(() => router.push('/auth'), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-6">
        <h3 className="font-serif text-3xl italic text-[#6b21a8]">Invalid Link</h3>
        <p className="text-sm text-[rgba(107,33,168,0.5)] font-medium leading-relaxed">This reset link is invalid or has expired.</p>
        <button
          onClick={() => router.push('/auth')}
          className="text-[rgba(107,33,168,0.5)] hover:text-[#9333ea] font-bold uppercase text-[10px] tracking-widest transition-colors"
        >
          Back to Sign in
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-left space-y-1.5">
        <h3 className="font-serif text-3xl md:text-4xl italic text-[#6b21a8] leading-tight">Define your <br/>new password</h3>
        <p className="text-[13px] md:text-sm text-[rgba(107,33,168,0.5)] font-medium leading-relaxed">Secure your access to the Naya Lumière sanctuary.</p>
      </div>

      {message ? (
        <div className="space-y-6 text-center py-10">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-500" />
          </div>
          <p className="text-green-600 font-bold">{message}</p>
          <p className="text-xs text-[rgba(107,33,168,0.4)]">Redirecting you to the vault...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[rgba(107,33,168,0.5)] ml-1">New password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-purple-400 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-14 pl-12 pr-12 rounded-2xl border border-purple-100 bg-gray-50/30 focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-sm font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[rgba(107,33,168,0.5)] ml-1">Confirm password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-purple-400 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full h-14 pl-12 pr-12 rounded-2xl border border-purple-100 bg-gray-50/30 focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-sm font-medium"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-[11px] font-bold text-center bg-red-50 py-3 rounded-xl border border-red-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-16 bg-gradient-to-r from-[rgb(216,180,254)] to-[rgb(147,104,236)] text-white rounded-full font-black uppercase tracking-widest text-[13px] shadow-lg hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-4"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Update Password
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] relative overflow-hidden flex flex-col font-sans">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply z-0"></div>

      <main className="flex-grow container mx-auto px-6 py-12 relative z-10 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <div className="bg-white/80 backdrop-blur-3xl rounded-[3.5rem] p-10 md:p-14 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.1)] border border-purple-100 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.02] pointer-events-never bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
            <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-400" /></div>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Visual check**

With dev server running:
1. Navigate to `/auth/reset-password` (no token in URL) — confirm "Invalid Link" heading is lavender (`#6b21a8`), "Back to Sign in" is muted lavender, no pink anywhere
2. Navigate to `/auth/reset-password?token=anything` — confirm form appears with lavender input borders on focus, lavender lock icon on focus, and the submit button is the soft lavender-to-violet gradient with all-caps `UPDATE PASSWORD` label
3. Confirm no `brand-pink` or `bg-black` references remain: `grep -n "brand-pink\|bg-black" app/auth/reset-password/page.js` — expect zero output

- [ ] **Step 3: Commit**

```bash
git add app/auth/reset-password/page.js
git commit -m "style: restyle reset-password page to Cloud Luxe lavender"
```
