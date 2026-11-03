'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';

// Admin → Customers → Sign-in codes: every request for a sign-in code, what was
// sent and what the bot filters stopped (lib/emailCodeGuard.js).

const text = { color: 'var(--sp-text)' };
const secondary = { color: 'var(--sp-text-secondary)' };
const subdued = { color: 'var(--sp-text-subdued)' };

const OUTCOMES = {
  sent: { label: 'Sent', cls: 'sp-badge-success' },
  send_failed: { label: 'Send failed', cls: 'sp-badge-critical' },
  blocked_origin: { label: 'Blocked · not from our site', cls: 'sp-badge-neutral' },
  blocked_trap: { label: 'Blocked · bot trap', cls: 'sp-badge-neutral' },
  blocked_captcha: { label: 'Blocked · human check', cls: 'sp-badge-neutral' },
  blocked_dots: { label: 'Blocked · dotted Gmail', cls: 'sp-badge-neutral' },
  limit_mailbox: { label: 'Limited · same inbox', cls: 'sp-badge-warning' },
  limit_ip: { label: 'Limited · same IP', cls: 'sp-badge-warning' },
  limit_site: { label: 'Limited · daily cap', cls: 'sp-badge-warning' },
};
const isBlocked = (outcome) => outcome !== 'sent' && outcome !== 'send_failed';
const fmtTime = (value) => new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Dubai', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const Stat = ({ label, value, hint }) => (
  <div className="sp-card sp-card-pad">
    <p className="text-[12px]" style={secondary}>{label}</p>
    <p className="text-[22px] font-semibold mt-1" style={text}>{value}</p>
    {hint && <p className="text-[12px] mt-1" style={subdued}>{hint}</p>}
  </div>
);

export default function SignInCodesPage() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all | sent | blocked

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sign-in-codes?days=${days}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'The report could not be loaded.');
      setData(json); setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [days]);
  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => {
    const t = { sent: 0, blocked: 0, failed: 0 };
    for (const row of data?.daily || []) {
      if (row.outcome === 'sent') t.sent += row.count;
      else if (row.outcome === 'send_failed') t.failed += row.count;
      else t.blocked += row.count;
    }
    return t;
  }, [data]);

  const rows = (data?.latest || []).filter(r => filter === 'all' || (filter === 'sent' ? !isBlocked(r.outcome) : isBlocked(r.outcome)));

  return (
    <div className="space-y-4 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold" style={text}>Sign-in codes</h1>
          <p className="text-[13px]" style={secondary}>Every request for a sign-in code — what was emailed and what the bot filters stopped.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={days} onChange={e => setDays(Number(e.target.value))} className="sp-input cursor-pointer" aria-label="Period">
            {[1, 7, 30, 90].map(d => <option key={d} value={d}>Last {d === 1 ? '24 hours' : `${d} days`}</option>)}
          </select>
          <button type="button" onClick={load} disabled={loading} className="sp-btn sp-btn-secondary"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Refresh</button>
        </div>
      </div>

      {error && <div className="sp-card sp-card-pad text-[13px]" style={{ color: '#b42318' }}>{error}</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Codes emailed" value={totals.sent} hint={`Daily cap ${data.limits.sitePerDay}`} />
            <Stat label="Used to sign in" value={data.signedInMailboxes} hint="Inboxes with a verified account" />
            <Stat label="Blocked or limited" value={totals.blocked} hint="Nothing was emailed" />
            <Stat label="Failed to send" value={totals.failed} hint="Mail server errors" />
          </div>

          <div className="sp-card sp-card-pad flex items-start gap-3 text-[13px]" style={secondary}>
            <ShieldCheck size={18} className="shrink-0 mt-px" style={{ color: data.turnstile ? '#16a34a' : '#b45309' }} />
            <div className="space-y-1">
              <p style={text} className="font-medium">
                {data.turnstile ? 'Cloudflare human check is on.' : 'Cloudflare human check is off.'}
              </p>
              <p>
                Always on: requests must come from the website, a hidden trap field catches form bots, Gmail addresses padded with dots are refused,
                and each inbox gets at most {data.limits.mailboxPerHour} codes an hour ({data.limits.mailboxPerDay} a day), each IP {data.limits.ipPerHour} an hour ({data.limits.ipPerDay} a day).
              </p>
              {!data.turnstile && (
                <p>
                  To stop bots completely, create a free Turnstile widget at Cloudflare and set <code>NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> and <code>TURNSTILE_SECRET_KEY</code> in Vercel.
                </p>
              )}
            </div>
          </div>

          {(data.topMailboxes.length > 0 || data.topIps.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="sp-card sp-card-pad">
                <h2 className="sp-section-title mb-2">Inboxes asked for most</h2>
                {data.topMailboxes.length === 0 ? <p className="text-[13px]" style={subdued}>None repeated.</p> : (
                  <ul className="text-[13px] space-y-1">
                    {data.topMailboxes.map(m => <li key={m.mailbox} className="flex justify-between gap-3"><span className="truncate" style={text}>{m.mailbox}</span><span style={secondary}>{m.count}</span></li>)}
                  </ul>
                )}
              </div>
              <div className="sp-card sp-card-pad">
                <h2 className="sp-section-title mb-2">Busiest IP addresses</h2>
                {data.topIps.length === 0 ? <p className="text-[13px]" style={subdued}>None repeated.</p> : (
                  <ul className="text-[13px] space-y-1">
                    {data.topIps.map(m => <li key={m.ip} className="flex justify-between gap-3"><span className="truncate" style={text}>{m.ip}{m.country ? ` · ${m.country}` : ''}</span><span style={secondary}>{m.count}</span></li>)}
                  </ul>
                )}
              </div>
            </div>
          )}

          <div className="sp-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--sp-border)' }}>
              {[['all', 'All'], ['sent', 'Emailed'], ['blocked', 'Blocked']].map(([key, label]) => (
                <button key={key} type="button" onClick={() => setFilter(key)} className={`sp-btn ${filter === key ? 'sp-btn-primary' : 'sp-btn-secondary'}`} style={{ height: 30 }}>{label}</button>
              ))}
              <span className="ml-auto text-[12px]" style={subdued}>Latest {data.latest.length}</span>
            </div>
            {rows.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px]" style={subdued}>No requests in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="sp-table">
                  <thead><tr><th>Time (Dubai)</th><th>Email</th><th>Result</th><th>IP</th><th>Browser</th></tr></thead>
                  <tbody>
                    {rows.map(r => {
                      const badge = OUTCOMES[r.outcome] || { label: r.outcome, cls: 'sp-badge-neutral' };
                      return (
                        <tr key={r.id}>
                          <td className="whitespace-nowrap" style={secondary}>{fmtTime(r.created_at)}</td>
                          <td className="whitespace-nowrap">
                            <span style={text}>{r.email}</span>
                            {r.has_account && <span className="block text-[12px]" style={subdued}>Has an account</span>}
                          </td>
                          <td className="whitespace-nowrap"><span className={`sp-badge ${badge.cls}`}><span className="dot" />{badge.label}</span></td>
                          <td className="whitespace-nowrap" style={secondary}>{r.ip || '—'}{r.country ? ` · ${r.country}` : ''}</td>
                          <td className="max-w-[280px] truncate text-[12px]" style={subdued} title={r.user_agent || ''}>{r.user_agent || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
