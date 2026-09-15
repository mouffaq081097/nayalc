'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { AlertCircle, Banknote, CreditCard, ExternalLink, Info, Loader2, Mail, RefreshCw, Truck, X } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import PageLoader from '@/app/components/PageLoader';
import { EmptyState } from '../_components/IndexToolbar';
import { apiErrorMessage } from '../products/_components/productAdmin';
import { customerName, fmtDate, orderStatusBadge, timeAgo } from '../users/_components/customerAdmin';

const text = { color: 'var(--sp-text)' };
const secondary = { color: 'var(--sp-text-secondary)' };
const subdued = { color: 'var(--sp-text-subdued)' };

const METHODS = [
  { key: 'card', label: 'Card', provider: 'Paid through Stripe' },
  { key: 'tabby', label: 'Tabby', provider: 'Pay in 4 through Tabby' },
  { key: 'cashOnDelivery', label: 'Cash on delivery', provider: 'Collected by the courier' },
];
const KNOWN_METHODS = new Set(METHODS.map(m => m.key));

const TABS = [
  { id: 'stripe', label: 'Stripe', icon: CreditCard },
  { id: 'tabby', label: 'Tabby', icon: Banknote },
  { id: 'cod', label: 'Cash on delivery', icon: Truck },
];

const grouped = (value) => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtAed = (value) => `AED ${grouped(value)}`;
// Stripe amounts are in minor units (fils)
const fmtMoney = (minor, currency) => `${String(currency).toUpperCase()} ${grouped(Number(minor) / 100)}`;
const fmtStripeDate = (seconds) => fmtDate(seconds * 1000);

const TYPE_LABEL = { charge: 'Payment', payment: 'Payment', refund: 'Refund', payment_refund: 'Refund', payout: 'Payout', stripe_fee: 'Stripe fee', adjustment: 'Adjustment' };
const typeLabel = (type) => TYPE_LABEL[type] || String(type).replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());

const PAYOUT_BADGE = {
  paid: { label: 'Paid', cls: 'sp-badge-success' },
  pending: { label: 'Pending', cls: 'sp-badge-warning' },
  in_transit: { label: 'In transit', cls: 'sp-badge-info' },
  canceled: { label: 'Canceled', cls: 'sp-badge-neutral' },
  failed: { label: 'Failed', cls: 'sp-badge-critical' },
};

const TABBY_BADGE = {
  CREATED: { label: 'Created', cls: 'sp-badge-neutral' },
  AUTHORIZED: { label: 'Authorized', cls: 'sp-badge-info' },
  CLOSED: { label: 'Closed', cls: 'sp-badge-success' },
  REJECTED: { label: 'Rejected', cls: 'sp-badge-critical' },
  EXPIRED: { label: 'Expired', cls: 'sp-badge-neutral' },
};

function scheduleText(schedule) {
  if (!schedule) return { title: 'Not available', hint: null };
  const delay = schedule.delay_days ? `Payments become available ${schedule.delay_days} days after they're made.` : null;
  if (schedule.interval === 'manual') return { title: 'Manual', hint: `You choose when to pay out.${delay ? ` ${delay}` : ''}` };
  return { title: `Automatic · ${schedule.interval}`, hint: delay };
}

const StatCell = ({ label, value, hint, first }) => (
  <div className="px-5 py-4 flex-[1_0_auto]" style={first ? undefined : { borderLeft: '1px solid var(--sp-border)' }}>
    <p className="text-[12px] mb-2 whitespace-nowrap"><span className="sp-stat-label">{label}</span></p>
    <p className="text-[20px] font-semibold leading-none whitespace-nowrap" style={text}>{value}</p>
    <p className="text-[12px] mt-2 whitespace-nowrap" style={subdued}>{hint || ' '}</p>
  </div>
);

const Banner = ({ tone = 'info', children }) => {
  const tones = {
    info: { background: '#eaf4ff', border: '1px solid #b6d8ff', color: '#00527c' },
    warning: { background: '#fff4e5', border: '1px solid #ffd79d', color: '#5e4200' },
  };
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-[13px]" style={tones[tone]}>
      <Info size={16} className="shrink-0 mt-px" />
      <div className="flex-1">{children}</div>
    </div>
  );
};

const PanelError = ({ message, onRetry }) => (
  <div className="sp-card">
    <EmptyState
      icon={AlertCircle}
      title="This couldn't be loaded"
      description={message}
      action={<button type="button" onClick={onRetry} className="sp-btn sp-btn-secondary"><RefreshCw size={14} />Try again</button>}
    />
  </div>
);

const DetailRow = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 py-2 text-[13px]" style={{ borderBottom: '1px solid #f1f1f1' }}>
    <span style={secondary}>{label}</span>
    <span className="text-right" style={text}>{children}</span>
  </div>
);

// ── Stripe ─────────────────────────────────────────────────────────────────

const TransactionDrawer = ({ tx, onClose, onEmail, emailing }) => {
  const card = tx.source?.card;
  const billing = tx.source?.billing;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden />
      <aside className="fixed top-0 right-0 z-50 h-full w-full max-w-[420px] bg-white flex flex-col shadow-2xl" role="dialog" aria-label="Transaction details">
        <div className="flex items-start justify-between gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--sp-border)' }}>
          <div className="min-w-0">
            <p className="text-[12px]" style={subdued}>{typeLabel(tx.type)} · {fmtStripeDate(tx.created)}</p>
            <p className="text-[22px] font-semibold mt-0.5" style={text}>{fmtMoney(tx.amount, tx.currency)}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-[#f1f1f1] cursor-pointer" style={secondary} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div className="flex flex-wrap gap-1.5">
            <span className={`sp-badge ${tx.status === 'available' ? 'sp-badge-success' : 'sp-badge-warning'}`}>{tx.status === 'available' ? 'Available' : 'Pending'}</span>
            {tx.source?.refunded && <span className="sp-badge sp-badge-neutral">Refunded</span>}
            {!tx.source?.refunded && tx.source?.amount_refunded > 0 && <span className="sp-badge sp-badge-neutral">Partly refunded</span>}
            {tx.source?.disputed && <span className="sp-badge sp-badge-critical">Disputed</span>}
          </div>

          <section>
            <h3 className="sp-section-title mb-1">Amounts</h3>
            <DetailRow label="Gross">{fmtMoney(tx.amount, tx.currency)}</DetailRow>
            <DetailRow label="Stripe fee">−{fmtMoney(tx.fee, tx.currency)}</DetailRow>
            <DetailRow label="Net"><span className="font-semibold">{fmtMoney(tx.net, tx.currency)}</span></DetailRow>
            {tx.source?.amount_refunded > 0 && <DetailRow label="Refunded">{fmtMoney(tx.source.amount_refunded, tx.currency)}</DetailRow>}
            <DetailRow label={tx.status === 'available' ? 'Became available' : 'Available on'}>{fmtStripeDate(tx.available_on)}</DetailRow>
          </section>

          {(card || billing) && (
            <section>
              <h3 className="sp-section-title mb-1">Payment method</h3>
              {card && (
                <>
                  <DetailRow label="Card"><span className="capitalize">{card.brand}</span> •••• {card.last4}</DetailRow>
                  <DetailRow label="Expires">{String(card.exp_month).padStart(2, '0')}/{card.exp_year}</DetailRow>
                  {card.funding && <DetailRow label="Type"><span className="capitalize">{card.funding}</span></DetailRow>}
                  {card.country && <DetailRow label="Issued in">{card.country}</DetailRow>}
                </>
              )}
              {billing?.name && <DetailRow label="Cardholder">{billing.name}</DetailRow>}
              {billing?.email && <DetailRow label="Email"><span className="break-all">{billing.email}</span></DetailRow>}
            </section>
          )}

          <section>
            <h3 className="sp-section-title mb-1">References</h3>
            <DetailRow label="Order">
              {tx.order_id ? <Link href={`/admin/orders/${tx.order_id}`} className="sp-link">#{tx.order_id}</Link> : <span style={subdued}>Not linked to an order</span>}
            </DetailRow>
            {tx.description && <DetailRow label="Description">{tx.description}</DetailRow>}
            <DetailRow label="Transaction"><span className="font-mono text-[12px] break-all">{tx.id}</span></DetailRow>
          </section>
        </div>

        <div className="px-5 py-3 flex flex-wrap gap-2" style={{ borderTop: '1px solid var(--sp-border)' }}>
          {tx.source?.receipt_url && (
            <a href={tx.source.receipt_url} target="_blank" rel="noopener noreferrer" className="sp-btn sp-btn-secondary"><ExternalLink size={14} />Receipt</a>
          )}
          <button type="button" onClick={() => onEmail(tx)} disabled={emailing} className="sp-btn sp-btn-secondary">
            {emailing ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}Email details
          </button>
          <button type="button" onClick={onClose} className="sp-btn sp-btn-primary ml-auto">Close</button>
        </div>
      </aside>
    </>
  );
};

function StripePanel() {
  const { fetchWithAuth } = useAppContext();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState('transactions');
  const [selected, setSelected] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [payingCurrency, setPayingCurrency] = useState(null);
  const [emailingId, setEmailingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stripe/balance', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Stripe could not be reached.');
      setData(json);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <PanelError message={error} onRetry={() => { setError(''); setData(null); load(); }} />;
  if (!data) return <div className="py-16 flex justify-center"><Loader2 size={22} className="animate-spin" style={subdued} /></div>;

  const loadMore = async () => {
    const last = data.transactions[data.transactions.length - 1];
    if (!last) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/admin/stripe/balance?starting_after=${encodeURIComponent(last.id)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setData(prev => ({ ...prev, transactions: [...prev.transactions, ...json.transactions], has_more: json.has_more }));
    } catch (e) {
      toast.error(e.message || 'More transactions could not be loaded.');
    } finally {
      setLoadingMore(false);
    }
  };

  const payOut = async (balance) => {
    const amount = fmtMoney(balance.amount, balance.currency);
    const mode = data.livemode ? '' : ' This is a test-mode payout — no real money moves.';
    if (!window.confirm(`Pay out ${amount} to your bank account? Stripe usually takes a few business days to deliver it.${mode}`)) return;
    setPayingCurrency(balance.currency);
    try {
      const res = await fetchWithAuth('/api/admin/stripe/balance', { method: 'POST', body: JSON.stringify({ currency: balance.currency }) });
      const json = await res.json();
      toast.success(json.emailSent ? `Payout of ${amount} requested` : `Payout of ${amount} requested, but the notification email didn't send`);
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e, 'The payout could not be requested.'));
    } finally {
      setPayingCurrency(null);
    }
  };

  const emailTransaction = async (tx) => {
    setEmailingId(tx.id);
    try {
      await fetchWithAuth('/api/admin/stripe/transaction-email', { method: 'POST', body: JSON.stringify({ transactionId: tx.id }) });
      toast.success('Transaction details emailed to the finance contacts');
    } catch (e) {
      toast.error(apiErrorMessage(e, 'The email could not be sent.'));
    } finally {
      setEmailingId(null);
    }
  };

  const emailPayout = async (payout) => {
    setEmailingId(payout.id);
    try {
      await fetchWithAuth('/api/admin/stripe/payout-email', { method: 'POST', body: JSON.stringify({ payoutId: payout.id }) });
      toast.success('Payout details emailed to the finance contacts');
    } catch (e) {
      toast.error(apiErrorMessage(e, 'The email could not be sent.'));
    } finally {
      setEmailingId(null);
    }
  };

  const schedule = scheduleText(data.payout_schedule);
  const available = data.balance.available.length ? data.balance.available : [{ amount: 0, currency: 'aed' }];
  const pending = data.balance.pending.length ? data.balance.pending : [{ amount: 0, currency: 'aed' }];

  return (
    <div className="space-y-4">
      {!data.livemode && (
        <Banner tone="warning">
          <strong>Stripe is in test mode.</strong> These balances and payments are test data, not real money. Your live site may use different keys.
        </Banner>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="sp-card sp-card-pad">
          <p className="text-[12px]" style={secondary}>Available to pay out</p>
          {available.map(b => (
            <div key={b.currency} className="mt-1.5">
              <p className="text-[22px] font-semibold leading-tight" style={text}>{fmtMoney(b.amount, b.currency)}</p>
              <button
                type="button"
                onClick={() => payOut(b)}
                disabled={b.amount <= 0 || payingCurrency !== null}
                className="sp-btn sp-btn-primary mt-3"
              >
                {payingCurrency === b.currency ? <><Loader2 size={14} className="animate-spin" />Requesting…</> : <><Banknote size={14} />Pay out</>}
              </button>
            </div>
          ))}
        </div>
        <div className="sp-card sp-card-pad">
          <p className="text-[12px]" style={secondary}>Pending</p>
          {pending.map(b => (
            <p key={b.currency} className="text-[22px] font-semibold leading-tight mt-1.5" style={text}>{fmtMoney(b.amount, b.currency)}</p>
          ))}
          <p className="text-[12px] mt-3" style={subdued}>Recent payments still clearing. They move to available after Stripe&apos;s holding period.</p>
        </div>
        <div className="sp-card sp-card-pad">
          <p className="text-[12px]" style={secondary}>Payout schedule</p>
          <p className="text-[22px] font-semibold leading-tight mt-1.5 capitalize" style={text}>{schedule.title}</p>
          {schedule.hint && <p className="text-[12px] mt-3" style={subdued}>{schedule.hint}</p>}
        </div>
      </div>

      <div className="sp-card overflow-hidden">
        <div className="px-3 py-2 flex items-center gap-1" style={{ borderBottom: '1px solid var(--sp-border)' }}>
          {[['transactions', 'Transactions'], ['payouts', 'Payouts']].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              aria-pressed={view === id}
              className="h-8 px-3 rounded-lg text-[13px] font-medium cursor-pointer transition-colors hover:bg-[#f1f1f1]"
              style={view === id ? { background: '#ebebeb', color: 'var(--sp-text)' } : secondary}
            >
              {label}
            </button>
          ))}
        </div>

        {view === 'transactions' && (
          data.transactions.length === 0 ? (
            <EmptyState icon={CreditCard} title="No transactions yet" description="Card payments, refunds and fees will appear here." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Details</th>
                      <th>Order</th>
                      <th className="text-right">Gross</th>
                      <th className="text-right">Fee</th>
                      <th className="text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.map(tx => (
                      <tr key={tx.id} className="cursor-pointer" onClick={() => setSelected(tx)}>
                        <td className="whitespace-nowrap" style={secondary}>{fmtStripeDate(tx.created)}</td>
                        <td className="whitespace-nowrap">
                          {typeLabel(tx.type)}
                          {tx.status !== 'available' && <span className="block text-[12px]" style={subdued}>Pending</span>}
                        </td>
                        <td className="max-w-[260px]">
                          {(() => {
                            const card = tx.source?.card ? `${tx.source.card.brand} •••• ${tx.source.card.last4}` : null;
                            const who = tx.source?.billing?.name || tx.source?.billing?.email || tx.description;
                            return (
                              <>
                                <span className={`block truncate ${who ? '' : 'capitalize'}`} style={who || card ? text : subdued}>{who || card || '—'}</span>
                                {who && card && <span className="block text-[12px] capitalize whitespace-nowrap" style={subdued}>{card}</span>}
                              </>
                            );
                          })()}
                        </td>
                        <td className="whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          {tx.order_id ? <Link href={`/admin/orders/${tx.order_id}`} className="sp-link">#{tx.order_id}</Link> : <span style={subdued}>—</span>}
                        </td>
                        <td className="text-right whitespace-nowrap">{fmtMoney(tx.amount, tx.currency)}</td>
                        <td className="text-right whitespace-nowrap" style={subdued}>−{fmtMoney(tx.fee, tx.currency)}</td>
                        <td className="text-right whitespace-nowrap font-semibold">{fmtMoney(tx.net, tx.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between gap-3" style={{ borderTop: '1px solid var(--sp-border)' }}>
                <p className="text-[12px]" style={subdued}>Showing {data.transactions.length} transaction{data.transactions.length !== 1 ? 's' : ''}</p>
                {data.has_more && (
                  <button type="button" onClick={loadMore} disabled={loadingMore} className="sp-btn sp-btn-secondary">
                    {loadingMore ? <Loader2 size={14} className="animate-spin" /> : null}Load more
                  </button>
                )}
              </div>
            </>
          )
        )}

        {view === 'payouts' && (
          data.payouts.length === 0 ? (
            <EmptyState icon={Banknote} title="No payouts yet" description="Money you pay out to your bank account will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>Requested</th>
                    <th>Arrives</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th className="text-right">Amount</th>
                    <th className="w-[52px]" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {data.payouts.map(payout => {
                    const badge = PAYOUT_BADGE[payout.status] || { label: payout.status, cls: 'sp-badge-neutral' };
                    return (
                      <tr key={payout.id}>
                        <td className="whitespace-nowrap" style={secondary}>{fmtStripeDate(payout.created)}</td>
                        <td className="whitespace-nowrap" style={secondary}>{payout.arrival_date ? fmtStripeDate(payout.arrival_date) : '—'}</td>
                        <td className="whitespace-nowrap">
                          <span className={`sp-badge ${badge.cls}`}>{badge.label}</span>
                          {payout.failure_message && <span className="block text-[12px] mt-1" style={{ color: '#b42318' }}>{payout.failure_message}</span>}
                        </td>
                        <td className="whitespace-nowrap" style={secondary}>{payout.automatic ? 'Automatic' : 'Manual'}</td>
                        <td className="text-right whitespace-nowrap font-semibold">{fmtMoney(payout.amount, payout.currency)}</td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => emailPayout(payout)}
                            disabled={emailingId === payout.id}
                            title="Email payout details to the finance contacts"
                            aria-label="Email payout details"
                            className="p-1.5 rounded-md hover:bg-[#ebebeb] cursor-pointer"
                            style={secondary}
                          >
                            {emailingId === payout.id ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {selected && (
        <TransactionDrawer tx={selected} onClose={() => setSelected(null)} onEmail={emailTransaction} emailing={emailingId === selected.id} />
      )}
    </div>
  );
}

// ── Tabby ──────────────────────────────────────────────────────────────────

function TabbyPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/tabby/balance', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Tabby could not be reached.');
      setData(json);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <PanelError message={error} onRetry={() => { setError(''); setData(null); load(); }} />;
  if (!data) return <div className="py-16 flex justify-center"><Loader2 size={22} className="animate-spin" style={subdued} /></div>;

  return (
    <div className="space-y-4">
      <Banner>
        Tabby pays you out automatically under your merchant agreement. Its API doesn&apos;t provide balances or settlement reports, so check payouts in your Tabby merchant dashboard.
      </Banner>

      <div className="sp-card overflow-hidden">
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--sp-border)' }}>
          <h2 className="sp-section-title">Recent Tabby payments</h2>
        </div>
        {data.payments.length === 0 ? (
          <EmptyState icon={Banknote} title="No Tabby payments yet" description="Orders paid with Tabby will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Captured</th>
                  <th className="text-right">Refunded</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map(payment => {
                  const badge = TABBY_BADGE[payment.status] || { label: payment.status, cls: 'sp-badge-neutral' };
                  return (
                    <tr key={payment.id}>
                      <td className="whitespace-nowrap" style={secondary}>{fmtDate(payment.created_at)}</td>
                      <td className="max-w-[260px]">
                        <span className="block truncate" style={text}>{payment.buyer?.name || '—'}</span>
                        {payment.buyer?.email && <span className="block text-[12px] truncate" style={subdued}>{payment.buyer.email}</span>}
                      </td>
                      <td className="whitespace-nowrap">
                        <span className={`sp-badge ${badge.cls}`}>{badge.label}</span>
                        {payment.is_test && <span className="sp-badge sp-badge-warning ml-1.5">Test</span>}
                      </td>
                      <td className="text-right whitespace-nowrap font-semibold">{payment.currency} {grouped(payment.amount)}</td>
                      <td className="text-right whitespace-nowrap" style={secondary}>{payment.currency} {grouped(payment.captured)}</td>
                      <td className="text-right whitespace-nowrap" style={payment.refunded ? text : subdued}>{payment.currency} {grouped(payment.refunded)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cash on delivery ───────────────────────────────────────────────────────

function CashOnDeliveryPanel({ overview }) {
  const stats = overview.methods.find(m => m.method === 'cashOnDelivery');
  const orders = overview.cod_open;
  return (
    <div className="space-y-4">
      <Banner>
        The courier collects cash when an order is delivered. The store doesn&apos;t record collection separately, so delivered orders count as collected here.
      </Banner>

      <div className="sp-card overflow-hidden">
        <div className="flex overflow-x-auto no-scrollbar">
          <StatCell first label="Awaiting delivery" value={fmtAed(stats?.open_sales || 0)} hint={`${stats?.open_orders || 0} order${stats?.open_orders !== 1 ? 's' : ''} to collect`} />
          <StatCell label="Collected on delivery" value={fmtAed(stats?.delivered_sales || 0)} hint={`${stats?.delivered_orders || 0} delivered order${stats?.delivered_orders !== 1 ? 's' : ''}`} />
        </div>
      </div>

      <div className="sp-card overflow-hidden">
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--sp-border)' }}>
          <h2 className="sp-section-title">Orders to collect</h2>
          <p className="text-[12px] mt-0.5" style={subdued}>Oldest first, so the longest-waiting orders are at the top.</p>
        </div>
        {orders.length === 0 ? (
          <EmptyState icon={Truck} title="Nothing to collect" description="Every cash-on-delivery order has been delivered or cancelled." />
        ) : (
          <div className="overflow-x-auto">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Placed</th>
                  <th>Customer</th>
                  <th>City</th>
                  <th>Status</th>
                  <th className="text-right">Amount to collect</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const badge = orderStatusBadge(order.status);
                  return (
                    <tr key={order.id}>
                      <td className="whitespace-nowrap font-semibold"><Link href={`/admin/orders/${order.id}`} className="hover:underline" style={text}>#{order.id}</Link></td>
                      <td className="whitespace-nowrap" style={secondary}>
                        {fmtDate(order.created_at)}
                        <span className="block text-[12px]" style={subdued}>{timeAgo(order.created_at)}</span>
                      </td>
                      <td className="max-w-[240px]">
                        {order.customer_id ? (
                          <Link href={`/admin/users/${order.customer_id}`} className="block truncate hover:underline" style={text}>{customerName(order)}</Link>
                        ) : <span style={subdued}>Unknown customer</span>}
                        {order.customer_phone && <span className="block text-[12px]" style={subdued}>{order.customer_phone}</span>}
                      </td>
                      <td className="whitespace-nowrap" style={order.city ? secondary : subdued}>{order.city || '—'}</td>
                      <td className="whitespace-nowrap"><span className={`sp-badge ${badge.cls}`}>{badge.label}</span></td>
                      <td className="text-right whitespace-nowrap font-semibold">{fmtAed(order.total_amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('stripe');
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadOverview = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/payments/overview', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'The payments overview could not be loaded.');
      setOverview(json);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  if (!overview && !error) return <PageLoader />;

  const byMethod = new Map((overview?.methods || []).map(m => [m.method, m]));
  const otherMethods = (overview?.methods || []).filter(m => !KNOWN_METHODS.has(m.method));
  const otherSales = otherMethods.reduce((sum, m) => sum + m.sales, 0);
  const otherOrders = otherMethods.reduce((sum, m) => sum + m.orders, 0);

  const refresh = () => {
    loadOverview();
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold leading-tight" style={text}>Payments</h1>
          <p className="text-[13px] mt-0.5" style={subdued}>Money collected by card, Tabby and cash on delivery</p>
        </div>
        <button type="button" onClick={refresh} disabled={refreshing} className="sp-btn sp-btn-secondary self-start sm:self-auto">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle size={14} />{error}
        </div>
      )}

      {/* Sales by payment method, from the store's orders */}
      {overview && (
        <div className="sp-card overflow-hidden">
          <div className="flex overflow-x-auto no-scrollbar">
            {METHODS.map((method, index) => {
              const stats = byMethod.get(method.key);
              return (
                <StatCell
                  key={method.key}
                  first={index === 0}
                  label={method.label}
                  value={fmtAed(stats?.sales || 0)}
                  hint={`${stats?.orders || 0} order${stats?.orders !== 1 ? 's' : ''} · ${fmtAed(stats?.sales_30d || 0)} in 30 days`}
                />
              );
            })}
            {otherMethods.length > 0 && (
              <StatCell
                label={`Test orders (${otherMethods.map(m => m.method || 'unknown').join(', ')})`}
                value={fmtAed(otherSales)}
                hint={`${otherOrders} order${otherOrders !== 1 ? 's' : ''} · not a real payment method`}
              />
            )}
          </div>
          <p className="px-5 py-2 text-[12px]" style={{ ...subdued, borderTop: '1px solid var(--sp-border)', background: 'var(--sp-surface-sub)' }}>
            Order totals from your store, including VAT and delivery. Cancelled orders aren&apos;t counted.
          </p>
        </div>
      )}

      {/* Provider tabs */}
      <div className="flex gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`sp-btn text-[13px] ${tab === id ? 'sp-btn-secondary' : 'sp-btn-plain'}`}
          >
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {tab === 'stripe' && <StripePanel key={`stripe-${refreshKey}`} />}
      {tab === 'tabby' && <TabbyPanel key={`tabby-${refreshKey}`} />}
      {tab === 'cod' && overview && <CashOnDeliveryPanel overview={overview} />}
    </div>
  );
}
