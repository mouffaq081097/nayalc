'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Chrome, Facebook, Sparkles, ShieldCheck, Star } from 'lucide-react';
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
      <div className="space-y-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[11px] font-semibold text-[rgba(107,33,168,0.5)] hover:text-[#9333ea] transition-colors mb-2"
        >
          <ArrowLeft size={12} /> Back to Sign In
        </button>
        <h3 className="font-sans font-bold text-[22px] text-[#3b0764] leading-snug">
          Reset your{' '}
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, rgb(168,85,247), rgb(126,105,230))' }}>
            password
          </span>
        </h3>
        <p className="text-[13px] text-[rgba(107,33,168,0.55)] font-normal leading-relaxed">
          Enter your email and we'll send you a secure reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-[rgba(107,33,168,0.6)] uppercase tracking-wide">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(196,167,254,0.7)] group-focus-within:text-[#9333ea] transition-colors" />
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-[52px] pl-12 pr-5 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[14px] font-medium text-[#3b0764] placeholder:text-[rgba(107,33,168,0.3)]"
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

        <button
          type="submit"
          disabled={isLoading}
          className="cl-gradient-btn w-full h-[52px] rounded-full text-[13px] font-black uppercase tracking-widest active:scale-95 flex items-center justify-center gap-3 mt-1 border-none shadow-none"
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

function Login({ onForgotClick }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password, getSafeCallbackUrl());
    } catch (err) {
      setError(err.message);
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
      className="space-y-5"
    >
      <div className="space-y-2">
        <h3 className="font-sans font-bold text-[22px] text-[#3b0764] leading-snug">
          Welcome back to{' '}
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, rgb(168,85,247), rgb(126,105,230))' }}>
            Naya Lumière
          </span>
        </h3>
        <p className="text-[13px] text-[rgba(107,33,168,0.5)] font-normal leading-relaxed">
          Sign in to continue your luxury beauty journey.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="signin-email" className="text-[11px] font-semibold text-[rgba(107,33,168,0.6)] uppercase tracking-wide">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(196,167,254,0.7)] group-focus-within:text-[#9333ea] transition-colors" />
            <input
              id="signin-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-[52px] pl-12 pr-5 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[14px] font-medium text-[#3b0764] placeholder:text-[rgba(107,33,168,0.3)]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="signin-password" className="text-[11px] font-semibold text-[rgba(107,33,168,0.6)] uppercase tracking-wide">Password</label>
            <button
              type="button"
              onClick={onForgotClick}
              className="text-[11px] font-semibold text-[rgba(147,51,234,0.6)] hover:text-[#9333ea] transition-colors"
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
              className="w-full h-[52px] pl-12 pr-12 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[14px] font-medium text-[#3b0764] placeholder:text-[rgba(107,33,168,0.3)]"
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
          <label htmlFor="remember-me" className="text-[12px] font-medium text-[rgba(107,33,168,0.55)] group-hover:text-[#6b21a8] transition-colors cursor-pointer">
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

        <button
          type="submit"
          disabled={isLoading}
          className="cl-gradient-btn w-full h-[52px] rounded-full text-[13px] font-black uppercase tracking-widest active:scale-95 flex items-center justify-center gap-3 border-none shadow-none"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Sign In <ArrowRight size={14} /></>
          )}
        </button>
      </form>

      <div className="flex items-center gap-3 pt-1">
        <div className="flex-1 h-px bg-[rgba(216,180,254,0.3)]" />
        <span className="text-[11px] font-medium text-[rgba(147,51,234,0.4)]">or continue with</span>
        <div className="flex-1 h-px bg-[rgba(216,180,254,0.3)]" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="h-11 flex items-center justify-center gap-2 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white text-[12px] font-semibold text-[#6b21a8] hover:bg-[#fdf8ff] hover:border-[rgba(147,51,234,0.3)] transition-all">
          <Chrome size={15} className="text-[rgba(196,167,254,0.8)]" />
          Google
        </button>
        <button className="h-11 flex items-center justify-center gap-2 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white text-[12px] font-semibold text-[#6b21a8] hover:bg-[#fdf8ff] hover:border-[rgba(147,51,234,0.3)] transition-all">
          <Facebook size={15} className="text-[rgba(196,167,254,0.8)]" />
          Facebook
        </button>
      </div>
    </motion.div>
  );
}

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const autoUsername = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(1000 + Math.random() * 9000)}`;
      await register(autoUsername, email, password, firstName, lastName, getSafeCallbackUrl());
    } catch (err) {
      setError(err.message);
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
      className="space-y-5"
    >
      <div className="space-y-2">
        <h3 className="font-sans font-bold text-[22px] text-[#3b0764] leading-snug">
          Create your{' '}
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, rgb(168,85,247), rgb(126,105,230))' }}>
            account
          </span>
        </h3>
        <p className="text-[13px] text-[rgba(107,33,168,0.5)] font-normal leading-relaxed">
          Join the world of clinical botanical luxury.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label htmlFor="register-firstname" className="text-[11px] font-semibold text-[rgba(107,33,168,0.6)] uppercase tracking-wide">First Name</label>
            <input
              id="register-firstname"
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full h-[52px] px-4 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[14px] font-medium text-[#3b0764] placeholder:text-[rgba(107,33,168,0.3)]"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="register-lastname" className="text-[11px] font-semibold text-[rgba(107,33,168,0.6)] uppercase tracking-wide">Last Name</label>
            <input
              id="register-lastname"
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full h-[52px] px-4 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[14px] font-medium text-[#3b0764] placeholder:text-[rgba(107,33,168,0.3)]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="register-email" className="text-[11px] font-semibold text-[rgba(107,33,168,0.6)] uppercase tracking-wide">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(196,167,254,0.7)] group-focus-within:text-[#9333ea] transition-colors" />
            <input
              id="register-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-[52px] pl-12 pr-5 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[14px] font-medium text-[#3b0764] placeholder:text-[rgba(107,33,168,0.3)]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="register-password" className="text-[11px] font-semibold text-[rgba(107,33,168,0.6)] uppercase tracking-wide">Password</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(196,167,254,0.7)] group-focus-within:text-[#9333ea] transition-colors" />
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-[52px] pl-12 pr-12 rounded-2xl border border-[rgba(216,180,254,0.4)] bg-white focus:border-[rgba(147,51,234,0.4)] focus:ring-4 focus:ring-[rgba(196,167,254,0.12)] transition-all duration-200 outline-none text-[14px] font-medium text-[#3b0764] placeholder:text-[rgba(107,33,168,0.3)]"
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

        {error && (
          <p className="text-amber-700 text-[12px] font-semibold text-center bg-amber-50 py-3 rounded-xl border border-amber-100">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="cl-gradient-btn w-full h-[52px] rounded-full text-[13px] font-black uppercase tracking-widest active:scale-95 flex items-center justify-center gap-3 mt-1 border-none shadow-none"
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



export default function AuthPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState('login');

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans">

      {/* ═══════════════════════════════════════
          LEFT PANEL — Image Hero (desktop only)
          ═══════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[52%] h-screen sticky top-0 flex-col relative overflow-hidden">
        {/* Hero image — swap src for your provided photo */}
        <Image
          src="/kimia-kazemi-u93nTfWqR9w-unsplash.jpg"
          alt="Naya Lumière Cosmetics"
          fill
          className="object-cover object-center"
          priority
        />

        {/* Deep overlay — rich purple/indigo gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(160deg, rgba(26,8,56,0.55) 0%, rgba(59,7,100,0.72) 45%, rgba(26,8,56,0.90) 100%)',
          }}
        />

        {/* Lavender aura orb — bottom right */}
        <div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(216,180,254,0.18) 0%, transparent 70%)', transform: 'translate(30%, 30%)' }}
        />

        {/* Top bar: logo + back to store */}
        <div className="relative z-10 flex items-center justify-end p-8 xl:p-10">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-[11px] font-semibold text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={12} />
            Back to store
          </button>
        </div>

        {/* Bottom content: headline + features */}
        <div className="relative z-10 mt-auto p-8 xl:p-10 pb-12 space-y-8">
          {/* Display headline — uses Cormorant Garamond (display font) */}
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

          {/* Feature badges */}
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

      {/* ═══════════════════════════════════════
          MOBILE HERO — Image on top (mobile only)
          ═══════════════════════════════════════ */}
      <div className="lg:hidden relative h-[46vh] overflow-hidden flex-shrink-0">
        <Image
          src="/kimia-kazemi-u93nTfWqR9w-unsplash.jpg"
          alt="Naya Lumière Cosmetics"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(26,8,56,0.45) 0%, rgba(59,7,100,0.80) 100%)' }}
        />
        {/* Mobile logo centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 px-6 pt-8">
          <h1
            className="text-[40px] md:text-[48px] leading-[1.1] text-white"
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgba(216,180,254,0.85)] mt-4 font-sans">
            Your Beauty Sanctuary
          </p>
        </div>
        {/* Mobile: back to store */}
        <button
          onClick={() => router.push('/')}
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 text-[11px] font-semibold text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft size={12} />
          Back
        </button>
      </div>

      {/* ═══════════════════════════════════════
          RIGHT PANEL — Form
          ═══════════════════════════════════════ */}
      <div className="flex-1 lg:w-1/2 xl:w-[48%] min-h-screen lg:min-h-0 lg:h-screen lg:overflow-y-auto bg-[#fdf8ff] flex flex-col">

        {/* Desktop: back to store (top-right) */}
        <div className="hidden lg:flex items-center justify-end px-10 xl:px-14 pt-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-[11px] font-semibold text-[rgba(107,33,168,0.45)] hover:text-[#9333ea] transition-colors"
          >
            ← Back to store
          </button>
        </div>

        {/* Form centered vertically */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:py-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[420px]"
          >
            {/* Tabs */}
            <Tabs
              value={authMode === 'forgot-password' ? 'login' : authMode}
              onValueChange={setAuthMode}
              className="w-full"
            >
              <TabsList className="flex bg-white border border-[rgba(216,180,254,0.35)] rounded-full p-1 mb-8 shadow-sm">
                <TabsTrigger
                  value="login"
                  className="flex-1 py-2.5 rounded-full text-[12px] font-bold transition-all data-[state=active]:![background:var(--cl-gradient)] data-[state=active]:!text-white data-[state=active]:shadow-[0_4px_14px_rgba(147,104,236,0.35)] text-[rgba(107,33,168,0.45)]"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="flex-1 py-2.5 rounded-full text-[12px] font-bold transition-all data-[state=active]:![background:var(--cl-gradient)] data-[state=active]:!text-white data-[state=active]:shadow-[0_4px_14px_rgba(147,104,236,0.35)] text-[rgba(107,33,168,0.45)]"
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

        {/* Footer */}
        <div className="px-6 py-6 text-center">
          <p className="text-[10px] font-medium text-[rgba(107,33,168,0.3)]">
            © 2026 Naya Lumière Cosmetics · UAE
          </p>
        </div>
      </div>
    </div>
  );
}
