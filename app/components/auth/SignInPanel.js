'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useLocale, useT } from '../../context/LocaleContext';

/**
 * Sign in or create account (after Shopify), shown in the sign-in pop-up
 * (SignInContext) and on /auth: email first. We email a
 * 6-digit code (POST /api/auth/email-code) and the code signs the customer in
 * through the 'email-code' provider, creating the account the first time — no
 * password, no separate register form. Google / Apple sit above when configured;
 * "Sign in with password" stays for customers who prefer it.
 */

// Mirrors the server-side provider gating in lib/auth.js — a provider without
// credentials configured must not render a button that goes nowhere.
const SOCIAL_PROVIDERS = {
  google: process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true',
  apple: process.env.NEXT_PUBLIC_APPLE_AUTH_ENABLED === 'true',
};

const RESEND_AFTER_S = 30;
// English keys for t() (lib/i18n/ar.js)
const CODE_ERRORS = {
  CODE_WRONG: 'That code isn’t right. Check the email and try again.',
  CODE_EXPIRED: 'That code has expired. Send a new one.',
  CODE_LOCKED: 'Too many wrong tries. Send a new code.',
  ACCOUNT_SUSPENDED: 'This account is suspended. Please contact us.',
};

// Only same-site paths, never //evil.com
export const safePath = (path) => (typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : null);

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111114]/30';
const field = 'h-[52px] w-full rounded-xl border border-[#dedede] bg-white px-4 text-[16px] text-[#111114] placeholder:text-[#707070] focus:border-[#111114] focus:outline-none focus:ring-1 focus:ring-[#111114] disabled:opacity-60 lg:text-[15px]';
const primary = `flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#5b35ec] text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 ${focusRing}`;
const textLink = `text-[14px] text-[#111114] underline underline-offset-4 hover:opacity-70 ${focusRing}`;

const Alert = ({ children, tone = 'error' }) => (children ? (
  <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl px-4 py-3 text-[13.5px] ${tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
    {children}
  </p>
) : null);

function SocialButtons({ callbackUrl }) {
  const { loginWithProvider } = useAuth();
  const t = useT();
  const [pending, setPending] = useState(null);
  const providers = [
    { id: 'google', label: 'Continue with Google', icon: <FcGoogle size={19} />, enabled: SOCIAL_PROVIDERS.google },
    { id: 'apple', label: 'Continue with Apple', icon: <FaApple size={19} color="#111114" />, enabled: SOCIAL_PROVIDERS.apple },
  ].filter(p => p.enabled);
  if (providers.length === 0) return null;

  return (
    <>
      <div className="space-y-2.5">
        {providers.map(p => (
          <button
            key={p.id}
            type="button"
            disabled={pending !== null}
            onClick={() => { setPending(p.id); loginWithProvider(p.id, callbackUrl); }}
            className={`flex h-[52px] w-full items-center justify-center gap-3 rounded-xl border border-[#dedede] bg-white text-[15px] font-medium text-[#111114] transition-colors hover:bg-[#fafafa] disabled:opacity-60 ${focusRing}`}
          >
            {pending === p.id ? <Loader2 size={17} className="animate-spin" /> : p.icon}
            {t(p.label)}
          </button>
        ))}
      </div>
      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#dedede]" />
        <span className="text-[13px] text-[#707070]">{t('OR')}</span>
        <div className="h-px flex-1 bg-[#dedede]" />
      </div>
    </>
  );
}

/** Step 1: email (+ news opt-in) → a code is sent */
function EmailStep({ email, setEmail, marketing, setMarketing, onSent, onPassword, callbackUrl }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef(null);
  useEffect(() => { if (window.matchMedia('(min-width: 1024px)').matches) ref.current?.focus(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, marketing }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'We couldn’t send the code. Please try again.');
      onSent();
    } catch (err) {
      setError(t(err.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SocialButtons callbackUrl={callbackUrl} />
      <form onSubmit={submit} className="space-y-4">
        <label htmlFor="auth-email" className="sr-only">{t('Email')}</label>
        <div className="relative">
          <input
            ref={ref}
            id="auth-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder={t('Email')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={busy}
            className={`${field} pe-14`}
          />
          <button
            type="submit"
            disabled={busy || !email.trim()}
            aria-label={t('Continue')}
            className={`absolute end-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-[#111114] transition-colors hover:bg-black/5 disabled:opacity-40 ${focusRing}`}
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={20} className="flip-rtl" />}
          </button>
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-[15px] text-[#111114]">
          <input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} className="h-5 w-5 rounded accent-[#111114]" />
          {t('Email me with news and offers')}
        </label>

        <Alert>{error}</Alert>
      </form>

      <div className="mt-5 text-center">
        <button type="button" onClick={onPassword} className={textLink}>{t('Sign in with password instead')}</button>
      </div>
    </>
  );
}

/** Step 2: the 6-digit code; auto-submits on the sixth digit */
function CodeStep({ email, marketing, onChangeEmail, onSignedIn }) {
  const { t, rich } = useLocale();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [wait, setWait] = useState(RESEND_AFTER_S);
  const ref = useRef(null);

  useEffect(() => { ref.current?.focus(); }, []);
  useEffect(() => {
    if (wait <= 0) return undefined;
    const timer = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const verify = async (value) => {
    if (busy || value.length !== 6) return;
    setError('');
    setNotice('');
    setBusy(true);
    const result = await signIn('email-code', { redirect: false, email, code: value });
    if (result?.ok && !result.error) {
      onSignedIn();
      return;
    }
    setBusy(false);
    setCode('');
    setError(t(CODE_ERRORS[result?.error] || 'We couldn’t sign you in. Please try again.'));
    ref.current?.focus();
  };

  const resend = async () => {
    setError('');
    setNotice('');
    setWait(RESEND_AFTER_S);
    try {
      const res = await fetch('/api/auth/email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, marketing }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'We couldn’t send the code.');
      setNotice(t('A new code is on its way.'));
    } catch (err) {
      setError(t(err.message));
    }
  };

  return (
    <form onSubmit={e => { e.preventDefault(); verify(code); }} className="space-y-4">
      <p className="text-[15px] leading-relaxed text-[#5a5a64]">
        {rich('Sent to {email}', { email: <span className="font-medium text-[#111114]">{email}</span> })}{' '}
        <button type="button" onClick={onChangeEmail} className={textLink}>{t('Change')}</button>
      </p>

      <label htmlFor="auth-code" className="sr-only">{t('6-digit code')}</label>
      <input
        ref={ref}
        id="auth-code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        placeholder={t('6-digit code')}
        value={code}
        disabled={busy}
        onChange={e => {
          const next = e.target.value.replace(/\D/g, '').slice(0, 6);
          setCode(next);
          if (next.length === 6) verify(next);
        }}
        className={`latin ${field} text-center text-[22px] tracking-[0.5em] placeholder:text-[15px] placeholder:tracking-normal lg:text-[22px]`}
      />

      <Alert>{error}</Alert>
      <Alert tone="success">{notice}</Alert>

      <button type="submit" disabled={busy || code.length !== 6} className={primary}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : t('Sign in')}
      </button>

      <p className="text-center text-[14px] text-[#5a5a64]">
        {rich('Didn’t get it? Check your spam folder or {action}', {
          action: wait > 0
            ? <span className="tabular-nums">{t('resend in {n}s', { n: wait })}</span>
            : <button type="button" onClick={resend} className={textLink}>{t('send a new code')}</button>,
        })}
      </p>
    </form>
  );
}

/** Fallback: email + password, for customers who prefer it */
function PasswordStep({ email, setEmail, onBack, onForgot, onSignedIn }) {
  const t = useT();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await signIn('credentials', { redirect: false, email, password });
      if (result?.error) {
        throw new Error(result.error === 'ACCOUNT_SUSPENDED' ? CODE_ERRORS.ACCOUNT_SUSPENDED : 'Invalid email or password.');
      }
      onSignedIn();
    } catch (err) {
      setError(t(err.message));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <label htmlFor="pw-email" className="sr-only">{t('Email')}</label>
      <input id="pw-email" type="email" inputMode="email" autoComplete="email" required placeholder={t('Email')} value={email} onChange={e => setEmail(e.target.value)} disabled={busy} className={field} />
      <label htmlFor="pw-password" className="sr-only">{t('Password')}</label>
      <div className="relative">
        <input id="pw-password" type={show ? 'text' : 'password'} autoComplete="current-password" required placeholder={t('Password')} value={password} onChange={e => setPassword(e.target.value)} disabled={busy} className={`${field} pe-12`} />
        <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? t('Hide password') : t('Show password')} className={`absolute end-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-[#707070] hover:text-[#111114] ${focusRing}`}>
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <Alert>{error}</Alert>
      <button type="submit" disabled={busy} className={primary}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : t('Sign in')}
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className={textLink}>{t('Sign in with a code instead')}</button>
        <button type="button" onClick={onForgot} className={textLink}>{t('Forgot password?')}</button>
      </div>
    </form>
  );
}

function ForgotStep({ email, setEmail, onBack }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setMessage(t(data.message || 'Check your email for a reset link.'));
      else setError(t(data.error || 'Something went wrong. Please try again.'));
    } catch {
      setError(t('Something went wrong. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <label htmlFor="forgot-email" className="sr-only">{t('Email')}</label>
      <input id="forgot-email" type="email" inputMode="email" autoComplete="email" required placeholder={t('Email')} value={email} onChange={e => setEmail(e.target.value)} disabled={busy} className={field} />
      <Alert>{error}</Alert>
      <Alert tone="success">{message}</Alert>
      <button type="submit" disabled={busy} className={primary}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : t('Send reset link')}
      </button>
      <div className="text-center">
        <button type="button" onClick={onBack} className={textLink}>{t('Back to sign in')}</button>
      </div>
    </form>
  );
}

const TITLES = {
  email: ['Sign in or create account', 'Enter your email and we’ll send you a code.'],
  code: ['Enter code', null],
  password: ['Sign in with password', null],
  forgot: ['Reset your password', 'We’ll email you a link to choose a new one.'],
};

/**
 * The whole sign-in flow. `callbackUrl` is where Google / Apple return to;
 * `onSignedIn` runs after a code or password sign-in.
 */
export default function SignInPanel({ callbackUrl = '/', onSignedIn, titleId = 'auth-title' }) {
  const { t, rich } = useLocale();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [marketing, setMarketing] = useState(true);
  const [title, subtitle] = TITLES[step];

  return (
    <>
      <h2 id={titleId} className="text-[22px] font-semibold leading-tight text-[#111114]">{t(title)}</h2>
      {subtitle && <p className="mt-1.5 text-[15px] text-[#5a5a64]">{t(subtitle)}</p>}

      <div className="mt-6">
        {step === 'email' && (
          <EmailStep
            email={email} setEmail={setEmail}
            marketing={marketing} setMarketing={setMarketing}
            onSent={() => setStep('code')}
            onPassword={() => setStep('password')}
            callbackUrl={callbackUrl}
          />
        )}
        {step === 'code' && <CodeStep email={email.trim().toLowerCase()} marketing={marketing} onChangeEmail={() => setStep('email')} onSignedIn={onSignedIn} />}
        {step === 'password' && <PasswordStep email={email} setEmail={setEmail} onBack={() => setStep('email')} onForgot={() => setStep('forgot')} onSignedIn={onSignedIn} />}
        {step === 'forgot' && <ForgotStep email={email} setEmail={setEmail} onBack={() => setStep('password')} />}
      </div>

      <p className="mt-8 text-[13px] leading-relaxed text-[#707070]">
        {rich('By continuing, you agree to our {terms} and {privacy}.', {
          terms: <Link href="/terms" className="underline underline-offset-2 hover:text-[#111114]">{t('Terms of service')}</Link>,
          privacy: <Link href="/privacy" className="underline underline-offset-2 hover:text-[#111114]">{t('Privacy policy')}</Link>,
        })}
      </p>
    </>
  );
}
