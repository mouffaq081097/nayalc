'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { MailOpen, X, Loader2 } from 'lucide-react';

const DISMISS_KEY = 'naya_verify_banner_dismissed';

/**
 * Soft-verification nudge. Registration no longer blocks on a verified email —
 * people shop and check out straight away — so this is the reminder that keeps
 * verification happening without standing in front of the purchase.
 */
export default function VerifyEmailBanner() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const needsVerification =
    status === 'authenticated' && session?.user?.emailVerified === false;

  // Never interrupt the checkout run.
  const onQuietPage = pathname === '/checkout' || pathname.startsWith('/admin');

  if (!needsVerification || dismissed || onQuietPage) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {}
  };

  const resend = async () => {
    setSending(true);
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email }),
      });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      role="status"
      className="relative z-30 flex items-center justify-center gap-3 px-4 py-2.5 text-center"
      style={{ background: 'rgba(248,240,255,0.95)', borderBottom: '1px solid rgba(216,180,254,0.45)' }}
    >
      <MailOpen size={15} className="shrink-0" style={{ color: '#9333ea' }} />
      <p className="text-[12px] font-medium" style={{ color: '#3b0764' }}>
        {sent ? (
          <>Verification email sent to <span className="font-semibold">{session.user.email}</span>.</>
        ) : (
          <>
            Please verify your email to secure your account.{' '}
            <button
              type="button"
              onClick={resend}
              disabled={sending}
              className="font-semibold underline underline-offset-2 disabled:opacity-50"
              style={{ color: '#9333ea' }}
            >
              {sending ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 size={11} className="animate-spin" /> Sending…
                </span>
              ) : (
                'Resend link'
              )}
            </button>
          </>
        )}
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors hover:bg-[rgba(147,51,234,0.08)]"
        style={{ color: 'rgba(59,7,100,0.45)' }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
