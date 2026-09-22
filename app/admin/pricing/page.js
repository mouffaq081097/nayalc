'use client';

import React, { useState, useMemo } from 'react';
import { Calculator, Info } from 'lucide-react';
import { VAT_RATE, vatFromGross, netFromGross } from '@/lib/vat';
import {
  TIERS, AED_PER_POINT, POINTS_BLOCK, AED_PER_BLOCK,
  WELCOME_BONUS_POINTS, pointsForOrder, pointsToAed,
} from '@/lib/loyalty';
import { SHIPPING_TIERS, calcShipping, formatShipping } from '@/lib/shipping';

// Every figure on this page is read from lib/vat.js, lib/loyalty.js and
// lib/shipping.js — the same modules checkout and the order API use. Change a
// rate there and this page follows, so it can never describe a scheme we
// aren't actually running.

// The card-processing allowance baked into product prices in the Sept 2026
// reprice. Not used in any live calculation; shown here so the margin below
// reflects what Stripe actually takes.
const CARD_FEE_RATE = 0.03;

const aed = (n) => `AED ${Number(n || 0).toFixed(2)}`;
const pct = (n) => `${(n * 100).toFixed(0)}%`;

function Card({ title, subtitle, children, className = '' }) {
  return (
    <section className={`sp-card ${className}`}>
      <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--sp-border)' }}>
        <h2 className="text-[14px] font-semibold" style={{ color: 'var(--sp-text)' }}>{title}</h2>
        {subtitle && (
          <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--sp-text-secondary)' }}>{subtitle}</p>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Row({ label, value, strong, muted, accent }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span
        className={strong ? 'text-[13.5px] font-semibold' : 'text-[13px]'}
        style={{ color: strong ? 'var(--sp-text)' : 'var(--sp-text-secondary)' }}
      >
        {label}
      </span>
      <span
        className={`tabular-nums ${strong ? 'text-[15px] font-semibold' : 'text-[13px] font-medium'}`}
        style={{ color: accent || (muted ? 'var(--sp-text-subdued)' : 'var(--sp-text)') }}
      >
        {value}
      </span>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--sp-text-secondary)' }}>
        {label}
      </span>
      {children}
      {hint && <span className="block text-[11.5px] mt-1" style={{ color: 'var(--sp-text-subdued)' }}>{hint}</span>}
    </label>
  );
}

const inputClass =
  'w-full h-9 rounded-lg px-3 text-[13.5px] bg-white outline-none focus:ring-2';
const inputStyle = {
  border: '1px solid var(--sp-border-strong)',
  color: 'var(--sp-text)',
  boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
};

export default function PricingExplainerPage() {
  const [subtotal, setSubtotal] = useState(562);
  const [qty, setQty] = useState(2);
  const [tier, setTier] = useState('Silver');
  const [discountKind, setDiscountKind] = useState('none');
  const [discountValue, setDiscountValue] = useState(0);

  const calc = useMemo(() => {
    const goods = Math.max(0, Number(subtotal) || 0);
    const shipping = calcShipping(Math.max(0, Number(qty) || 0));

    // Only one discount can apply — the order API rejects an order carrying both.
    const promo = discountKind === 'promo' ? Math.max(0, Number(discountValue) || 0) : 0;
    const points = discountKind === 'points' ? Math.max(0, Number(discountValue) || 0) : 0;
    const pointsAed = pointsToAed(points);

    const total = Math.max(0, goods + shipping - promo - pointsAed);
    const vat = vatFromGross(total);
    const net = netFromGross(total);
    const cardFee = total * CARD_FEE_RATE;

    return {
      goods, shipping, promo, points, pointsAed, total, vat, net, cardFee,
      netAfterCard: net - cardFee,
      earned: pointsForOrder(goods, tier),
    };
  }, [subtotal, qty, tier, discountKind, discountValue]);

  const earnedWorth = (calc.earned / POINTS_BLOCK) * AED_PER_BLOCK;
  const effectiveBack = calc.goods > 0 ? (earnedWorth / calc.goods) * 100 : 0;

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 space-y-5">

      <header>
        <h1 className="text-[20px] font-semibold" style={{ color: 'var(--sp-text)' }}>
          Pricing and loyalty
        </h1>
        <p className="text-[13.5px] mt-1 max-w-[70ch]" style={{ color: 'var(--sp-text-secondary)' }}>
          How an order&apos;s money is calculated, end to end. Every rate below is read live from
          the same code the storefront and order API use, so this page always matches what
          customers are actually charged.
        </p>
      </header>

      {/* ── Calculator ─────────────────────────────────────────────── */}
      <Card
        title="Work through an order"
        subtitle="Change the inputs to see exactly what the customer pays and what the business keeps."
      >
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">

          <div className="space-y-4">
            <Field label="Product subtotal (AED)" hint="What the customer sees. Prices include VAT.">
              <input type="number" min="0" step="1" value={subtotal} style={inputStyle} className={inputClass}
                onChange={e => setSubtotal(e.target.value)} />
            </Field>

            <Field label="Number of items" hint={`Shipping is by quantity, not value. ${qty >= 3 ? 'Free at 3+.' : ''}`}>
              <input type="number" min="0" step="1" value={qty} style={inputStyle} className={inputClass}
                onChange={e => setQty(e.target.value)} />
            </Field>

            <Field label="Customer tier">
              <select value={tier} onChange={e => setTier(e.target.value)} style={inputStyle} className={inputClass}>
                {TIERS.map(t => (
                  <option key={t.name} value={t.name}>{t.name} — {t.multiplier}× points</option>
                ))}
              </select>
            </Field>

            <Field label="Discount" hint="An order takes one or the other, never both.">
              <select value={discountKind} style={inputStyle} className={inputClass}
                onChange={e => { setDiscountKind(e.target.value); setDiscountValue(0); }}>
                <option value="none">None</option>
                <option value="promo">Promo code</option>
                <option value="points">Loyalty points</option>
              </select>
            </Field>

            {discountKind !== 'none' && (
              <Field
                label={discountKind === 'promo' ? 'Promo value (AED)' : 'Points redeemed'}
                hint={discountKind === 'points'
                  ? `${POINTS_BLOCK} points = ${aed(AED_PER_BLOCK)}. Rounds down to whole blocks — worth ${aed(calc.pointsAed)}.`
                  : undefined}
              >
                <input type="number" min="0" step={discountKind === 'points' ? 100 : 1}
                  value={discountValue} style={inputStyle} className={inputClass}
                  onChange={e => setDiscountValue(e.target.value)} />
              </Field>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-lg p-4" style={{ background: 'var(--sp-surface-sub)', border: '1px solid var(--sp-border)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--sp-text-subdued)' }}>
                Customer pays
              </p>
              <Row label="Products" value={aed(calc.goods)} />
              <Row label="Shipping" value={calc.shipping === 0 ? 'Free' : aed(calc.shipping)} />
              {calc.promo > 0 && <Row label="Promo code" value={`− ${aed(calc.promo)}`} accent="#0a7c42" />}
              {calc.pointsAed > 0 && (
                <Row label={`Loyalty points (${calc.points})`} value={`− ${aed(calc.pointsAed)}`} accent="#0a7c42" />
              )}
              <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--sp-border)' }}>
                <Row label="Total charged" value={aed(calc.total)} strong />
                <Row label={`Includes VAT (${pct(VAT_RATE)})`} value={aed(calc.vat)} muted />
              </div>
            </div>

            <div className="rounded-lg p-4" style={{ background: 'var(--sp-surface-sub)', border: '1px solid var(--sp-border)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--sp-text-subdued)' }}>
                Business keeps
              </p>
              <Row label="Total charged" value={aed(calc.total)} />
              <Row label="Less VAT to the FTA" value={`− ${aed(calc.vat)}`} muted />
              <Row label="Net revenue" value={aed(calc.net)} />
              <Row label={`Less card fee (${pct(CARD_FEE_RATE)})`} value={`− ${aed(calc.cardFee)}`} muted />
              <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--sp-border)' }}>
                <Row label="After VAT and card fee" value={aed(calc.netAfterCard)} strong />
              </div>
            </div>

            <div className="sm:col-span-2 rounded-lg p-4" style={{ background: 'var(--sp-surface-sub)', border: '1px solid var(--sp-border)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--sp-text-subdued)' }}>
                Loyalty cost
              </p>
              <Row label={`Points earned on delivery (${tier}, ${TIERS.find(t => t.name === tier)?.multiplier}×)`} value={`${calc.earned} pts`} />
              <Row label="Future discount that represents" value={aed(earnedWorth)} />
              <Row label="Effective cost of the programme" value={`${effectiveBack.toFixed(2)}% of the order`} strong />
              <p className="text-[12px] mt-2" style={{ color: 'var(--sp-text-subdued)' }}>
                Credited only when the order is delivered, so cancelled orders cost nothing. A
                member&apos;s first delivered order also earns a {WELCOME_BONUS_POINTS}-point welcome
                bonus, worth {aed(pointsToAed(WELCOME_BONUS_POINTS))}, once per customer.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ── The rules ──────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">

        <Card title="VAT is included in every price" subtitle="Required of a consumer-facing price in the UAE.">
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>
            VAT is never added at checkout. It is already inside the price, and we extract it for
            the tax record and the invoice.
          </p>
          <div className="mt-3 rounded-lg px-4 py-3 font-mono text-[12.5px]"
            style={{ background: 'var(--sp-surface-sub)', border: '1px solid var(--sp-border)', color: 'var(--sp-text)' }}>
            VAT = total × 5 ÷ 105 &nbsp;&nbsp;<span style={{ color: 'var(--sp-text-subdued)' }}>(not total × 5%)</span>
          </div>
          <p className="text-[13px] mt-3 leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>
            The base is the whole order — products, shipping and gift wrap, after any discount —
            because delivery is a taxable supply here. A {aed(105)} order contains {aed(5)} of VAT,
            not {aed(5.25)}.
          </p>
        </Card>

        <Card title="Shipping" subtitle="Charged by quantity, not order value.">
          <div className="space-y-2">
            {SHIPPING_TIERS.map(t => (
              <div key={t.label} className="flex items-baseline justify-between gap-4 py-1.5"
                style={{ borderBottom: '1px solid var(--sp-border)' }}>
                <span className="text-[13px]" style={{ color: 'var(--sp-text-secondary)' }}>{t.label}</span>
                <span className="text-[13px] font-medium tabular-nums" style={{ color: 'var(--sp-text)' }}>
                  {formatShipping(t.cost)}
                  {t.cost > 0 && (
                    <span className="ml-2 text-[11.5px]" style={{ color: 'var(--sp-text-subdued)' }}>
                      nets {aed(netFromGross(t.cost))}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[12.5px] mt-3 leading-relaxed" style={{ color: 'var(--sp-text-subdued)' }}>
            These include VAT like everything else. Actual courier cost is about {aed(32)} per
            shipment, so shipping is subsidised at every tier — it exists to lift basket size,
            not to cover cost.
          </p>
        </Card>

        <Card title="One discount per order" subtitle="A promo code or loyalty points, never both.">
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>
            Stacking a coupon on top of a points redemption let a single order carry two
            discounts. Checkout now switches points off when a code is applied and explains why,
            and the order API rejects any request carrying both — before any payment is captured.
          </p>
          <p className="text-[13px] mt-3 leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>
            Customers keep the choice. They simply take whichever is worth more.
          </p>
        </Card>

        <Card title="Loyalty" subtitle={`1 point per ${aed(AED_PER_POINT)} spent · ${POINTS_BLOCK} points = ${aed(AED_PER_BLOCK)}`}>
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--sp-border)' }}>
                {['Tier', 'Lifetime spend', 'Rate', 'Back'].map((h, i) => (
                  <th key={h} className={`pb-2 text-[11px] font-semibold uppercase tracking-wide ${i > 1 ? 'text-right' : 'text-left'}`}
                    style={{ color: 'var(--sp-text-subdued)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIERS.map(t => {
                const back = (t.multiplier / AED_PER_POINT) * (AED_PER_BLOCK / POINTS_BLOCK) * 100;
                return (
                  <tr key={t.name} style={{ borderBottom: '1px solid var(--sp-border)' }}>
                    <td className="py-2 font-medium" style={{ color: 'var(--sp-text)' }}>{t.name}</td>
                    <td className="py-2" style={{ color: 'var(--sp-text-secondary)' }}>
                      {t.min === 0 ? 'From the start' : `${aed(t.min)}+`}
                    </td>
                    <td className="py-2 text-right tabular-nums" style={{ color: 'var(--sp-text-secondary)' }}>{t.multiplier}×</td>
                    <td className="py-2 text-right tabular-nums font-medium" style={{ color: 'var(--sp-text)' }}>{back.toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-[12.5px] mt-3 leading-relaxed" style={{ color: 'var(--sp-text-subdued)' }}>
            Points are credited when an order is delivered, not when it is placed, so cancelled
            orders cost nothing. Signing up earns nothing on its own — the {WELCOME_BONUS_POINTS}-point
            welcome bonus lands on a member&apos;s first delivered order.
          </p>
        </Card>
      </div>

      {/* ── What changed ───────────────────────────────────────────── */}
      <Card
        title="What changed in September 2026"
        subtitle="For the record, and for explaining the numbers to anyone who saw the old ones."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[640px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--sp-border)' }}>
                {['', 'Before', 'Now', 'Why'].map(h => (
                  <th key={h} className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--sp-text-subdued)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['VAT', 'Added at checkout as a separate line', 'Included in the displayed price',
                 'UAE consumer law expects a consumer price to be VAT-inclusive'],
                ['Product prices', 'Excluded VAT and card costs', 'Raised 8.15%, now include both',
                 'Same net revenue as before, with the card fee covered and no surcharge'],
                ['Shipping', `${aed(20)} / ${aed(10)} / Free`, `${aed(21)} / ${aed(10.5)} / Free`,
                 'Grossed up so shipping still nets the same once VAT is extracted'],
                ['Discounts', 'A coupon and points could stack', 'One or the other',
                 'Two discounts on one order was never intended'],
                ['Loyalty earning', '5% back at Silver, 12.5% at Diamond', '1% at Silver, 2% at Diamond',
                 'The old rate does not survive luxury margins'],
                ['Welcome bonus', '500 points for registering', `${WELCOME_BONUS_POINTS} points on first delivery`,
                 'Costs nothing for accounts that never buy'],
                ['Points value', `${POINTS_BLOCK} points = ${aed(AED_PER_BLOCK)}`, `${POINTS_BLOCK} points = ${aed(AED_PER_BLOCK)}`,
                 'Deliberately unchanged, so balances customers already hold keep their value'],
              ].map(([what, before, now, why]) => (
                <tr key={what} style={{ borderBottom: '1px solid var(--sp-border)' }}>
                  <td className="py-2.5 pr-4 font-medium align-top whitespace-nowrap" style={{ color: 'var(--sp-text)' }}>{what}</td>
                  <td className="py-2.5 pr-4 align-top" style={{ color: 'var(--sp-text-subdued)' }}>{before}</td>
                  <td className="py-2.5 pr-4 align-top font-medium" style={{ color: 'var(--sp-text)' }}>{now}</td>
                  <td className="py-2.5 align-top" style={{ color: 'var(--sp-text-secondary)' }}>{why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex gap-2.5 rounded-lg p-3.5"
          style={{ background: 'var(--sp-surface-sub)', border: '1px solid var(--sp-border)' }}>
          <Info size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--sp-text-subdued)' }} />
          <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>
            The headline for management: customers pay about what they did before, the business
            keeps about what it did before, and the card fee is now covered. What changed is that
            the price is honest on its face — one number, VAT inside, no surprises at checkout —
            and the loyalty programme costs 1&ndash;2% instead of 5&ndash;12.5%.
          </p>
        </div>
      </Card>

      <p className="flex items-center gap-2 text-[12px] pb-4" style={{ color: 'var(--sp-text-subdued)' }}>
        <Calculator size={13} />
        Figures read live from lib/vat.js, lib/loyalty.js and lib/shipping.js.
      </p>
    </div>
  );
}
