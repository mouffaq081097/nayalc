'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Chrome, Facebook, Sparkles, ShieldCheck, Star, MailOpen, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

function getSafeCallbackUrl() {
  if (typeof window === 'undefined') return '/';
  const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
  return callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//') ? callbackUrl : '/';
}



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
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[11px] font-semibold text-[#999] hover:text-[#9368ee] transition-colors mb-4"
        >
          <ArrowLeft size={12} /> Back to Sign In
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-[#555] uppercase tracking-wide">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(196,167,254,0.7)] group-focus-within:text-[#9333ea] transition-colors" />
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-[52px] pl-12 pr-5 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[14px] font-medium text-[#111114] placeholder:text-[#bbb]"
            />
          </div>
        </div>

        {message && (
          <p className="text-emerald-700 text-[12px] font-semibold text-center bg-emerald-50 py-3 rounded-xl border border-emerald-100">
            {message}
          </p>
        )}
        {error && (
          <p className="text-amber-700 text-[12px] font-semibold text-center bg-amber-50 py-3 rounded-xl border border-amber-100">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-[52px] rounded-full text-[13px] font-black uppercase tracking-widest active:scale-95 flex items-center justify-center gap-3 mt-1 border-none shadow-none transition-all duration-300 bg-gradient-to-br from-[#d8b4fe] to-[#9368ee] text-white"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Send Reset Link <ArrowRight size={14} /></>
          )}
        </Button>
      </form>
    </motion.div>
  );
}

function Login({ onForgotClick }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);
    setResendMsg('');
    setIsLoading(true);
    try {
      await login(email, password, getSafeCallbackUrl());
    } catch (err) {
      if (err.message === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(email);
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    setResendMsg('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      const data = await res.json();
      setResendMsg(data.message || 'Verification email sent.');
    } catch {
      setResendMsg('Could not send email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="signin-email" className="text-[11px] font-semibold text-[#555] uppercase tracking-wide">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(196,167,254,0.7)] group-focus-within:text-[#9333ea] transition-colors" />
            <input
              id="signin-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-[52px] pl-12 pr-5 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[14px] font-medium text-[#111114] placeholder:text-[#bbb]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="signin-password" className="text-[11px] font-semibold text-[#555] uppercase tracking-wide">Password</label>
            <button
              type="button"
              onClick={onForgotClick}
              className="text-[11px] font-semibold text-[#9368ee] hover:text-[#7c3aed] transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(196,167,254,0.7)] group-focus-within:text-[#9333ea] transition-colors" />
            <input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-[52px] pl-12 pr-12 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[14px] font-medium text-[#111114] placeholder:text-[#bbb]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(196,167,254,0.7)] hover:text-[#9333ea] transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            id="remember-me"
            className="w-4 h-4 rounded-md border-[rgba(196,167,254,0.5)] bg-white text-[#9333ea] focus:ring-[rgba(196,167,254,0.2)] cursor-pointer"
          />
          <label htmlFor="remember-me" className="text-[12px] font-medium text-[#555] group-hover:text-[#111] transition-colors cursor-pointer">
            Remember me
          </label>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-amber-700 text-[12px] font-semibold text-center bg-amber-50 py-3 rounded-xl border border-amber-100"
          >
            {error}
          </motion.p>
        )}

        {unverifiedEmail && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-4 space-y-3"
            style={{ background: 'rgba(248,240,255,0.9)', borderColor: 'rgba(216,180,254,0.45)' }}
          >
            <div className="flex items-start gap-3">
              <MailOpen size={18} className="text-purple-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-[#3b0764]">Email not verified</p>
                <p className="text-[12px] text-[rgba(59,7,100,0.55)] mt-0.5">
                  Check your inbox for <span className="font-semibold">{unverifiedEmail}</span> and click the verification link.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || !!resendMsg}
              className="w-full py-2.5 rounded-xl text-[12px] font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#9333ea,#db2777)' }}
            >
              {resending
                ? <><Loader2 size={13} className="animate-spin" />Sending…</>
                : resendMsg
                ? resendMsg
                : 'Resend verification email'}
            </button>
          </motion.div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-[52px] rounded-full text-[13px] font-black uppercase tracking-widest active:scale-95 flex items-center justify-center gap-3 border-none shadow-none transition-all duration-300 bg-gradient-to-br from-[#d8b4fe] to-[#9368ee] text-white"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Sign In <ArrowRight size={14} /></>
          )}
        </Button>
      </form>

      <div className="flex items-center gap-3 pt-1">
        <div className="flex-1 h-px bg-[rgba(216,180,254,0.3)]" />
        <span className="text-[11px] font-medium text-[#aaa]">or continue with</span>
        <div className="flex-1 h-px bg-[rgba(216,180,254,0.3)]" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="h-11 flex items-center justify-center gap-2 rounded-2xl border border-[rgba(216,180,254,0.5)] bg-white/80 backdrop-blur-sm text-[12px] font-semibold text-[#444] hover:bg-white hover:border-[rgba(147,104,236,0.6)] hover:shadow-[0_2px_10px_rgba(147,104,236,0.1)] transition-all">
          <Chrome size={15} className="text-[rgba(196,167,254,0.8)]" />
          Google
        </button>
        <button className="h-11 flex items-center justify-center gap-2 rounded-2xl border border-[rgba(216,180,254,0.5)] bg-white/80 backdrop-blur-sm text-[12px] font-semibold text-[#444] hover:bg-white hover:border-[rgba(147,104,236,0.6)] hover:shadow-[0_2px_10px_rgba(147,104,236,0.1)] transition-all">
          <Facebook size={15} className="text-[rgba(196,167,254,0.8)]" />
          Facebook
        </button>
      </div>
    </motion.div>
  );
}

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', segments: [false, false, false, false] };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const segments = [score >= 1, score >= 2, score >= 3, score >= 4];
  return { score, label: labels[score], segments };
}

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [registeredEmail, setRegisteredEmail] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const { register } = useAuth();

  const strength = getPasswordStrength(password);
  const segmentColors = ['#ef4444', '#f97316', '#a78bfa', '#7c68ee'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const autoUsername = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(1000 + Math.random() * 9000)}`;
      const result = await register(autoUsername, email, password, firstName, lastName);
      if (result?.requiresEmailVerification) {
        setRegisteredEmail(email);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setResending(true);
    setResendMsg('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const data = await res.json();
      setResendMsg(data.message || 'Email sent.');
    } catch {
      setResendMsg('Could not send. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // ── Post-registration: "check your email" screen ──
  if (registeredEmail) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5 py-4 text-center"
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(147,51,234,0.08)' }}>
            <MailOpen size={30} style={{ color: '#9333ea' }} />
          </div>
        </div>
        <div>
          <h3 className="text-[20px] font-black text-[#111114]">Check your inbox</h3>
          <p className="text-[13px] text-[#888] mt-1.5 leading-relaxed">
            We sent a verification link to<br />
            <span className="font-semibold text-[#3b0764]">{registeredEmail}</span>
          </p>
          <p className="text-[12px] text-[#aaa] mt-2">Click the link in the email to activate your account. It expires in 24 hours.</p>
        </div>
        <button
          onClick={handleResend}
          disabled={resending || !!resendMsg}
          className="w-full h-[48px] rounded-full text-[12px] font-bold disabled:opacity-50 flex items-center justify-center gap-2 border transition-colors"
          style={{ borderColor: 'rgba(216,180,254,0.5)', color: '#9333ea' }}
        >
          {resending
            ? <><Loader2 size={13} className="animate-spin" />Sending…</>
            : resendMsg
            ? resendMsg
            : 'Resend verification email'}
        </button>
        <p className="text-[11px] text-[#bbb]">
          Already verified?{' '}
          <button onClick={() => setRegisteredEmail(null)} className="text-[#9333ea] hover:underline font-semibold">
            Back to sign in
          </button>
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="register-firstname" className="text-[11px] font-semibold text-[#555] uppercase tracking-wide">First Name</label>
            <input
              id="register-firstname"
              type="text"
              placeholder="Layla"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full h-[52px] px-4 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[14px] font-medium text-[#111114] placeholder:text-[#bbb]"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="register-lastname" className="text-[11px] font-semibold text-[#555] uppercase tracking-wide">Last Name</label>
            <input
              id="register-lastname"
              type="text"
              placeholder="Ahmed"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full h-[52px] px-4 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[14px] font-medium text-[#111114] placeholder:text-[#bbb]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="register-email" className="text-[11px] font-semibold text-[#555] uppercase tracking-wide">Email</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(196,167,254,0.7)] group-focus-within:text-[#9333ea] transition-colors" />
            <input
              id="register-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-[52px] pl-12 pr-5 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[14px] font-medium text-[#111114] placeholder:text-[#bbb]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="register-password" className="text-[11px] font-semibold text-[#555] uppercase tracking-wide">Password</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(196,167,254,0.7)] group-focus-within:text-[#9333ea] transition-colors" />
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-[52px] pl-12 pr-12 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[14px] font-medium text-[#111114] placeholder:text-[#bbb]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(196,167,254,0.7)] hover:text-[#9333ea] transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Password strength bar */}
          <div className="flex gap-1.5 pt-0.5">
            {strength.segments.map((active, i) => (
              <div
                key={i}
                className="h-[3px] flex-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: active ? segmentColors[strength.score - 1] : 'rgba(216,180,254,0.25)',
                }}
              />
            ))}
          </div>
          {password && (
            <p className="text-[11px]" style={{ color: segmentColors[strength.score - 1] }}>
              {strength.label} — Use 8+ characters{' '}
              <span className="text-[rgba(107,33,168,0.6)]">with a number and a symbol.</span>
            </p>
          )}
          {!password && (
            <p className="text-[11px] text-[#999]">
              Use 8+ characters <span className="text-[#9368ee]">with a number and a symbol.</span>
            </p>
          )}
        </div>

        {/* Marketing opt-in */}
        <div className="flex items-start gap-2.5 pt-1">
          <div className="relative mt-0.5 flex-shrink-0">
            <input
              type="checkbox"
              id="email-optin"
              checked={emailOptIn}
              onChange={(e) => setEmailOptIn(e.target.checked)}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => setEmailOptIn(!emailOptIn)}
              className="w-[18px] h-[18px] rounded-[4px] flex items-center justify-center transition-all duration-200 border-2"
              style={{
                background: emailOptIn ? 'linear-gradient(135deg, #d8b4fe, #9368ee)' : 'white',
                borderColor: emailOptIn ? '#9368ee' : 'rgba(216,180,254,0.5)',
              }}
            >
              {emailOptIn && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
          <label
            htmlFor="email-optin"
            onClick={() => setEmailOptIn(!emailOptIn)}
            className="text-[13px] font-medium text-[#333] leading-snug cursor-pointer"
          >
            Email me launches, restocks and{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #d8b4fe, #9368ee)' }}>
              rituals.
            </span>
          </label>
        </div>

        {error && (
          <p className="text-amber-700 text-[12px] font-semibold text-center bg-amber-50 py-3 rounded-xl border border-amber-100">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-[52px] rounded-full text-[13px] font-black uppercase tracking-widest active:scale-95 flex items-center justify-center gap-3 mt-1 border-none shadow-none transition-all duration-300 bg-gradient-to-br from-[#d8b4fe] to-[#9368ee] text-white"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Create Account <ArrowRight size={14} /></>
          )}
        </Button>

        <p className="text-center text-[11px] text-[#aaa]">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="text-[#9333ea] hover:underline">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-[#9333ea] hover:underline">Privacy Policy</Link>.
        </p>
      </form>
    </motion.div>
  );
}



export default function AuthPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState('login');

  return (
    <div className="min-h-screen font-sans bg-[#f8f7fb]">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto relative flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#4f46e5] hover:text-[#312e81] transition-colors"
          >
            <ArrowLeft size={14} />
            Back to store
          </button>

          <div className="pointer-events-none absolute inset-x-0 flex justify-center">
            <Link href="/" className="pointer-events-auto inline-flex items-center gap-3 transition-opacity hover:opacity-90">
              <Image
                src="/Adobe Express - file (5).png"
                alt="Naya Lumière"
                width={38}
                height={38}
                className="w-[38px] h-[38px] object-contain"
              />
              <div className="hidden sm:flex flex-col leading-tight font-semibold tracking-[0.06em] text-[#111114]">
                <span className="text-sm">NAYA LUMIÈRE</span>
                <span className="text-[8px] tracking-[0.3em] uppercase text-[#5a5a64]">COSMETICS</span>
              </div>
            </Link>
          </div>

          <div className="w-24" />
        </div>
      </header>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        <div className="hidden lg:flex lg:w-1/2 xl:w-[52%] h-screen sticky top-16 flex-col relative overflow-hidden">
          <Image
            src="/kimia-kazemi-u93nTfWqR9w-unsplash.jpg"
            alt="Naya Lumière Cosmetics"
            fill
            className="object-cover object-center"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(160deg, rgba(26,8,56,0.55) 0%, rgba(59,7,100,0.72) 45%, rgba(26,8,56,0.90) 100%)',
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(216,180,254,0.18) 0%, transparent 70%)', transform: 'translate(30%, 30%)' }}
          />
          <div className="relative z-10 mt-auto p-8 xl:p-10 pb-12 space-y-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgba(216,180,254,0.7)] mb-4 font-sans">
                Your Beauty Sanctuary
              </p>
              <h1
                className="text-5xl xl:text-[56px] leading-[1.1] text-white"
                style={{ fontFamily: 'var(--font-cormorant), serif', fontStyle: 'italic', fontWeight: 600 }}
              >
                Discover your <br />
                <em
                  className="not-italic font-black"
                  style={{
                    fontFamily: 'var(--font-cormorant), serif',
                    backgroundImage: 'linear-gradient(135deg, rgb(245,235,255), rgb(216,180,254))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  radiance
                </em>
              </h1>
              <p className="mt-4 text-[13px] text-white/55 font-normal leading-relaxed font-sans max-w-[320px]">
                Clinical precision meets botanical luxury. Exclusive access to bespoke formulations crafted for the UAE.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(216,180,254,0.15)', border: '1px solid rgba(216,180,254,0.3)' }}
                >
                  <Sparkles size={14} className="text-[rgb(216,180,254)]" />
                </div>
                <span className="text-[12px] font-semibold text-white/75 font-sans">AI-powered skin consultations</span>
              </div>
              <div className="flex items-center gap-3.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(216,180,254,0.15)', border: '1px solid rgba(216,180,254,0.3)' }}
                >
                  <ShieldCheck size={14} className="text-[rgb(216,180,254)]" />
                </div>
                <span className="text-[12px] font-semibold text-white/75 font-sans">Clinically proven formulas</span>
              </div>
              <div className="flex items-center gap-3.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(216,180,254,0.15)', border: '1px solid rgba(216,180,254,0.3)' }}
                >
                  <Star size={14} className="text-[rgb(216,180,254)]" />
                </div>
                <span className="text-[12px] font-semibold text-white/75 font-sans">Exclusive member rewards</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:hidden relative h-[28vh] overflow-hidden flex-shrink-0">
          <Image
            src="/kimia-kazemi-u93nTfWqR9w-unsplash.jpg"
            alt="Naya Lumière Cosmetics"
            fill
            className="object-cover object-center"
            priority
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(26,8,56,0.45) 0%, rgba(59,7,100,0.80) 100%)' }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 px-6 pt-8">
            <h1
              className="text-[30px] md:text-[36px] leading-[1.1] text-white"
              style={{ fontFamily: 'var(--font-cormorant), serif', fontStyle: 'italic', fontWeight: 600 }}
            >
              Discover your <br />
              <em
                className="not-italic font-black"
                style={{
                  fontFamily: 'var(--font-cormorant), serif',
                  backgroundImage: 'linear-gradient(135deg, rgb(245,235,255), rgb(216,180,254))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                radiance
              </em>
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(216,180,254,0.85)] mt-2 font-sans">
              Your Beauty Sanctuary
            </p>
          </div>
        </div>

        <div className="flex-1 lg:w-1/2 xl:w-[48%] min-h-screen lg:min-h-0 lg:h-screen lg:overflow-y-auto bg-[#ffffff] flex flex-col">
          <div className="flex-1 flex items-start lg:items-center justify-center px-6 pt-6 pb-6 lg:py-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[420px]"
            >
              <div className="text-center mb-5">
                <h2 className="text-[32px] font-black text-[#111114] leading-tight tracking-tight">
                  {authMode === 'register'
                    ? 'Create your account.'
                    : authMode === 'forgot-password'
                    ? 'Reset your password.'
                    : 'Welcome back.'}
                </h2>
                <p className="text-[13px] text-[#888] mt-1.5 font-normal">
                  {authMode === 'register'
                    ? 'It takes about thirty seconds.'
                    : authMode === 'forgot-password'
                    ? "We'll send a secure reset link."
                    : 'Sign in to continue your beauty journey.'}
                </p>
              </div>

              <Tabs
                value={authMode === 'forgot-password' ? 'login' : authMode}
                onValueChange={setAuthMode}
                className="w-full"
              >
                <TabsList className="flex bg-transparent border-0 border-b border-[rgba(216,180,254,0.4)] rounded-none p-0 mb-5 gap-0 relative">
                  <TabsTrigger
                    value="login"
                    className="flex-1 pb-3 pt-0 rounded-none bg-transparent border-0 text-[11px] font-bold uppercase tracking-widest transition-all data-[state=active]:text-[#111114] data-[state=active]:shadow-none data-[state=active]:[box-shadow:inset_0_-2px_0_0_#9368ee] text-[#aaa] shadow-none"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="flex-1 pb-3 pt-0 rounded-none bg-transparent border-0 text-[11px] font-bold uppercase tracking-widest transition-all data-[state=active]:text-[#111114] data-[state=active]:shadow-none data-[state=active]:[box-shadow:inset_0_-2px_0_0_#9368ee] text-[#aaa] shadow-none"
                  >
                    Register
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-0 outline-none">
                  <AnimatePresence mode="wait">
                    {authMode === 'forgot-password' ? (
                      <ForgotPassword key="forgot" onBack={() => setAuthMode('login')} />
                    ) : (
                      <Login key="login" onForgotClick={() => setAuthMode('forgot-password')} />
                    )}
                  </AnimatePresence>
                </TabsContent>
                <TabsContent value="register" className="mt-0 outline-none">
                  <Register />
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          <div className="px-6 py-6 text-center">
            <p className="text-[10px] font-medium text-[#bbb]">
              © 2026 Naya Lumière Cosmetics · UAE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
