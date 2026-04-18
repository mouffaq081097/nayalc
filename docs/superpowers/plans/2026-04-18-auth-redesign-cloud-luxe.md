# Auth Page Redesign — Cloud Luxe Lavender Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully retheme `app/auth/page.js` to the Cloud Luxe lavender design system — replacing all `brand-pink`/`brand-blue`/`bg-black` references, swapping the left panel from product images to an atmospheric lavender panel, and enforcing Title Case + zero letter-spacing throughout.

**Architecture:** Single-file rewrite of `app/auth/page.js`. The four components (`ForgotPassword`, `Login`, `Register`, `AuthPage`) are replaced in-place. All form logic, routing, and auth hooks are left untouched.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS 4, Radix UI Tabs, Framer Motion, Lucide React, Cloud Luxe design tokens (`app/globals.css`)

---

## Files

| Action | Path |
|---|---|
| Modify | `app/auth/page.js` |

---

### Task 1: Replace `ForgotPassword` component

**Files:**
- Modify: `app/auth/page.js` (lines 13–103)

- [ ] **Step 1: Replace the ForgotPassword function**

Find the entire `ForgotPassword` function (from `function ForgotPassword` to its closing `}`) and replace it with:

```jsx
function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[9px] font-bold text-[rgba(107,33,168,0.5)] hover:text-[#9333ea] transition-colors mb-4"
        >
          <ArrowLeft size={11} /> Back To Sign In
        </button>
        <h3 className="font-serif italic text-[26px] leading-snug text-[#3b0764]">
          Restore <strong className="not-italic font-black cl-gradient-text">Access</strong>
        </h3>
        <p className="text-[12px] text-[rgba(59,7,100,0.45)] font-medium leading-relaxed">
          Enter your email and we'll send you a secure link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[rgba(107,33,168,0.55)]">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(196,167,254,0.7)] group-focus-within:text-[#9333ea] transition-colors" />
            <input
              type="email"
              placeholder="Enter Your Registered Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 pl-12 pr-6 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all duration-300 outline-none text-sm font-medium text-[#3b0764]"
            />
          </div>
        </div>

        {message && (
          <p className="text-green-700 text-[11px] font-bold text-center bg-[rgba(240,253,244,0.8)] py-3 rounded-xl border border-[rgba(187,247,208,0.5)]">
            {message}
          </p>
        )}
        {error && (
          <p className="text-red-600 text-[11px] font-bold text-center bg-[rgba(254,242,242,0.8)] py-3 rounded-xl border border-[rgba(254,202,202,0.5)]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-full bg-gradient-to-r from-[rgb(216,180,254)] to-[rgb(126,105,230)] text-white text-[11px] font-black uppercase shadow-[0_8px_24px_rgba(126,105,230,0.35)] hover:shadow-[0_12px_32px_rgba(126,105,230,0.45)] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 mt-2"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Send Reset Link <ArrowRight size={14} /></>
          )}
        </button>
      </form>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify the dev server compiles without errors**

```bash
npm run dev
```

Expected: No compilation errors in terminal. Visit `http://localhost:3000/auth` — page loads.

---

### Task 2: Replace `Login` component

**Files:**
- Modify: `app/auth/page.js` (lines 105–234)

- [ ] **Step 1: Replace the Login function**

Find the entire `Login` function and replace it with:

```jsx
function Login({ onForgotClick }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-5 h-px bg-[rgba(216,180,254,0.6)]" />
          <span className="text-[9px] font-bold text-[rgba(147,51,234,0.6)]">Secure Access</span>
        </div>
        <h3 className="font-serif italic text-[26px] leading-snug text-[#3b0764]">
          Welcome Back <br />
          <strong className="not-italic font-black cl-gradient-text">To Your Sanctuary</strong>
        </h3>
        <p className="text-[12px] text-[rgba(59,7,100,0.45)] font-medium leading-relaxed">
          Continue your clinical botanical journey with Naya Lumière.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[rgba(107,33,168,0.55)]">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(196,167,254,0.7)] group-focus-within:text-[#9333ea] transition-colors" />
            <input
              type="email"
              placeholder="Enter Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 pl-12 pr-6 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all duration-300 outline-none text-sm font-medium text-[#3b0764]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-[rgba(107,33,168,0.55)]">Password</label>
            <button
              type="button"
              onClick={onForgotClick}
              className="text-[9px] font-bold text-[rgba(147,51,234,0.55)] hover:text-[#9333ea] transition-colors"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(196,167,254,0.7)] group-focus-within:text-[#9333ea] transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-12 pl-12 pr-12 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all duration-300 outline-none text-sm font-medium text-[#3b0764]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(196,167,254,0.7)] hover:text-[#9333ea] transition-colors"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 rounded border-[rgba(196,167,254,0.5)] bg-[rgba(248,240,255,0.5)] text-[#9333ea] focus:ring-[rgba(196,167,254,0.2)] cursor-pointer"
          />
          <span className="text-[10px] font-medium text-[rgba(59,7,100,0.45)] group-hover:text-[#6b21a8] transition-colors">
            Remember Me
          </span>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-red-600 text-[11px] font-bold text-center bg-[rgba(254,242,242,0.8)] py-3 rounded-xl border border-[rgba(254,202,202,0.5)]"
          >
            {error}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-full bg-gradient-to-r from-[rgb(216,180,254)] to-[rgb(126,105,230)] text-white text-[11px] font-black uppercase shadow-[0_8px_24px_rgba(126,105,230,0.35)] hover:shadow-[0_12px_32px_rgba(126,105,230,0.45)] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Sign In <ArrowRight size={14} /></>
          )}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[rgba(216,180,254,0.25)]" />
        <span className="text-[9px] font-semibold text-[rgba(147,51,234,0.35)]">Or Continue With</span>
        <div className="flex-1 h-px bg-[rgba(216,180,254,0.25)]" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="h-10 flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-[rgba(216,180,254,0.3)] bg-[rgba(248,240,255,0.4)] text-[10px] font-bold text-[#6b21a8] hover:bg-[rgba(248,240,255,0.8)] transition-all group">
          <Chrome size={14} className="text-[rgba(196,167,254,0.7)] group-hover:text-[#9333ea] transition-colors" />
          Google
        </button>
        <button className="h-10 flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-[rgba(216,180,254,0.3)] bg-[rgba(248,240,255,0.4)] text-[10px] font-bold text-[#6b21a8] hover:bg-[rgba(248,240,255,0.8)] transition-all group">
          <Facebook size={14} className="text-[rgba(196,167,254,0.7)] group-hover:text-[#9333ea] transition-colors" />
          Facebook
        </button>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Check the page visually**

Visit `http://localhost:3000/auth`. The Sign In tab should show:
- Lavender eyebrow line + "Secure Access" label
- Serif italic heading with gradient "To Your Sanctuary" accent
- Lavender-tinted input fields with lavender focus ring
- Soft lavender gradient "Sign In" button (no black)
- Lavender ghost social buttons

---

### Task 3: Replace `Register` component

**Files:**
- Modify: `app/auth/page.js` (lines 236–364)

- [ ] **Step 1: Replace the Register function**

Find the entire `Register` function and replace it with:

```jsx
function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const autoUsername = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(1000 + Math.random() * 9000)}`;
      await register(autoUsername, email, password, firstName, lastName);
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-5 h-px bg-[rgba(216,180,254,0.6)]" />
          <span className="text-[9px] font-bold text-[rgba(147,51,234,0.6)]">New Account</span>
        </div>
        <h3 className="font-serif italic text-[26px] leading-snug text-[#3b0764]">
          Create Your <br />
          <strong className="not-italic font-black cl-gradient-text">Personal Account</strong>
        </h3>
        <p className="text-[12px] text-[rgba(59,7,100,0.45)] font-medium leading-relaxed">
          Join the world of clinical botanical precision.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[rgba(107,33,168,0.55)]">First Name</label>
            <input
              type="text"
              placeholder="e.g. Jean"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all outline-none text-sm font-medium text-[#3b0764]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[rgba(107,33,168,0.55)]">Last Name</label>
            <input
              type="text"
              placeholder="e.g. Dupont"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all outline-none text-sm font-medium text-[#3b0764]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[rgba(107,33,168,0.55)]">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(196,167,254,0.7)] group-focus-within:text-[#9333ea] transition-colors" />
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 pl-12 pr-6 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all outline-none text-sm font-medium text-[#3b0764]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[rgba(107,33,168,0.55)]">Create Password</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(196,167,254,0.7)] group-focus-within:text-[#9333ea] transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="At Least 8 Characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-12 pl-12 pr-12 rounded-[14px] border-[1.5px] border-[rgba(216,180,254,0.35)] bg-[rgba(248,240,255,0.5)] focus:border-[rgba(147,51,234,0.5)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,167,254,0.15)] transition-all outline-none text-sm font-medium text-[#3b0764]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(196,167,254,0.7)] hover:text-[#9333ea] transition-colors"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-[11px] font-bold text-center bg-[rgba(254,242,242,0.8)] py-3 rounded-xl border border-[rgba(254,202,202,0.5)]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-full bg-gradient-to-r from-[rgb(216,180,254)] to-[rgb(126,105,230)] text-white text-[11px] font-black uppercase shadow-[0_8px_24px_rgba(126,105,230,0.35)] hover:shadow-[0_12px_32px_rgba(126,105,230,0.45)] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 mt-1"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Create Account <ArrowRight size={14} /></>
          )}
        </button>
      </form>
    </motion.div>
  );
}
```

- [ ] **Step 2: Check register tab visually**

Click "Register" tab at `http://localhost:3000/auth`. Should show:
- "New Account" eyebrow, serif italic heading with "Personal Account" gradient
- Lavender-tinted 2-column name fields
- Lavender gradient "Create Account" button

---

### Task 4: Replace `AuthPage` (shell, nav, left panel, right panel)

**Files:**
- Modify: `app/auth/page.js` (lines 366–519)

- [ ] **Step 1: Replace the AuthPage export and update imports**

First update the imports at the top of the file. Replace the entire import block with:

```jsx
'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Mail, Lock, Eye, ArrowLeft, Sparkles, ShieldCheck, ArrowRight, Chrome, Facebook } from 'lucide-react';
import { motion } from 'framer-motion';
```

- [ ] **Step 2: Replace the AuthPage function**

Find the entire `export default function AuthPage()` function and replace it with:

```jsx
export default function AuthPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState('login');

  return (
    <div className="min-h-screen bg-[#fdf8ff] relative overflow-hidden flex flex-col font-sans">
      {/* Page background auras */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] -right-[10%] w-[50%] h-[50%] bg-[rgba(216,180,254,0.2)] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] -left-[10%] w-[45%] h-[45%] bg-[rgba(249,168,212,0.15)] rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <div className="container mx-auto px-6 pt-6 pb-0 relative z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 text-[10px] font-bold text-[rgba(107,33,168,0.5)] hover:text-[#6b21a8] transition-all group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back To Store
          </button>
          <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/75 shadow-sm border border-[rgba(216,180,254,0.3)] backdrop-blur-xl">
            <div className="w-1.5 h-1.5 rounded-full bg-[rgb(196,167,254)] shadow-[0_0_8px_rgba(147,51,234,0.4)]" />
            <span className="text-[9px] font-black text-[#3b0764]">Naya Lumière Cosmetics</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="flex-grow container mx-auto px-6 py-6 md:py-8 relative z-10 flex items-center justify-center">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-stretch w-full">

          {/* Left — atmospheric lavender panel */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.1 }}
            className="hidden lg:flex lg:col-span-5 flex-col justify-between relative rounded-[2.5rem] overflow-hidden p-10 border border-[rgba(216,180,254,0.25)]"
            style={{ minHeight: '580px', background: 'linear-gradient(145deg,#f3e8ff 0%,#fdf4ff 40%,#fce7f3 100%)' }}
          >
            {/* Aura orbs */}
            <div className="absolute top-[-60px] left-[-40px] w-72 h-72 bg-[rgba(216,180,254,0.45)] rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-[-60px] right-[-40px] w-60 h-60 bg-[rgba(249,168,212,0.3)] rounded-full blur-[70px] pointer-events-none" />
            <div className="absolute top-[40%] left-[30%] w-40 h-40 bg-[rgba(196,167,254,0.2)] rounded-full blur-[50px] pointer-events-none" />

            {/* Brand indicator */}
            <div className="flex items-center gap-2 relative z-10">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[rgb(216,180,254)] to-[rgb(126,105,230)] shadow-[0_0_10px_rgba(147,51,234,0.4)]" />
              <span className="text-[10px] font-black text-[#3b0764]">Naya Lumière Cosmetics</span>
            </div>

            {/* Quote */}
            <div className="text-center relative z-10 py-8">
              <Sparkles className="mx-auto text-[rgba(196,167,254,0.8)] mb-4" size={20} strokeWidth={1.5} />
              <p className="font-serif italic text-[22px] leading-relaxed text-[#3b0764] mb-5">
                "A commitment<br />to the purity<br />of light."
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-6 h-px bg-[rgba(147,51,234,0.25)]" />
                <span className="text-[9px] font-semibold text-[rgba(107,33,168,0.5)]">Geneva Laboratory</span>
                <div className="w-6 h-px bg-[rgba(147,51,234,0.25)]" />
              </div>
            </div>

            {/* Member benefits */}
            <div className="bg-white/60 backdrop-blur-2xl border border-[rgba(216,180,254,0.4)] rounded-2xl p-5 relative z-10">
              <p className="text-[10px] font-black text-[#3b0764] mb-3">Member Privileges</p>
              <ul className="space-y-2">
                {[
                  'Bespoke Ai Skincare Analysis',
                  'Avant-Première Launch Access',
                  'Boutique Exclusive Curation',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[rgb(216,180,254)] to-[rgb(126,105,230)] flex-shrink-0" />
                    <span className="text-[10px] font-medium text-[#6b21a8]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Right — form */}
          <div className="lg:col-span-7 w-full max-w-lg mx-auto lg:mx-0">
            <div className="bg-white/[0.82] backdrop-blur-3xl rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 shadow-[0_30px_80px_-30px_rgba(147,51,234,0.12)] border border-[rgba(216,180,254,0.25)] relative overflow-hidden">

              <Tabs
                value={authMode === 'forgot-password' ? 'login' : authMode}
                onValueChange={setAuthMode}
                className="w-full"
              >
                <TabsList className="flex bg-[rgba(248,240,255,0.7)] border border-[rgba(216,180,254,0.25)] rounded-full p-1 mb-8">
                  <TabsTrigger
                    value="login"
                    className="flex-1 py-3 rounded-full text-[11px] font-bold transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[rgb(216,180,254)] data-[state=active]:to-[rgb(126,105,230)] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_16px_rgba(126,105,230,0.35)] text-[rgba(107,33,168,0.45)]"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="flex-1 py-3 rounded-full text-[11px] font-bold transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[rgb(216,180,254)] data-[state=active]:to-[rgb(126,105,230)] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_16px_rgba(126,105,230,0.35)] text-[rgba(107,33,168,0.45)]"
                  >
                    Register
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-0 outline-none">
                  {authMode === 'forgot-password' ? (
                    <ForgotPassword onBack={() => setAuthMode('login')} />
                  ) : (
                    <Login onForgotClick={() => setAuthMode('forgot-password')} />
                  )}
                </TabsContent>
                <TabsContent value="register" className="mt-0 outline-none">
                  <Register />
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center space-y-3">
              <div className="flex items-center justify-center gap-4 opacity-40">
                <div className="w-10 h-px bg-[rgba(147,51,234,0.4)]" />
                <p className="text-[9px] font-medium text-[rgba(107,33,168,0.5)]">Est. 2026 — Naya Atelier Privé</p>
                <div className="w-10 h-px bg-[rgba(147,51,234,0.4)]" />
              </div>
              <div className="flex items-center justify-center gap-5 text-[rgba(196,167,254,0.5)]">
                <ShieldCheck size={13} />
                <Lock size={13} />
                <Sparkles size={13} />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Full visual check**

Visit `http://localhost:3000/auth` on desktop (≥1024px wide). Verify:

| Check | Expected |
|---|---|
| Page background | Soft `#fdf8ff` lavender white, lavender/rose aura blobs |
| Nav "Back To Store" | Muted purple text, no black |
| Brand badge | Glowing lavender dot + `"Naya Lumière Cosmetics"` |
| Left panel (desktop) | Lavender gradient, 3 aura orbs, quote, benefits card |
| Tab switcher | Active = soft lavender gradient pill; inactive = muted purple text |
| Input fields | Lavender-tinted background, lavender focus ring |
| Primary buttons | Soft lavender gradient, white uppercase text |
| Social buttons | Lavender ghost style |
| No letter-spacing | No visually spread-out text anywhere |
| Title Case | Every label/button/heading starts each word with a capital |

Also check on mobile (< 1024px): left panel is hidden, form fills the screen cleanly.

- [ ] **Step 4: Test "Forgot Password?" flow**

Click "Forgot Password?" link. Verify:
- Slides in to the ForgotPassword view
- "Back To Sign In" link returns to Login
- Heading reads "Restore Access" with gradient on "Access"

- [ ] **Step 5: Commit**

```bash
git add app/auth/page.js
git commit -m "feat: redesign auth page with Cloud Luxe lavender theme"
```
