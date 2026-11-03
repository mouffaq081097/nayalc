import { NextResponse } from 'next/server';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { sendLoginCodeEmail } from '@/lib/mail';
import { CODE_TTL_MINUTES, EMAIL_RE, createLoginCode, normalizeEmail } from '@/lib/emailLoginCodes';
import { checkCodeRequest } from '@/lib/emailCodeGuard';

// Step 1 of code sign-in: email the customer a 6-digit code. The same answer for
// every address, so it never tells anyone whether an account exists.
// Bot protection and the request log: lib/emailCodeGuard.js.
// { email, marketing?, company? (hidden trap), turnstileToken? } → { ok: true }
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    const ip = clientIp(request);
    const byIp = rateLimit(`email-code:ip:${ip}`, { limit: 10, windowMs: 10 * 60_000 });
    const byEmail = rateLimit(`email-code:${email}`, { limit: 5, windowMs: 10 * 60_000 });
    if (!byIp.ok || !byEmail.ok) {
      const retryAfter = Math.max(byIp.retryAfter || 0, byEmail.retryAfter || 0);
      return NextResponse.json(
        { error: 'Too many codes requested. Please wait a few minutes and try again.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const guard = await checkCodeRequest(request, { email, body, ip });
    if (!guard.send) {
      return guard.silent
        ? NextResponse.json({ ok: true })
        : NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const code = await createLoginCode(email, { marketing: body.marketing === true });
    const sent = await sendLoginCodeEmail(email, code, CODE_TTL_MINUTES);
    await guard.log(sent.success ? 'sent' : 'send_failed');
    if (!sent.success) {
      return NextResponse.json({ error: "We couldn't send the code. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Email code error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
