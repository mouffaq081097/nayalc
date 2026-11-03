import db from './db.js';

/**
 * Stops bots using the sign-in form to send codes to other people.
 *
 * Bots were requesting sign-in codes for addresses from leaked lists, often
 * Gmail addresses padded with dots ("j.o.se.tro.nc.a.o@gmail.com" — Gmail
 * ignores dots, so it lands in the real person's inbox while looking like a
 * new address to a naive rate limit). The codes are useless to the bot (it
 * can't read the inbox) but every one is unsolicited mail from our domain,
 * which earns spam reports and hurts delivery of real order emails.
 *
 * checkCodeRequest() runs before a code is sent and logs every request in
 * email_code_requests (Admin → Customers → Sign-in codes):
 * - the request must come from our own pages (Origin header);
 * - the hidden "company" field must be empty (people never see it);
 * - Cloudflare Turnstile, when TURNSTILE_SECRET_KEY is set;
 * - Gmail addresses with 3+ dots are refused with a plain message;
 * - limits per mailbox (dots and +tags ignored), per IP and per day for the
 *   whole site, kept in the database so they hold across server instances.
 */

export const LIMITS = {
  mailboxPerHour: 3,
  mailboxPerDay: 6,
  ipPerHour: 8,
  ipPerDay: 25,
  sitePerDay: Number(process.env.SIGN_IN_CODES_PER_DAY) || 400,
};

export const EMAIL_CODE_GUARD_MIGRATION_SQL = `
  CREATE TABLE IF NOT EXISTS email_code_requests (
    id         BIGSERIAL PRIMARY KEY,
    email      TEXT NOT NULL,
    mailbox    TEXT NOT NULL,
    ip         TEXT,
    country    TEXT,
    user_agent TEXT,
    outcome    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS email_code_requests_mailbox_idx ON email_code_requests (mailbox, created_at DESC);
  CREATE INDEX IF NOT EXISTS email_code_requests_ip_idx ON email_code_requests (ip, created_at DESC);
  CREATE INDEX IF NOT EXISTS email_code_requests_created_idx ON email_code_requests (created_at DESC);
`;

let ready = null;
export function ensureEmailCodeRequestsTable() {
  ready ??= db.query(EMAIL_CODE_GUARD_MIGRATION_SQL).catch((error) => { ready = null; throw error; });
  return ready;
}

const GMAIL = new Set(['gmail.com', 'googlemail.com']);

/** The inbox an address really reaches: Gmail ignores dots, most providers ignore +tags. */
export function canonicalMailbox(email) {
  const [local = '', domain = ''] = String(email).toLowerCase().split('@');
  let name = local.split('+')[0];
  if (GMAIL.has(domain)) return `${name.replace(/\./g, '')}@gmail.com`;
  return `${name}@${domain}`;
}

/** A Gmail address padded with dots, the way list-spamming bots write them. */
export function isDottedGmail(email) {
  const [local = '', domain = ''] = String(email).toLowerCase().split('@');
  return GMAIL.has(domain) && (local.split('+')[0].match(/\./g) || []).length >= 3;
}

// Outcomes kept in the log; only 'sent' means an email went out
export const OUTCOME_LABELS = {
  sent: 'Sent',
  send_failed: 'Send failed',
  blocked_origin: 'Blocked · not from our site',
  blocked_trap: 'Blocked · bot filled hidden field',
  blocked_captcha: 'Blocked · failed human check',
  blocked_dots: 'Blocked · dotted Gmail',
  limit_mailbox: 'Limited · same inbox',
  limit_ip: 'Limited · same IP',
  limit_site: 'Limited · daily cap',
};

function sameSite(request) {
  const origin = request.headers.get('origin') || request.headers.get('referer');
  if (!origin) return false;
  try {
    const from = new URL(origin).host;
    const allowed = new Set([request.headers.get('host'), request.headers.get('x-forwarded-host')].filter(Boolean));
    try { allowed.add(new URL(process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || '').host); } catch { /* not set */ }
    return allowed.has(from) || allowed.has(from.replace(/^www\./, '')) || allowed.has(`www.${from}`);
  } catch {
    return false;
  }
}

async function passesTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not set up
  if (!token || typeof token !== 'string') return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, ...(ip && ip !== 'unknown' ? { remoteip: ip } : {}) }),
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.error('Turnstile check failed:', error);
    return true; // Cloudflare down: don't lock everyone out; the limits still apply
  }
}

const MESSAGES = {
  blocked_dots: 'Please type your Gmail address without the extra dots.',
  blocked_captcha: 'Please complete the check and try again.',
  limit: 'Too many codes requested. Please wait a while and try again.',
};

/**
 * Decides whether to send a code. Returns
 *   { send: true, log }                      — send it, then call log('sent' | 'send_failed')
 *   { send: false, status, error }           — answer with this error
 *   { send: false, silent: true }            — answer "ok" without sending (bots learn nothing)
 */
export async function checkCodeRequest(request, { email, body = {}, ip }) {
  await ensureEmailCodeRequestsTable();
  const mailbox = canonicalMailbox(email);
  const meta = {
    country: request.headers.get('x-vercel-ip-country') || null,
    userAgent: (request.headers.get('user-agent') || '').slice(0, 300) || null,
  };
  const log = (outcome) => db.query(
    'INSERT INTO email_code_requests (email, mailbox, ip, country, user_agent, outcome) VALUES ($1, $2, $3, $4, $5, $6)',
    [email, mailbox, ip, meta.country, meta.userAgent, outcome],
  ).catch((error) => console.error('Could not log sign-in code request:', error));

  if (!sameSite(request)) { await log('blocked_origin'); return { send: false, silent: true }; }
  if (body.company) { await log('blocked_trap'); return { send: false, silent: true }; }
  if (!(await passesTurnstile(body.turnstileToken, ip))) {
    await log('blocked_captcha');
    return { send: false, status: 400, error: MESSAGES.blocked_captcha };
  }
  if (isDottedGmail(email)) { await log('blocked_dots'); return { send: false, status: 400, error: MESSAGES.blocked_dots }; }

  const { rows: [counts] } = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE mailbox = $1 AND created_at > NOW() - INTERVAL '1 hour')::int  AS mailbox_hour,
       COUNT(*) FILTER (WHERE mailbox = $1)::int                                              AS mailbox_day,
       COUNT(*) FILTER (WHERE ip = $2 AND created_at > NOW() - INTERVAL '1 hour')::int       AS ip_hour,
       COUNT(*) FILTER (WHERE ip = $2)::int                                                   AS ip_day,
       COUNT(*)::int                                                                          AS site_day
     FROM email_code_requests
     WHERE outcome = 'sent' AND created_at > NOW() - INTERVAL '24 hours'`,
    [mailbox, ip],
  );
  const limited = counts.mailbox_hour >= LIMITS.mailboxPerHour || counts.mailbox_day >= LIMITS.mailboxPerDay ? 'limit_mailbox'
    : ip && ip !== 'unknown' && (counts.ip_hour >= LIMITS.ipPerHour || counts.ip_day >= LIMITS.ipPerDay) ? 'limit_ip'
      : counts.site_day >= LIMITS.sitePerDay ? 'limit_site'
        : null;
  if (limited) { await log(limited); return { send: false, status: 429, error: MESSAGES.limit }; }

  return { send: true, log };
}

/** Admin overview: totals per outcome per day and the latest requests. */
export async function codeRequestReport({ days = 7, limit = 200 } = {}) {
  await ensureEmailCodeRequestsTable();
  const [{ rows: daily }, { rows: latest }, { rows: topMailboxes }, { rows: topIps }, { rows: [signedIn] }] = await Promise.all([
    db.query(
      `SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'Asia/Dubai'), 'YYYY-MM-DD') AS day, outcome, COUNT(*)::int AS count
       FROM email_code_requests WHERE created_at > NOW() - make_interval(days => $1)
       GROUP BY 1, 2 ORDER BY 1 DESC`, [days],
    ),
    db.query(
      `SELECT r.id, r.email, r.ip, r.country, r.user_agent, r.outcome, r.created_at,
              EXISTS (SELECT 1 FROM users u WHERE LOWER(u.email) = r.email) AS has_account
       FROM email_code_requests r
       WHERE r.created_at > NOW() - make_interval(days => $1)
       ORDER BY r.created_at DESC LIMIT $2`, [days, limit],
    ),
    db.query(
      `SELECT mailbox, COUNT(*)::int AS count FROM email_code_requests
       WHERE created_at > NOW() - make_interval(days => $1)
       GROUP BY mailbox HAVING COUNT(*) > 1 ORDER BY count DESC LIMIT 10`, [days],
    ),
    db.query(
      `SELECT ip, MAX(country) AS country, COUNT(*)::int AS count FROM email_code_requests
       WHERE created_at > NOW() - make_interval(days => $1) AND ip IS NOT NULL
       GROUP BY ip HAVING COUNT(*) > 1 ORDER BY count DESC LIMIT 10`, [days],
    ),
    // Codes that were sent and then used to sign in — a real customer
    db.query(
      `SELECT COUNT(DISTINCT r.mailbox)::int AS count
       FROM email_code_requests r
       JOIN users u ON LOWER(u.email) = r.email AND u.email_verified = TRUE
       WHERE r.outcome = 'sent' AND r.created_at > NOW() - make_interval(days => $1)`, [days],
    ),
  ]);
  return {
    days, limits: LIMITS, turnstile: !!process.env.TURNSTILE_SECRET_KEY,
    daily, latest, topMailboxes, topIps, signedInMailboxes: signedIn?.count || 0,
  };
}
