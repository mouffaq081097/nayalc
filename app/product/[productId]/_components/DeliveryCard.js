'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Truck, MapPin, Package, Check, Clock, ChevronRight } from 'lucide-react';
import Modal from '../../../components/Modal';
import { calcShipping, getDeliveryInfo, SHIPPING_TIERS, ARTISAN_GIFT_THRESHOLD, ARTISAN_GIFT_NAME, formatShipping } from '../../../../lib/shipping';
import { isDefaultAddress, addressParts } from '../../../account/_components/addressDisplay';
import { LAVENDER, LAVENDER_HOVER, BORDER, WELL, DIVIDER } from './theme';
import { useSignIn } from '@/app/context/SignInContext';
import { useLocale } from '@/app/context/LocaleContext';

/**
 * Everything about getting the product to the customer, in one panel:
 * where it goes, when it arrives, what shipping costs if they add it now,
 * and who sells / delivers it.
 */
export default function DeliveryCard({ user, shippingAddresses = [], contactName, cartItems = [], quantity = 1 }) {
  const { openSignIn } = useSignIn();
  const { t, rich, date } = useLocale();
  const [info, setInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Computed on the client only — the server's clock would hydrate a stale countdown
  useEffect(() => {
    setInfo(getDeliveryInfo());
    const id = setInterval(() => setInfo(getDeliveryInfo()), 60_000);
    return () => clearInterval(id);
  }, []);

  const cartQty = cartItems.reduce((s, i) => s + i.quantity, 0);
  const totalQty = cartQty + quantity;
  const shipCost = calcShipping(totalQty);
  const itemsToFree = Math.max(0, 3 - totalQty);

  const addr = shippingAddresses.find(isDefaultAddress) ?? shippingAddresses[0] ?? null;
  const parts = addr ? addressParts(addr) : null;
  // t(', ') is the Arabic comma in Arabic
  const addrLine = parts ? [parts.area, t(parts.emirate)].filter(Boolean).join(t(', ')) || parts.street : '';

  const hrs = info?.minsLeft != null ? Math.floor(info.minsLeft / 60) : 0;
  const mins = info?.minsLeft != null ? info.minsLeft % 60 : 0;

  return (
    <>
      <div className="rounded-2xl overflow-hidden bg-white" style={{ border: `1.5px solid ${BORDER}` }}>

        {/* Arrival */}
        <div className="flex items-start gap-3 p-4">
          <IconDot><Truck size={15} style={{ color: LAVENDER }} /></IconDot>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] text-gray-600 leading-snug">
              {info
                ? rich('Arrives {date}', { date: <span className="font-semibold text-gray-900">{date(info.rangeLabel)}</span> })
                : <span className="inline-block h-4 w-40 rounded bg-gray-100 animate-pulse align-middle" />}
            </p>
            {info?.isNextDay && info.minsLeft != null && (
              <p className="mt-1 flex items-center gap-1.5 text-[12px] text-gray-500">
                <Clock size={12} style={{ color: LAVENDER }} />
                {rich('Order within {time} to ship today', {
                  time: <span className="font-semibold tabular-nums" style={{ color: LAVENDER_HOVER }}>{hrs > 0 ? t('{h}h {m}m', { h: hrs, m: mins }) : t('{m}m', { m: mins })}</span>,
                })}
              </p>
            )}
            <p className="mt-1 text-[12px] text-gray-500">
              {shipCost === 0
                ? <span className="font-semibold text-emerald-600">{t('Free shipping on this order')}</span>
                : <>
                    <span className="font-medium text-gray-700">{t('{cost} shipping', { cost: formatShipping(shipCost) })}</span>
                    <span className="text-[#6b6b73]"> · {t(itemsToFree > 1 ? 'add {n} more items for free shipping' : 'add {n} more item for free shipping', { n: itemsToFree })}</span>
                  </>}
              <button onClick={() => setShowModal(true)}
                className="ms-1.5 font-medium underline underline-offset-2 hover:opacity-70" style={{ color: LAVENDER }}>
                {t('Details')}
              </button>
            </p>
          </div>
        </div>

        <Divider />

        {/* Destination */}
        <Link href={!user ? '/auth' : '/account/addresses'} onClick={(e) => { if (!user) { e.preventDefault(); openSignIn(); } }}
          className="flex items-center gap-3 px-4 py-3 group transition-colors hover:bg-purple-50/40">
          <IconDot><MapPin size={15} style={{ color: LAVENDER }} /></IconDot>
          <p className="flex-1 min-w-0 text-[13px] text-gray-600 truncate">
            {!user && <span className="font-medium" style={{ color: LAVENDER }}>{t('Sign in to see your delivery address')}</span>}
            {user && !addr && <span className="font-medium" style={{ color: LAVENDER }}>{t('Add a delivery address')}</span>}
            {user && addr && (
              <>{contactName
                ? rich('Deliver to {name}', { name: <span className="font-semibold text-gray-900">{contactName}</span> })
                : t('Deliver to you')}
                {addrLine && <span className="text-gray-500"> · {addrLine}</span>}</>
            )}
          </p>
          <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 flip-rtl" />
        </Link>

        <Divider />

        {/* Seller */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ background: WELL }}>
          <IconDot><Package size={15} style={{ color: LAVENDER }} /></IconDot>
          <p className="min-w-0 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] text-gray-500">
            <span className="whitespace-nowrap">{rich('Sold by {seller}', { seller: <span className="font-semibold text-gray-700">Naya Lumière Cosmetics</span> })}</span>
            <span className="text-gray-300">·</span>
            <span className="whitespace-nowrap">{rich('Tracked delivery by {courier}', { courier: <span className="font-semibold text-gray-700">{t('our courier partners')}</span> })}</span>
          </p>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('How shipping works')} size="max-w-md">
        <div className="space-y-5">
          <p className="text-[13px] text-gray-500 leading-relaxed">
            {t('Shipping is based on the number of items in your order, not its value — so the more you add, the less you pay.')}
          </p>

          <div className="space-y-2">
            {SHIPPING_TIERS.map(tier => {
              const free = tier.cost === 0;
              const current = totalQty >= tier.minItems && totalQty <= tier.maxItems;
              return (
                <div key={tier.label}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border"
                  style={{
                    background: current ? 'rgba(147,104,236,0.06)' : 'white',
                    borderColor: current ? 'rgba(147,104,236,0.5)' : '#f3f4f6',
                  }}>
                  <div className="flex items-center gap-2.5">
                    {free
                      ? <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: LAVENDER }}>
                          <Check size={10} className="text-white" strokeWidth={3} />
                        </span>
                      : <span className="w-5 h-5 rounded-full border-2 border-gray-200" />}
                    <span className="text-[13px] font-medium text-gray-700">{t(tier.label)}</span>
                    {current && <span className="text-[11px] font-medium" style={{ color: LAVENDER }}>· {t('your order')}</span>}
                  </div>
                  <span className={`text-[14px] font-bold tabular-nums ${free ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {t(formatShipping(tier.cost))}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl p-4 space-y-1.5" style={{ background: WELL, border: `1px solid ${BORDER}` }}>
            <p className="text-[13px] font-bold" style={{ color: LAVENDER_HOVER }}>🎁 {t(ARTISAN_GIFT_NAME)}</p>
            <p className="text-[12px] text-gray-500 leading-relaxed">
              {rich('Spend {amount} and receive a complimentary handmade gift from our Crystal Bar collection.', {
                amount: <span className="font-semibold text-gray-800">AED {ARTISAN_GIFT_THRESHOLD}+</span>,
              })}
            </p>
          </div>

          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
            <Truck size={15} className="flex-shrink-0 mt-0.5" style={{ color: LAVENDER }} />
            <p className="text-[12px] text-gray-500 leading-relaxed">
              {rich('Tracked delivery by {courier}. Orders placed before {cutoff} on a working day are dispatched the same day and arrive within {transit}. You’ll get the courier and tracking link as soon as your order ships.', {
                courier: <span className="font-semibold text-gray-700">{t('our courier partners')}</span>,
                cutoff: <span className="font-semibold text-gray-700">{t('2:00 PM UAE time')}</span>,
                transit: <span className="font-semibold text-gray-700">{t(info?.transitLabel || '1–3 working days')}</span>,
              })}
            </p>
          </div>

          <p className="text-[11px] text-[#6b6b73] leading-relaxed">
            {rich('{why} We absorb the cost of delivery on multi-item orders rather than hide fees in product prices.', {
              why: <span className="font-semibold text-gray-600">{t('Why we charge shipping:')}</span>,
            })}
          </p>
        </div>
      </Modal>
    </>
  );
}

function IconDot({ children }) {
  return (
    <span className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(147,104,236,0.08)' }}>
      {children}
    </span>
  );
}

function Divider() {
  return <div className="h-px mx-4" style={{ background: DIVIDER }} />;
}
