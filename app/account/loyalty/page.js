'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Check, Clock, Gift, ShoppingBag, Tag, TrendingUp } from 'lucide-react';
import { useAccountData } from '../_components/useAccountData';
import { formatAED } from '../../lib/utils';
import { TIERS, AED_PER_POINT, POINTS_BLOCK, AED_PER_BLOCK, WELCOME_BONUS_POINTS, pointsToAed } from '@/lib/loyalty';

/**
 * Naya Rewards (after Pitaka's rewards page): a back link and big title, then
 * "Ways to earn points" (balance card + one card per way to earn), "Ways to
 * spend points" (discounts by points block, unlocked or still to go),
 * "Membership tiers" (tier tabs over goal/reward cards) and the points history.
 * Only rewards that exist are shown — every figure comes from lib/loyalty.js
 * and the customer's own data. There is no referral or social-follow reward.
 */

const LAVENDER = 'rgb(147,104,236)';
const CARD = 'rounded-xl border border-[#e5e5e5] shadow-[0_1px_3px_rgba(0,0,0,0.06)]';

const BigTitle = ({ children }) => (
  <h2 className="pb-4 md:pb-5 border-b border-[#111114] text-[28px] md:text-[42px] leading-tight tracking-tight">{children}</h2>
);

const IconDisc = ({ Icon, done = false }) => (
  <span className="mx-auto w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center" style={{ background: done ? '#e8f7ee' : '#f3f2ef' }}>
    {done ? <Check size={24} className="text-[#22a35a]" /> : <Icon size={22} strokeWidth={1.5} className="text-[#111114]" />}
  </span>
);

// Discounts a balance can buy at checkout — any multiple of POINTS_BLOCK works; these are steps to aim for
const SPEND_STEPS = [1, 5, 10, 20].map(blocks => ({ points: blocks * POINTS_BLOCK, aed: blocks * AED_PER_BLOCK }));

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

export default function AccountLoyaltyPage() {
  const { loyaltyData, isLoading } = useAccountData();

  const stats = loyaltyData?.stats || {};
  const points = Number(stats.points) || 0;
  const spend = Number(stats.lifetimeSpend) || 0;
  const history = loyaltyData?.transactions || [];
  const tierIdx = Math.max(0, TIERS.findIndex(t => t.name === (stats.tier || 'Silver')));
  const bonusEarned = history.some(t => t.type === 'bonus');

  const [selectedTier, setSelectedTier] = useState(tierIdx);
  useEffect(() => setSelectedTier(tierIdx), [tierIdx]);

  if (isLoading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#e6e4df] border-t-[#111114] rounded-full animate-spin" />
      </div>
    );
  }

  const earn = [
    { Icon: ShoppingBag, title: 'Place an order', text: `1 point for every AED ${AED_PER_POINT} spent on products` },
    { Icon: Gift, title: 'First order delivered', text: `${WELCOME_BONUS_POINTS} bonus points`, done: bonusEarned },
    { Icon: TrendingUp, title: 'Move up a tier', text: `Up to ${TIERS[TIERS.length - 1].multiplier}× points on every order` },
  ];

  return (
    <div className="bg-white text-[#111114]">
      <div className="max-w-[1320px] mx-auto px-5 md:px-10 pt-8 md:pt-14 pb-20">
        <Link href="/account" className="inline-flex items-center gap-1.5 text-[14px] text-[#6b6b72] hover:text-[#111114] transition-colors">
          <ArrowLeft size={14} strokeWidth={1.75} /> Back to account
        </Link>
        <h1 className="mt-6 md:mt-8 text-[34px] md:text-[56px] leading-[1.05] tracking-tight">Naya Rewards</h1>
        <p className="mt-3 text-[15px] md:text-[17px] text-[#6b6b72] max-w-xl">
          Earn points on every order, spend them at checkout, and earn faster as you move up a tier.
        </p>

        {/* ── Ways to earn ── */}
        <section className="pt-12 md:pt-16">
          <BigTitle>Ways to earn points</BigTitle>
          <div className="md:px-[4%] lg:px-[6%]">
            <div className={`mt-8 md:mt-10 ${CARD} px-6 md:px-8 py-6`}>
              <p className="text-[18px] md:text-[22px] font-medium">
                Your balance <span style={{ color: LAVENDER }}>{points.toLocaleString()}</span> points
              </p>
              <p className="mt-1 text-[14px] text-[#6b6b72]">
                {points >= POINTS_BLOCK ? `Worth ${formatAED(pointsToAed(points))} at checkout` : `Every ${POINTS_BLOCK} points take ${formatAED(AED_PER_BLOCK)} off at checkout`} · Points never expire
              </p>
            </div>
            <div className="mt-4 md:mt-6 grid sm:grid-cols-3 gap-4 md:gap-6">
              {earn.map(({ Icon, title, text, done }) => (
                <div key={title} className={`${CARD} px-6 py-8 text-center ${done ? 'bg-[#fafafa]' : ''}`}>
                  <IconDisc Icon={Icon} done={done} />
                  <p className={`mt-5 text-[17px] md:text-[19px] font-medium ${done ? 'text-[#6b6b72]' : ''}`}>{title}</p>
                  {done
                    ? <p className="mt-2 text-[15px] text-[#22a35a] inline-flex items-center gap-1.5"><Check size={15} /> Completed</p>
                    : <p className="mt-2 text-[15px] text-[#6b6b72]">{text}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Ways to spend ── */}
        <section className="pt-14 md:pt-20">
          <BigTitle>Ways to spend points</BigTitle>
          <div className="md:px-[4%] lg:px-[6%] mt-8 md:mt-10 grid sm:grid-cols-2 gap-4 md:gap-6">
            {SPEND_STEPS.map(step => {
              const ready = points >= step.points;
              return (
                <div key={step.points} className={`${CARD} px-6 py-8 text-center`}>
                  <IconDisc Icon={Tag} />
                  <p className="mt-5 text-[17px] md:text-[19px] font-medium">{formatAED(step.aed)} off</p>
                  <p className="mt-2 text-[15px] text-[#6b6b72]">Get {formatAED(step.aed)} off your order for {step.points.toLocaleString()} points</p>
                  {ready
                    ? <Link href="/cart" className="inline-block mt-4 text-[15px] font-medium hover:underline underline-offset-4">Use at checkout</Link>
                    : <p className="mt-4 text-[15px] text-[#8a8a92]">{(step.points - points).toLocaleString()} points to go</p>}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Tiers ── */}
        <section className="pt-14 md:pt-20">
          <BigTitle>Membership tiers</BigTitle>
          <div className="md:px-[4%] lg:px-[6%]">
            <div className="mt-8 md:mt-10 flex gap-2.5 overflow-x-auto pb-1 -mx-5 px-5 md:mx-0 md:px-0" role="tablist" aria-label="Membership tiers">
              {TIERS.map((t, i) => (
                <button
                  key={t.name}
                  type="button"
                  role="tab"
                  aria-selected={selectedTier === i}
                  onClick={() => setSelectedTier(i)}
                  className={`shrink-0 h-11 px-5 rounded-md text-[15px] whitespace-nowrap transition-colors ${selectedTier === i ? 'bg-[#111114] text-white' : 'bg-[#f3f2ef] text-[#6b6b72] hover:text-[#111114]'}`}
                >
                  Level {i + 1}: {t.name}
                </button>
              ))}
            </div>
            <p className="mt-5 text-[14px] text-[#6b6b72]">
              You&apos;ve spent {formatAED(spend)} with us so far.
              {TIERS[tierIdx + 1] ? ` Spend ${formatAED(Math.max(0, TIERS[tierIdx + 1].min - spend))} more to reach ${TIERS[tierIdx + 1].name}.` : ' You are at our highest tier.'}
            </p>
            <div className="mt-5 grid sm:grid-cols-2 gap-4 md:gap-6">
              {TIERS.map((t, i) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setSelectedTier(i)}
                  className={`relative rounded-xl border px-6 py-8 text-center transition-colors ${selectedTier === i ? 'border-[#111114]' : 'border-[#e5e5e5] shadow-[0_1px_3px_rgba(0,0,0,0.06)]'}`}
                >
                  {i === tierIdx && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#111114] text-white text-[11px]">Your tier</span>
                  )}
                  <p className="text-[17px] md:text-[19px] font-medium">Level {i + 1}: {t.name}</p>
                  <p className="mt-3 text-[13px] text-[#8a8a92]">Goal</p>
                  <p className="text-[15px] md:text-[16px]">{t.min === 0 ? 'Your first order' : `Spend ${formatAED(t.min)}`}</p>
                  <p className="mt-3 text-[13px] text-[#8a8a92]">Reward</p>
                  <p className="text-[15px] md:text-[16px]">{t.multiplier === 1 ? `1 point per AED ${AED_PER_POINT}` : `${t.multiplier}× points on every order`}</p>
                </button>
              ))}
            </div>
            <p className="mt-5 text-[13px] text-[#8a8a92]">Tiers go by lifetime spend and only ever move up.</p>
          </div>
        </section>

        {/* ── History ── */}
        <section className="pt-14 md:pt-20">
          <BigTitle>Points activity</BigTitle>
          {history.length === 0 ? (
            <p className="py-6 text-[15px] text-[#6b6b72]">
              No points yet — your first delivered order earns points plus a {WELCOME_BONUS_POINTS}-point welcome bonus.{' '}
              <Link href="/all-products" className="text-[#111114] underline underline-offset-4">Start shopping</Link>
            </p>
          ) : (
            <ul className="divide-y divide-[#ececec]">
              {history.map((h, i) => {
                const pending = h.type === 'pending' || h.type === 'placed';
                const earned = Number(h.points) > 0;
                const Icon = pending ? Clock : earned ? ArrowUpRight : ArrowDownRight;
                return (
                  <li key={h.id ?? i} className="flex items-center gap-4 py-5">
                    <span className="w-10 h-10 rounded-full bg-[#f3f2ef] flex items-center justify-center shrink-0">
                      <Icon size={16} strokeWidth={1.75} className={pending ? 'text-amber-600' : 'text-[#111114]'} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium truncate">{h.description || h.desc}</p>
                      <p className="text-[13px] text-[#6b6b72]">{formatDate(h.createdAt || h.created_at) || h.date}</p>
                    </div>
                    {pending
                      ? <span className="shrink-0 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[12px]">Pending</span>
                      : <span className="shrink-0 text-[16px] tabular-nums" style={earned ? { color: LAVENDER } : { color: '#6b6b72' }}>{earned ? '+' : ''}{h.points}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
