'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Sparkles, ShieldCheck, Star, MailOpen, Loader2, Check, X as XIcon } from 'lucide-react';
import { motion, AnimatePresence, MotionConfig, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import Image from 'next/image';

function getSafeCallbackUrl() {
  if (typeof window === 'undefined') return '/';
  const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
  return callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//') ? callbackUrl : '/';
}

// Focus the first field on desktop only — on a phone this would throw the
// keyboard up over the sheet while it is still animating in.
function useDesktopAutoFocus() {
  const ref = useRef(null);
  useEffect(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) ref.current?.focus();
  }, []);
  return ref;
}



function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const emailRef = useDesktopAutoFocus();

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
              ref={emailRef}
              type="email"
              inputMode="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading}
              className="w-full h-[56px] md:h-[52px] pl-12 pr-5 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[16px] md:text-[14px] font-medium text-[#111114] placeholder:text-[#bbb] disabled:opacity-60"
            />
          </div>
        </div>

        {message && (
          <p role="status" className="text-emerald-700 text-[12px] font-semibold text-center bg-emerald-50 py-3 rounded-xl border border-emerald-100">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="text-amber-700 text-[12px] font-semibold text-center bg-amber-50 py-3 rounded-xl border border-amber-100">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-[56px] md:h-[52px] rounded-full text-[13px] font-black uppercase tracking-widest active:scale-[0.98] flex items-center justify-center gap-3 mt-1 border-none shadow-none transition-all duration-300 bg-gradient-to-br from-[#d8b4fe] to-[#9368ee] text-white"
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
  const emailRef = useDesktopAutoFocus();
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
              ref={emailRef}
              id="signin-email"
              type="email"
              inputMode="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading}
              className="w-full h-[56px] md:h-[52px] pl-12 pr-5 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[16px] md:text-[14px] font-medium text-[#111114] placeholder:text-[#bbb] disabled:opacity-60"
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
              autoComplete="current-password"
              disabled={isLoading}
              className="w-full h-[56px] md:h-[52px] pl-12 pr-12 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[16px] md:text-[14px] font-medium text-[#111114] placeholder:text-[#bbb] disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full text-[rgba(196,167,254,0.7)] hover:text-[#9333ea] active:bg-[rgba(196,167,254,0.12)] transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <motion.p
            role="alert"
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
          className="w-full h-[56px] md:h-[52px] rounded-full text-[13px] font-black uppercase tracking-widest active:scale-[0.98] flex items-center justify-center gap-3 border-none shadow-none transition-all duration-300 bg-gradient-to-br from-[#d8b4fe] to-[#9368ee] text-white"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Sign In <ArrowRight size={14} /></>
          )}
        </Button>
      </form>
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [registeredEmail, setRegisteredEmail] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const firstNameRef = useDesktopAutoFocus();
  const { register } = useAuth();

  const strength = getPasswordStrength(password);
  const segmentColors = ['#ef4444', '#f97316', '#a78bfa', '#7c68ee'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
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
              ref={firstNameRef}
              id="register-firstname"
              type="text"
              placeholder="Layla"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoComplete="given-name"
              disabled={isLoading}
              className="w-full h-[56px] md:h-[52px] px-4 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[16px] md:text-[14px] font-medium text-[#111114] placeholder:text-[#bbb] disabled:opacity-60"
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
              autoComplete="family-name"
              disabled={isLoading}
              className="w-full h-[56px] md:h-[52px] px-4 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[16px] md:text-[14px] font-medium text-[#111114] placeholder:text-[#bbb] disabled:opacity-60"
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
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading}
              className="w-full h-[56px] md:h-[52px] pl-12 pr-5 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[16px] md:text-[14px] font-medium text-[#111114] placeholder:text-[#bbb] disabled:opacity-60"
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
              autoComplete="new-password"
              disabled={isLoading}
              className="w-full h-[56px] md:h-[52px] pl-12 pr-12 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[16px] md:text-[14px] font-medium text-[#111114] placeholder:text-[#bbb] disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full text-[rgba(196,167,254,0.7)] hover:text-[#9333ea] active:bg-[rgba(196,167,254,0.12)] transition-colors"
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

        <div className="space-y-1.5">
          <label htmlFor="register-confirm-password" className="text-[11px] font-semibold text-[#555] uppercase tracking-wide">Confirm Password</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(196,167,254,0.7)] group-focus-within:text-[#9333ea] transition-colors" />
            <input
              id="register-confirm-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={isLoading}
              className={`w-full h-[56px] md:h-[52px] pl-12 pr-12 rounded-2xl border bg-white transition-all duration-200 outline-none text-[16px] md:text-[14px] font-medium text-[#111114] placeholder:text-[#bbb] disabled:opacity-60 ${
                confirmPassword ? '' : 'border-[rgba(216,180,254,0.4)] focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)]'
              }`}
              style={
                confirmPassword
                  ? confirmPassword === password
                    ? { borderColor: 'rgba(16,185,129,0.5)', boxShadow: '0 0 0 4px rgba(16,185,129,0.08)' }
                    : { borderColor: 'rgba(239,68,68,0.5)', boxShadow: '0 0 0 4px rgba(239,68,68,0.08)' }
                  : undefined
              }
            />
            {confirmPassword && (
              confirmPassword === password
                ? <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                : <XIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
            )}
          </div>
          {confirmPassword && confirmPassword !== password && (
            <p className="text-[11px] text-red-500">Passwords don't match.</p>
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
          <p role="alert" className="text-amber-700 text-[12px] font-semibold text-center bg-amber-50 py-3 rounded-xl border border-amber-100">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-[56px] md:h-[52px] rounded-full text-[13px] font-black uppercase tracking-widest active:scale-[0.98] flex items-center justify-center gap-3 mt-1 border-none shadow-none transition-all duration-300 bg-gradient-to-br from-[#d8b4fe] to-[#9368ee] text-white"
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
  const prefersReducedMotion = useReducedMotion();

  // Two different scrollers: on mobile the document scrolls, on desktop only
  // the right-hand form column does (it's the lg:overflow-y-auto pane).
  const formPaneRef = useRef(null);
  const { scrollY } = useScroll();
  const { scrollYProgress: paneProgress } = useScroll({ container: formPaneRef });

  // Mobile: photo lags behind the page (~0.8x) while the headline dissolves
  // under the rising sheet.
  const heroY = useTransform(scrollY, [0, 400], [0, 80]);
  const heroTextY = useTransform(scrollY, [0, 240], [0, -36]);
  const heroTextOpacity = useTransform(scrollY, [0, 170], [1, 0]);

  // Desktop: the sticky photo drifts and swells slightly as the form scrolls.
  const paneY = useTransform(paneProgress, [0, 1], [0, -24]);
  const paneScale = useTransform(paneProgress, [0, 1], [1, 1.1]);

  const heroMotion = prefersReducedMotion ? undefined : { y: heroY };
  const heroTextMotion = prefersReducedMotion ? undefined : { y: heroTextY, opacity: heroTextOpacity };
  const paneMotion = prefersReducedMotion ? undefined : { y: paneY, scale: paneScale };

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen font-sans bg-[#f8f7fb]">
      <header className="sticky top-0 z-40 border-b border-[#e5e5ea] bg-white">
        <div className="mx-auto relative flex h-[56px] md:h-[60px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Back to store — icon-only on mobile so it never crowds the logo */}
          <button
            onClick={() => router.push('/')}
            aria-label="Back to store"
            className="group shrink-0 flex items-center gap-2 h-[38px] px-3 sm:px-4 rounded-full border border-[#e5e5ea] bg-white text-[12px] font-semibold text-[#2a2a31] hover:bg-[#f3f3f5] hover:border-[#c8c8cf] transition-colors"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Back to store</span>
          </button>

          {/* Brand lockup — same proportions as the main site header */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-[10px] transition-opacity hover:opacity-80 active:opacity-60"
          >
            <Image
              src="/Adobe Express - file (5).png"
              alt="Naya Lumière"
              width={28}
              height={28}
              className="w-7 h-7 object-contain shrink-0"
              priority
            />
            <div className="flex flex-col leading-tight font-semibold tracking-[0.06em] text-[#111114]">
              <span className="text-[15px] md:text-[16px] leading-none">NAYA LUMIÈRE</span>
              <span className="text-[9px] tracking-[0.32em] text-[#5a5a64] uppercase mt-[2px] leading-none">
                COSMETICS
              </span>
            </div>
          </Link>

          {/* Trust cue — balances the row and reassures on a password screen */}
          <div className="shrink-0 hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-[#8a8a93]">
            <ShieldCheck size={13} className="text-emerald-500" />
            Secure sign-in
          </div>
          <div className="sm:hidden w-[38px]" aria-hidden="true" />
        </div>
      </header>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-60px)]">
        <div className="hidden lg:flex lg:w-1/2 xl:w-[52%] h-[calc(100vh-60px)] sticky top-[60px] flex-col relative overflow-hidden">
          <motion.div className="absolute inset-0 will-change-transform" style={paneMotion}>
            <Image
              src="/kimia-kazemi-u93nTfWqR9w-unsplash.jpg"
              alt="Naya Lumière Cosmetics"
              fill
              className="object-cover object-center"
              priority
            />
          </motion.div>
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

        <div className="lg:hidden relative h-[30vh] min-h-[190px] max-h-[260px] overflow-hidden flex-shrink-0">
          {/* Bleeds 90px past the top and bottom so the parallax shift never
              exposes an edge. */}
          <motion.div
            className="absolute inset-x-0 -top-[90px] h-[calc(100%+180px)] will-change-transform"
            style={heroMotion}
          >
            <Image
              src="/kimia-kazemi-u93nTfWqR9w-unsplash.jpg"
              alt="Naya Lumière Cosmetics"
              fill
              className="object-cover object-center"
              priority
            />
          </motion.div>
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(26,8,56,0.45) 0%, rgba(59,7,100,0.80) 100%)' }}
          />
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 px-6 pb-8 will-change-transform"
            style={heroTextMotion}
          >
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
          </motion.div>
        </div>

        <div
          ref={formPaneRef}
          className="relative z-10 -mt-7 rounded-t-[28px] shadow-[0_-8px_30px_rgba(26,8,56,0.16)] lg:mt-0 lg:rounded-none lg:shadow-none flex-1 lg:w-1/2 xl:w-[48%] lg:min-h-0 lg:h-[calc(100vh-60px)] lg:overflow-y-auto bg-[#ffffff] flex flex-col"
        >
          {/* Sheet grabber — native-app cue, mobile only */}
          <div className="lg:hidden flex justify-center pt-2.5 pb-1" aria-hidden="true">
            <div className="h-1 w-10 rounded-full bg-[#e5e0ec]" />
          </div>

          <div className="flex-1 flex items-start lg:items-center justify-center px-5 sm:px-6 pt-4 pb-6 lg:py-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[420px]"
            >
              <div className="text-center mb-5">
                <h2 className="text-[26px] md:text-[32px] font-black text-[#111114] leading-tight tracking-tight">
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
                {/* iOS-style segmented control — 44px tall so it's a comfortable tap target */}
                <TabsList className="grid grid-cols-2 w-full h-11 p-1 mb-5 rounded-full border-0 bg-[#f3f0f9] gap-1">
                  <TabsTrigger
                    value="login"
                    className="h-full rounded-full bg-transparent border-0 text-[13px] font-semibold text-[#8a8a93] shadow-none transition-colors duration-200 data-[state=active]:bg-white data-[state=active]:text-[#111114] data-[state=active]:shadow-[0_1px_4px_rgba(26,8,56,0.12)]"
                  >
                    Sign in
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="h-full rounded-full bg-transparent border-0 text-[13px] font-semibold text-[#8a8a93] shadow-none transition-colors duration-200 data-[state=active]:bg-white data-[state=active]:text-[#111114] data-[state=active]:shadow-[0_1px_4px_rgba(26,8,56,0.12)]"
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

          <div
            className="px-6 pt-2 pb-4 lg:py-6 text-center"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <p className="text-[10px] font-medium text-[#bbb]">
              © 2026 Naya Lumière Cosmetics · UAE
            </p>
          </div>
        </div>
      </div>
    </div>
    </MotionConfig>
  );
}
