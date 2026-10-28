'use client';

import { Truck, Check } from 'lucide-react';
import { Container } from '../ui/Container';
import { useCart } from '../../context/CartContext';
import { FREE_SHIPPING_FROM } from '@/lib/shipping';
import { useLocale } from '../../context/LocaleContext';

const LAVENDER = 'rgb(147,104,236)';

/**
 * A slim line under the hero once the bag has something in it: how many more
 * items unlock free delivery (lib/shipping.js counts items, not value), or
 * that it's already unlocked. Hidden for an empty bag.
 */
export function FreeShippingNote() {
  const { cartItems, isCartReady, openCart } = useCart();
  const { t, rich } = useLocale();
  if (!isCartReady) return null;

  const count = cartItems.reduce((n, i) => n + (Number(i.quantity) || 0), 0);
  if (count === 0) return null;

  const needed = Math.max(0, FREE_SHIPPING_FROM - count);
  const progress = Math.min(1, count / FREE_SHIPPING_FROM);

  return (
    <section aria-label={t('Delivery')} className="bg-white border-b border-gray-100">
      <Container wide className="py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="w-8 h-8 shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
          {needed === 0
            ? <Check size={16} strokeWidth={2} style={{ color: LAVENDER }} />
            : <Truck size={16} strokeWidth={1.75} style={{ color: LAVENDER }} />}
        </span>
        <p className="text-[13px] text-gray-700 min-w-0">
          {needed === 0
            ? rich('{unlocked} for the {n} items in your bag.', {
              unlocked: <span className="font-semibold text-gray-900">{t('Free delivery unlocked')}</span>,
              n: count,
            })
            : rich('Add {more} for free delivery ({n} in your bag).', {
              more: <span className="font-semibold text-gray-900">{t(needed === 1 ? '{n} more item' : '{n} more items', { n: needed })}</span>,
              n: count,
            })}
        </p>
        <span className="hidden sm:block h-1.5 w-32 rounded-full bg-gray-100 overflow-hidden" aria-hidden="true">
          <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${progress * 100}%`, background: LAVENDER }} />
        </span>
        <button type="button" onClick={openCart} className="ms-auto text-[13px] font-medium text-gray-900 underline underline-offset-4 decoration-gray-300 hover:decoration-gray-900">
          {t('View bag')}
        </button>
      </Container>
    </section>
  );
}
