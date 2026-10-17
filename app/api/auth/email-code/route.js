import { NextResponse } from 'next/server';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { sendLoginCodeEmail } from '@/lib/mail';
import { CODE_TTL_MINUTES, EMAIL_RE, createLoginCode, normalizeEmail } from '@/lib/emailLoginCodes';

// Step 1 of code sign-in: email the customer a 6-digit code. The same answer for
// every address, so it never tells anyone whether an account exists.
// { email, marketing? } → { ok: true }
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    const byIp = rateLimit(`email-code:ip:${clientIp(request)}`, { limit: 10, windowMs: 10 * 60_000 });
    const byEmail = rateLimit(`email-code:${email}`, { limit: 5, windowMs: 10 * 60_000 });
    if (!byIp.ok || !byEmail.ok) {
      const retryAfter = Math.max(byIp.retryAfter || 0, byEmail.retryAfter || 0);
      return NextResponse.json(
        { error: 'Too many codes requested. Please wait a few minutes and try again.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const code = await createLoginCode(email, { marketing: body.marketing === true });
    const sent = await sendLoginCodeEmail(email, code, CODE_TTL_MINUTES);
    if (!sent.success) {
      return NextResponse.json({ error: "We couldn't send the code. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Email code error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
