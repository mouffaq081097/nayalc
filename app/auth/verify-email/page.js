'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, XCircle, Clock, Loader2, ArrowRight, MailOpen } from 'lucide-react';

const ERROR_MESSAGES = {
  expired:        'This verification link has expired. Please request a new one.',
  invalid_token:  'This verification link is invalid. Please request a new one.',
  user_not_found: 'Account not found. Please register again.',
  missing_token:  'No verification token provided.',
};

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const success = searchParams.get('success');
  const error   = searchParams.get('error');
  const emailParam = searchParams.get('email') || '';

  const [resendEmail, setResendEmail] = useState(emailParam);
  const [resending, setResending]     = useState(false);
  const [resendMsg, setResendMsg]     = useState('');

  // Auto-redirect to login after successful verification
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => router.push('/auth'), 3500);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const handleResend = async () => {
    if (!resendEmail.trim()) return;
    setResending(true);
    setResendMsg('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });
      const data = await res.json();
      setResendMsg(data.message || 'Email sent.');
    } catch {
      setResendMsg('Something went wrong. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const glass = {
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(216,180,254,0.35)',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 40px rgba(147,51,234,0.10)',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#fdf8ff' }}>
      {/* Aura orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full blur-[100px]" style={{ background: 'rgba(196,167,254,0.18)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full blur-[90px]"  style={{ background: 'rgba(216,180,254,0.12)' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/Adobe Express - file (5).png" alt="Naya Lumière" width={40} height={40} className="object-contain" />
            <div className="text-left leading-tight">
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', color: '#3b0764', textTransform: 'uppercase' }}>NAYA</div>
              <div style={{ fontSize: 11, fontStyle: 'italic', fontFamily: "Georgia,serif", color: '#6b21a8' }}>Lumière Cosmetics</div>
            </div>
          </Link>
        </div>

        <div className="rounded-3xl p-8 text-center space-y-6" style={glass}>

          {/* ── Success ── */}
          {success && (
            <>
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(22,163,74,0.10)' }}>
                  <CheckCircle size={36} className="text-green-500" />
                </div>
              </div>
              <div>
                <h1 className="text-[22px] font-black text-[#3b0764]">Email verified!</h1>
                <p className="text-[13px] text-[rgba(59,7,100,0.55)] mt-2">Your account is now active. Redirecting you to sign in…</p>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[rgba(59,7,100,0.35)]">
                <Loader2 size={12} className="animate-spin" /> Redirecting in a moment…
              </div>
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[13px] font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#9333ea,#db2777)' }}
              >
                Sign in now <ArrowRight size={13} />
              </Link>
            </>
          )}

          {/* ── Error ── */}
          {error && (
            <>
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.08)' }}>
                  {error === 'expired'
                    ? <Clock size={34} className="text-amber-500" />
                    : <XCircle size={34} className="text-red-500" />
                  }
                </div>
              </div>
              <div>
                <h1 className="text-[20px] font-black text-[#3b0764]">
                  {error === 'expired' ? 'Link expired' : 'Verification failed'}
                </h1>
                <p className="text-[13px] text-[rgba(59,7,100,0.55)] mt-2">
                  {ERROR_MESSAGES[error] || 'Something went wrong. Please try again.'}
                </p>
              </div>

              {/* Resend form */}
              <div className="text-left space-y-2 pt-2">
                <label className="text-[11px] font-semibold text-[rgba(59,7,100,0.6)] uppercase tracking-wide">
                  Send a new verification link
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={e => setResendEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 px-3 py-2.5 text-[13px] rounded-xl border focus:outline-none focus:border-purple-300"
                    style={{ borderColor: 'rgba(216,180,254,0.5)' }}
                  />
                  <button
                    onClick={handleResend}
                    disabled={resending || !resendEmail.trim()}
                    className="px-4 py-2.5 rounded-xl text-[12px] font-bold text-white disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#9333ea,#db2777)' }}
                  >
                    {resending ? <Loader2 size={13} className="animate-spin" /> : 'Send'}
                  </button>
                </div>
                {resendMsg && <p className="text-[12px] text-green-600">{resendMsg}</p>}
              </div>
            </>
          )}

          {/* ── Pending (no params = navigated directly) ── */}
          {!success && !error && (
            <>
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(147,51,234,0.08)' }}>
                  <MailOpen size={32} style={{ color: '#9333ea' }} />
                </div>
              </div>
              <div>
                <h1 className="text-[20px] font-black text-[#3b0764]">Check your email</h1>
                <p className="text-[13px] text-[rgba(59,7,100,0.55)] mt-2">
                  We sent a verification link to your email address. It expires in 24 hours.
                </p>
              </div>
              <div className="text-left space-y-2 pt-1">
                <label className="text-[11px] font-semibold text-[rgba(59,7,100,0.6)] uppercase tracking-wide">
                  Didn't receive it? Resend
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={e => setResendEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 px-3 py-2.5 text-[13px] rounded-xl border focus:outline-none focus:border-purple-300"
                    style={{ borderColor: 'rgba(216,180,254,0.5)' }}
                  />
                  <button
                    onClick={handleResend}
                    disabled={resending || !resendEmail.trim()}
                    className="px-4 py-2.5 rounded-xl text-[12px] font-bold text-white disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#9333ea,#db2777)' }}
                  >
                    {resending ? <Loader2 size={13} className="animate-spin" /> : 'Resend'}
                  </button>
                </div>
                {resendMsg && <p className="text-[12px] text-green-600">{resendMsg}</p>}
              </div>
            </>
          )}

          <p className="text-[11px] text-[rgba(59,7,100,0.30)] pt-2">
            <Link href="/auth" className="hover:text-purple-500 transition-colors">← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fdf8ff' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: '#9333ea' }} />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
