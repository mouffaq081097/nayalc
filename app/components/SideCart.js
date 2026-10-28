'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ChevronDown, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAppContext } from '../context/AppContext';
import { calcShipping, formatShipping, FREE_SHIPPING_FROM } from '@/lib/shipping';
import { orderableQty } from '@/lib/backorderRules';
import { shortBrand } from '@/lib/seo';
import { formatAED } from '../lib/utils';
import { cardName } from './home/HomeProductCard';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useLocale, useT } from '../context/LocaleContext';

const LAVENDER = 'rgb(147,104,236)';

function Item({ item, onRemove, onQty, onNavigate }) {
  const t = useT();
  const was = Number(item.originalPrice) || 0;
  const href = `/product/${item.slug || item.id}`;
  return (
    <li className="flex gap-4 py-5 border-b border-[#ececec] last:border-b-0">
      <Link href={href} onClick={onNavigate} className="w-[92px] h-[92px] shrink-0 bg-[#f6f5f2] p-2">
        <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
      </Link>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start gap-3">
          <Link href={href} onClick={onNavigate} className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold leading-snug text-[#111114] line-clamp-2"><bdi>{cardName(item.name)}</bdi></p>
            {item.brand && <p className="mt-0.5 text-[12px] text-[#6b6b73]">{shortBrand(item.brand)}</p>}
          </Link>
          <button type="button" onClick={() => onRemove(item.id)} aria-label={t('Remove {name} from bag', { name: item.name })} className="shrink-0 -mt-0.5 p-1 text-[#6b6b73] hover:text-[#111114] transition-colors">
            <Trash2 size={16} strokeWidth={1.5} />
          </button>
        </div>
        <div className="mt-auto pt-3 flex items-center justify-between gap-3">
          <p className="text-[13.5px] text-[#111114] tabular-nums">
            {was > Number(item.price) && <s className="me-2 text-[#6b6b73]">{formatAED(was)}</s>}
            {formatAED(item.price)}
          </p>
          <div className="flex items-center gap-3" aria-label={t('Quantity of {name}', { name: item.name })}>
            <button type="button" onClick={() => onQty(item.id, item.quantity - 1)} disabled={item.quantity <= 1} aria-label={t('One fewer')} className="p-1 text-[#111114] disabled:text-[#c8c8cf]">
              <Minus size={15} strokeWidth={1.5} />
            </button>
            <span className="w-4 text-center text-[14px] tabular-nums">{item.quantity}</span>
            <button type="button" onClick={() => onQty(item.id, item.quantity + 1)} aria-label={t('One more')} className="p-1 text-[#111114]">
              <Plus size={15} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

/** Best sellers that aren't in the bag yet, one at a time with arrows. */
function Recommended({ cartIds, onAdd }) {
  const { products } = useAppContext();
  const t = useT();
  const picks = useMemo(
    () => products
      .filter((p) => orderableQty(p) > 0 && !cartIds.has(Number(p.id)))
      .sort((a, b) => (Number(!!b.isBestseller) - Number(!!a.isBestseller)) || (Number(b.totalSold || 0) - Number(a.totalSold || 0)))
      .slice(0, 6),
    [products, cartIds],
  );
  const [i, setI] = useState(0);
  if (!picks.length) return null;
  const p = picks[i % picks.length];
  const was = Number(p.originalPrice) || 0;

  return (
    <section className="py-5 border-t border-[#ececec]">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] text-[#111114]">{t('Recommended for you')}</h3>
        {picks.length > 1 && (
          <div className="flex gap-2">
            <button type="button" onClick={() => setI((v) => (v - 1 + picks.length) % picks.length)} aria-label={t('Previous recommendation')} className="w-8 h-8 rounded-full border border-[#dcdcdc] flex items-center justify-center hover:border-[#111114]">
              <ChevronLeft size={16} className="flip-rtl" />
            </button>
            <button type="button" onClick={() => setI((v) => (v + 1) % picks.length)} aria-label={t('Next recommendation')} className="w-8 h-8 rounded-full border border-[#dcdcdc] flex items-center justify-center hover:border-[#111114]">
              <ChevronRight size={16} className="flip-rtl" />
            </button>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="w-[84px] h-[84px] shrink-0 bg-[#f6f5f2] p-2">
          <ImageWithFallback src={p.imageUrl} alt={p.name} className="w-full h-full object-contain mix-blend-multiply" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] leading-snug text-[#111114] line-clamp-2"><bdi>{cardName(p.name)}</bdi></p>
          <p className="mt-1 text-[13.5px] text-[#111114] tabular-nums">
            {formatAED(p.price)}
            {was > Number(p.price) && <s className="ms-2 text-[#6b6b73]">{formatAED(was)}</s>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAdd(p)}
          className="shrink-0 h-9 px-4 bg-[#111114] text-white text-[13px] font-medium hover:bg-[#2a2a31] transition-colors"
        >
          {t('+ Add')}
        </button>
      </div>
    </section>
  );
}

/** "Have a discount code?" — opens to a field; the same coupon check as the bag page. */
function DiscountCode() {
  const { appliedCoupon, applyCoupon, removeCoupon, couponError } = useCart();
  const { t, rich } = useLocale();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    await applyCoupon(code.trim().toUpperCase());
    setBusy(false);
  };

  return (
    <section className="py-4 border-t border-[#ececec]">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="w-full flex items-center justify-between text-[15px] text-[#111114]">
        {t('Have a discount code?')}
        <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        appliedCoupon ? (
          <p className="mt-3 flex items-center justify-between text-[13.5px]">
            <span>{rich('{code} applied', { code: <b className="latin font-semibold tracking-wide">{appliedCoupon.code}</b> })}</span>
            <button type="button" onClick={removeCoupon} className="text-[#6b6b73] underline underline-offset-4 hover:text-[#111114]">{t('Remove')}</button>
          </p>
        ) : (
          <form onSubmit={submit} className="mt-3">
            <div className="flex gap-2">
              <label htmlFor="cart-coupon" className="sr-only">{t('Discount code')}</label>
              <input
                id="cart-coupon"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('Enter code')}
                autoComplete="off"
                className="flex-1 min-w-0 h-10 px-3 border border-[#dcdcdc] text-[13.5px] uppercase tracking-wide outline-none focus:border-[#111114]"
              />
              <button type="submit" disabled={busy || !code.trim()} className="h-10 px-5 bg-[#111114] text-white text-[13px] font-medium disabled:opacity-50">
                {busy ? t('Checking…') : t('Apply')}
              </button>
            </div>
            {couponError && <p className="mt-2 text-[12.5px] text-[#b91c1c]">{t(couponError)}</p>}
          </form>
        )
      )}
    </section>
  );
}

/**
 * The side cart (after Pitaka): a plain white drawer with the items, a
 * recommendation, the discount code and the total, then one black Checkout
 * button. The full bag page (/cart) is a link away for gift wrap, rewards etc.
 */
export default function SideCart() {
  const { isCartOpen, closeCart, cartItems, removeFromCart, updateQuantity, clearCart, addToCart, discountAmount, appliedCoupon } = useCart();
  const { t, rich, dir } = useLocale();
  // The drawer comes in from the end edge: the right, or the left in Arabic
  const offscreen = dir === 'rtl' ? '-100%' : '100%';
  const [confirmClear, setConfirmClear] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  // On the bag page itself the drawer would only cover what it shows, so adding there doesn't open it
  const onBagPage = usePathname() === '/cart';
  useEffect(() => { if (onBagPage && isCartOpen) closeCart(); }, [onBagPage, isCartOpen, closeCart]);

  const subtotal = cartItems.reduce((t, i) => t + i.price * i.quantity, 0);
  const count = cartItems.reduce((t, i) => t + i.quantity, 0);
  const shipping = calcShipping(count);
  const discount = appliedCoupon ? Number(discountAmount) || 0 : 0;
  const total = Math.max(0, subtotal - discount) + shipping;
  const cartIds = useMemo(() => new Set(cartItems.map((i) => Number(i.id))), [cartItems]);
  const toFree = Math.max(0, FREE_SHIPPING_FROM - count);

  const close = () => { setConfirmClear(false); closeCart(); };

  return (
    <AnimatePresence>
      {isCartOpen && !onBagPage && (
        <div className="fixed inset-0 z-[300]" role="dialog" aria-modal="true" aria-label={t('Cart')}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
            className="absolute inset-0 bg-black/45"
          />
          <motion.div
            initial={{ x: offscreen }} animate={{ x: 0 }} exit={{ x: offscreen }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute top-0 end-0 h-full w-full sm:max-w-[460px] bg-white flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-[72px] border-b border-[#ececec] shrink-0">
              <h2 className="text-[22px] font-medium text-[#111114]">{t('Cart')}</h2>
              <button type="button" onClick={close} aria-label={t('Close cart')} className="p-1.5 -me-1.5 text-[#6b6b73] hover:text-[#111114]">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-4">
                <ShoppingBag size={34} strokeWidth={1.2} className="text-[#c8c8cf]" />
                <p className="text-[16px] text-[#111114]">{t('Your cart is empty')}</p>
                <Link href="/all-products" onClick={close} className="h-11 px-7 flex items-center bg-[#111114] text-white text-[13.5px] font-medium hover:bg-[#2a2a31]">
                  {t('Shop all products')}
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 [scrollbar-width:thin]">
                  <ul>
                    {cartItems.map((item) => (
                      <Item key={item.id} item={item} onRemove={removeFromCart} onQty={updateQuantity} onNavigate={close} />
                    ))}
                  </ul>

                  <div className="pb-4 flex justify-end text-[13.5px] text-[#6b6b73]">
                    {confirmClear ? (
                      <span className="flex items-center gap-3">
                        {t('Remove everything?')}
                        <button type="button" onClick={() => { clearCart(); setConfirmClear(false); }} className="text-[#111114] font-medium underline underline-offset-4">{t('Yes, remove')}</button>
                        <button type="button" onClick={() => setConfirmClear(false)} className="underline underline-offset-4 hover:text-[#111114]">{t('Keep')}</button>
                      </span>
                    ) : (
                      <button type="button" onClick={() => setConfirmClear(true)} className="hover:text-[#111114]">{t('Remove all items')}</button>
                    )}
                  </div>

                  <Recommended cartIds={cartIds} onAdd={(p) => addToCart({ ...p, stock_quantity: p.stock_quantity ?? p.stockQuantity }, 1)} />
                  <DiscountCode />
                </div>

                {/* Total + checkout */}
                <div className="shrink-0 border-t border-[#ececec] px-6 pt-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
                  <p className="mb-3 text-[12.5px] text-[#6b6b73]">
                    {toFree > 0
                      ? rich('Add {more} for free delivery.', { more: <b className="font-semibold text-[#111114]">{t(toFree === 1 ? '{n} more item' : '{n} more items', { n: toFree })}</b> })
                      : <span style={{ color: LAVENDER }} className="font-semibold">{t('Free delivery unlocked.')}</span>}
                  </p>
                  {showBreakdown && (
                    <dl className="mb-3 grid grid-cols-[1fr_auto] gap-y-1.5 text-[13.5px] text-[#6b6b73] tabular-nums">
                      <dt>{t('Subtotal')}</dt><dd className="text-end">{formatAED(subtotal)}</dd>
                      {discount > 0 && (<><dt>{t('Discount ({code})', { code: appliedCoupon.code })}</dt><dd className="text-end"><bdi>−{formatAED(discount)}</bdi></dd></>)}
                      <dt>{t('Delivery')}</dt><dd className="text-end">{t(formatShipping(shipping))}</dd>
                    </dl>
                  )}
                  <button type="button" onClick={() => setShowBreakdown((v) => !v)} aria-expanded={showBreakdown} className="w-full flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[16px] font-semibold text-[#111114]">
                      {t('Total')} <ChevronDown size={16} className={`transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
                    </span>
                    <span className="text-[22px] font-semibold text-[#111114] tabular-nums">{formatAED(total)}</span>
                  </button>
                  <Link
                    href="/checkout"
                    onClick={close}
                    className="mt-4 h-[52px] w-full flex items-center justify-center bg-[#111114] text-white text-[15px] font-medium uppercase tracking-[0.04em] hover:bg-[#2a2a31] transition-colors"
                  >
                    {t('Checkout')}
                  </Link>
                  <Link href="/cart" onClick={close} className="mt-3 block text-center text-[13px] text-[#6b6b73] underline underline-offset-4 hover:text-[#111114]">
                    {t('View full bag')}
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
