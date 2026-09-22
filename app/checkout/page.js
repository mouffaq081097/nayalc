"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import BrandLogo from '../components/BrandLogo';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, CreditCard, MapPin, Lock, Check, Gift, ShieldCheck, Loader2,
  Pencil, Trash2, Plus, RotateCcw, ChevronDown, Tag, Star, AlertTriangle, ShoppingBag, Banknote,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { createFetchWithAuth } from '../lib/api';
import { calcShipping } from '@/lib/shipping';
import { POINTS_BLOCK, AED_PER_BLOCK } from '@/lib/loyalty';
import { vatFromGross } from '@/lib/vat';
import CheckoutForm from './CheckoutForm';
import ExpressCheckoutButton from './ExpressCheckoutButton';
import TabbyCard from '../components/TabbyCard';

const Modal = dynamic(() => import('../components/Modal'), { ssr: false });
const AddressInputForm = dynamic(() => import('../components/AddressInputForm'), { ssr: false });

const GRADIENT = 'linear-gradient(90deg,#c087fc,#9869f7)';
// Must match app/api/orders/route.js, which rejects an order whose total drifts
// from its own calculation.
const GIFT_WRAP_FEE = 100;
// Redemption rate comes from lib/loyalty.js so checkout can never show a
// discount the order API would compute differently.

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9869f7]/40';
const cardClass = 'rounded-2xl border border-[#e5e5ea] bg-white';

const fmt = (n) =>
  `AED ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// The addresses API has been read with both naming styles across the app.
const addressName = (a, fallback) =>
  a.addressLabel || a.address_label || a.customerName || a.customer_name || fallback || 'Address';
const addressLine = (a) =>
  [a.addressLine1 || a.address_line1 || a.shippingAddress || a.shipping_address, a.addressLine2 || a.address_line2]
    .filter(Boolean)
    .join(', ');
const isDefaultAddress = (a) => Boolean(a.isDefault ?? a.is_default);

/* ── Shell ─────────────────────────────────────────────────────── */

function FlowHeader({ onBack }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e5e5ea] bg-white">
      <div className="relative mx-auto flex h-[56px] max-w-[1180px] items-center justify-between px-4 sm:px-6 md:h-[60px]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to bag"
          className={`group flex h-[38px] shrink-0 items-center gap-2 rounded-full border border-[#e5e5ea] bg-white px-3 text-[12px] font-semibold text-[#2a2a31] transition-colors hover:border-[#c8c8cf] hover:bg-[#f3f3f5] sm:px-4 ${focusRing}`}
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          <span className="hidden sm:inline">Back to bag</span>
        </button>

        <Link
          href="/"
          className="absolute left-1/2 flex -translate-x-1/2 items-center rounded-md transition-opacity hover:opacity-75 active:opacity-60"
        >
          <BrandLogo priority />
        </Link>

        <div className="hidden shrink-0 items-center gap-1.5 text-[11px] font-medium text-[#8a8a93] sm:flex">
          <ShieldCheck size={13} className="text-emerald-500" />
          Secure checkout
        </div>
        <div className="w-[38px] sm:hidden" aria-hidden="true" />
      </div>
    </header>
  );
}

function CheckoutSteps({ step, canPay, onGoTo }) {
  const items = [
    { key: 'bag', label: 'Bag', state: 'done', href: '/cart' },
    { key: 1, label: 'Delivery', state: step > 1 ? 'done' : 'current' },
    { key: 2, label: 'Payment', state: step === 2 ? 'current' : 'upcoming' },
  ];

  return (
    <ol aria-label="Checkout progress" className="flex items-center gap-2 text-[12px] font-medium">
      {items.map((item, i) => {
        const dot = (
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
              item.state === 'done'
                ? 'bg-[#f5f0fd] text-[#7c3aed]'
                : item.state === 'current'
                  ? 'text-white'
                  : 'border border-[#e5e5ea] text-[#a1a1aa]'
            }`}
            style={item.state === 'current' ? { background: GRADIENT } : undefined}
          >
            {item.state === 'done' ? <Check size={11} strokeWidth={3} /> : i}
          </span>
        );
        const tone = item.state === 'upcoming' ? 'text-[#a1a1aa]' : 'text-[#2a2a31]';
        const clickable = item.href || (item.state === 'done') || (item.key === 2 && canPay && item.state === 'upcoming');

        let node;
        if (item.href) {
          node = (
            <Link href={item.href} className={`flex items-center gap-1.5 rounded-full ${tone} hover:text-[#7c3aed] ${focusRing}`}>
              {dot}{item.label}
            </Link>
          );
        } else if (clickable) {
          node = (
            <button type="button" onClick={() => onGoTo(item.key)} className={`flex items-center gap-1.5 rounded-full ${tone} hover:text-[#7c3aed] ${focusRing}`}>
              {dot}{item.label}
            </button>
          );
        } else {
          node = (
            <span aria-current={item.state === 'current' ? 'step' : undefined} className={`flex items-center gap-1.5 ${tone}`}>
              {dot}{item.label}
            </span>
          );
        }

        return (
          <li key={item.key} className="flex items-center gap-2">
            {node}
            {i < items.length - 1 && <span aria-hidden="true" className="h-px w-5 bg-[#e5e5ea] sm:w-8" />}
          </li>
        );
      })}
    </ol>
  );
}

function CheckoutSkeleton() {
  return (
    <div role="status" className="mt-5 grid grid-cols-1 gap-6 motion-safe:animate-pulse sm:mt-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
      <span className="sr-only">Loading checkout</span>
      <div className="space-y-4">
        <div className="h-52 rounded-2xl bg-[#f5f5f7]" />
        <div className="h-14 rounded-full bg-[#f5f5f7]" />
      </div>
      <div className="hidden h-96 rounded-2xl bg-[#f5f5f7] lg:block" />
    </div>
  );
}

/* ── Building blocks ───────────────────────────────────────────── */

function RadioDot({ checked }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        checked ? 'border-transparent' : 'border-[#d4d4dc] bg-white'
      }`}
      style={checked ? { background: GRADIENT } : undefined}
    >
      {checked && <span className="h-2 w-2 rounded-full bg-white" />}
    </span>
  );
}

function DefaultBadge() {
  return (
    <span className="rounded-full bg-[#f5f0fd] px-2 py-0.5 text-[10.5px] font-semibold text-[#7c3aed]">Default</span>
  );
}

function SummaryRow({ label, value, positive = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[#5a5a64]">{label}</dt>
      <dd className={`font-semibold tabular-nums ${positive ? 'text-emerald-600' : 'text-[#111114]'}`}>{value}</dd>
    </div>
  );
}

function OrderSummaryContent({ items, totalQty, subtotal, discountAmount, couponCode, pointsDiscount, shipping, giftWrapFee, tax, total, scrollItems = false }) {
  return (
    <>
      <ul className={`space-y-3 ${scrollItems ? 'max-h-[280px] overflow-y-auto pr-1 pt-1.5' : 'pt-1.5'}`}>
        {items.map(item => (
          <li key={item.id} className="flex items-center gap-3">
            <div className="relative h-14 w-14 shrink-0 rounded-xl border border-[#eeeef1] bg-[#f7f7f9] p-1.5">
              <ImageWithFallback src={item.image} alt={item.name} className="h-full w-full object-contain mix-blend-multiply" />
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2a2a31] px-1 text-[10.5px] font-semibold tabular-nums text-white">
                {item.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[13px] font-medium leading-snug text-[#111114]">{item.name}</p>
              {item.brand && <p className="truncate text-[11.5px] text-[#8a8a93]">{item.brand}</p>}
            </div>
            <p className="shrink-0 text-[13px] font-semibold tabular-nums text-[#111114]">{fmt(item.price * item.quantity)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-5 space-y-2.5 border-t border-[#eeeef1] pt-4 text-[13.5px]">
        <SummaryRow label={`Subtotal (${totalQty} ${totalQty === 1 ? 'item' : 'items'})`} value={fmt(subtotal)} />
        {discountAmount > 0 && (
          <SummaryRow label={`Promo${couponCode ? ` (${couponCode})` : ''}`} value={`−${fmt(discountAmount)}`} positive />
        )}
        {pointsDiscount > 0 && <SummaryRow label="Loyalty points" value={`−${fmt(pointsDiscount)}`} positive />}
        <SummaryRow label="Shipping" value={shipping === 0 ? 'Free' : fmt(shipping)} positive={shipping === 0} />
        {giftWrapFee > 0 && <SummaryRow label="Gift wrap" value={fmt(giftWrapFee)} />}
      </dl>

      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-[#e5e5ea] pt-4">
        <span className="text-[15px] font-semibold text-[#111114]">Total</span>
        <span className="text-[22px] font-bold tabular-nums text-[#111114]">{fmt(total)}</span>
      </div>
      <p className="mt-1 text-right text-[11.5px] text-[#8a8a93]">Includes VAT of {fmt(tax)}</p>
    </>
  );
}

function ToggleRow({ icon, title, description, checked, onChange, disabled = false }) {
  return (
    <label className={`flex items-center gap-3 py-3.5 has-[:focus-visible]:rounded-lg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#9869f7]/40 ${disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f0fd] text-[#9869f7]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium text-[#111114]">{title}</span>
        <span className="block text-[12px] text-[#8a8a93]">{description}</span>
      </span>
      <input type="checkbox" role="switch" className="sr-only" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? '' : 'bg-[#e5e5ea]'}`}
        style={checked ? { background: GRADIENT } : undefined}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </span>
    </label>
  );
}

function PaymentOption({ value, checked, onSelect, icon, title, description, children }) {
  return (
    <div
      className={`overflow-hidden rounded-xl border transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#9869f7]/40 ${
        checked ? 'border-[#9869f7] bg-[#faf7ff]' : 'border-[#e5e5ea] bg-white hover:border-[#c8c8cf]'
      }`}
    >
      <label className="flex cursor-pointer items-center gap-3 p-4">
        <input type="radio" name="payment-method" value={value} className="sr-only" checked={checked} onChange={onSelect} />
        <RadioDot checked={checked} />
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold text-[#111114]">{title}</span>
          <span className="block text-[12px] text-[#8a8a93]">{description}</span>
        </span>
        <span className="shrink-0">{icon}</span>
      </label>
      {checked && children}
    </div>
  );
}

function AddAddressTile({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[120px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#e5e5ea] text-[#8a8a93] transition-colors hover:border-[#9869f7] hover:bg-[#faf7ff] hover:text-[#7c3aed] ${focusRing}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-current">
        <Plus size={16} />
      </span>
      <span className="text-[13px] font-medium">{label}</span>
    </button>
  );
}

function AddressActions({ name, onEdit, onRemove, canRemove }) {
  return (
    <>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${name}`}
        className={`flex h-10 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-[#5a5a64] transition-colors hover:bg-white hover:text-[#111114] ${focusRing}`}
      >
        <Pencil size={13} /> Edit
      </button>
      {/* Addresses used by past orders can't be deleted server-side */}
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className={`flex h-10 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-red-500 transition-colors hover:bg-white hover:text-red-700 ${focusRing}`}
        >
          <Trash2 size={13} /> Remove
        </button>
      )}
    </>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */

export default function CheckoutPage() {
  const {
    cartItems, clearCart, subtotal, appliedCoupon, discountAmount, finalTotal,
    applyCoupon, removeCoupon, couponError, selectedShippingAddressId, setSelectedShippingAddressId, isCartReady,
  } = useCart();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { fetchLoyalty } = useAppContext();
  const fetchWithAuth = useMemo(() => createFetchWithAuth(logout), [logout]);
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(selectedShippingAddressId);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [formData, setFormData] = useState({ paymentMethod: 'cashOnDelivery', giftWrap: false, giftMessage: '', newsletter: false });
  const [loyaltyLoaded, setLoyaltyLoaded] = useState(false);
  const [isTabbyLoading, setIsTabbyLoading] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  // Set when the card was charged but creating the order failed, so the order can be
  // retried against the same payment instead of charging the customer again.
  const [paidIntentId, setPaidIntentId] = useState(null);
  const piCreatedRef = useRef(false);
  const prevClientSecretRef = useRef('');

  const method = formData.paymentMethod;
  const hasStockIssues = cartItems.some(item => item.stock_quantity === 0 || item.quantity > item.stock_quantity);
  const selectedAddress = shippingAddresses.find(a => a.id === selectedAddressId) || null;
  const totalQty = cartItems.reduce((s, i) => s + i.quantity, 0);
  const shipping = calcShipping(totalQty);
  // Prices are VAT-inclusive: VAT is extracted from the total, never added to
  // it. lib/vat.js is the same module the order API uses to re-check this.
  const giftWrapFee = formData.giftWrap ? GIFT_WRAP_FEE : 0;
  const redeemablePoints = Math.floor(loyaltyPoints / POINTS_BLOCK) * POINTS_BLOCK;
  // One discount per order — a promo code and a points redemption are mutually
  // exclusive, and the order API rejects any request carrying both.
  const pointsLocked = !!appliedCoupon;
  const pointsDiscount = usePoints && !pointsLocked ? (redeemablePoints / POINTS_BLOCK) * AED_PER_BLOCK : 0;
  const total = Math.max(0, finalTotal + shipping + giftWrapFee - pointsDiscount);
  const tax = vatFromGross(total);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth?callbackUrl=/checkout');
  }, [authLoading, isAuthenticated, router]);

  const fetchShippingAddresses = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetchWithAuth(`/api/users/${user.id}/addresses`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setShippingAddresses(list);
      if (list.length > 0 && !selectedShippingAddressId) {
        const def = list.find(isDefaultAddress);
        setSelectedAddressId(def ? def.id : list[0].id);
      }
    } catch {
      // leave the list empty — the "add an address" option is still available
    } finally {
      setAddressesLoaded(true);
    }
  }, [user, selectedShippingAddressId, fetchWithAuth]);

  useEffect(() => {
    if (user) {
      fetchShippingAddresses();
      fetchWithAuth(`/api/users/${user.id}/loyalty`)
        .then(r => r.json())
        .then(d => { setLoyaltyPoints(d.stats?.points || 0); setLoyaltyLoaded(true); })
        .catch(() => setLoyaltyLoaded(true));
    }
  }, [user, fetchShippingAddresses, fetchWithAuth]);

  useEffect(() => { setStripePromise(loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)); }, []);

  useEffect(() => {
    if (formData.paymentMethod !== 'card' || total <= 0 || !loyaltyLoaded || piCreatedRef.current) return;
    piCreatedRef.current = true;
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.round(total * 100), currency: 'aed' }),
    })
      .then(r => r.json())
      .then(d => { prevClientSecretRef.current = d.clientSecret; setClientSecret(d.clientSecret); })
      .catch(() => { piCreatedRef.current = false; });
  }, [formData.paymentMethod, total, loyaltyLoaded]);

  // When total-affecting options change, cancel old PI and create a new one (H5)
  useEffect(() => {
    const oldSecret = prevClientSecretRef.current;
    if (oldSecret) {
      const oldPiId = oldSecret.split('_secret_')[0];
      fetch('/api/cancel-payment-intent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentIntentId: oldPiId }) }).catch(() => {});
      prevClientSecretRef.current = '';
    }
    piCreatedRef.current = false;
    setClientSecret('');
  }, [formData.giftWrap, usePoints, appliedCoupon]);

  useEffect(() => { setSelectedShippingAddressId(selectedAddressId); }, [selectedAddressId, setSelectedShippingAddressId]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [currentStep]);

  // Recovery payload for /order-confirmation if a card payment redirects away
  useEffect(() => {
    if (formData.paymentMethod !== 'card' || !selectedAddressId || !user?.id || cartItems.length === 0) return;
    const shippingDate = new Date();
    shippingDate.setDate(shippingDate.getDate() + 7);
    const pendingOrderData = {
      user_address_id: selectedAddressId,
      payment_method: 'card',
      subtotal: parseFloat(subtotal.toFixed(2)),
      shipping_cost: parseFloat(shipping.toFixed(2)),
      total_amount: parseFloat(total.toFixed(2)),
      shipping_scheduled_date: shippingDate.toISOString(),
      user_id: user.id,
      items: cartItems.map(i => ({ productId: i.id, quantity: i.quantity, price: i.price })),
      taxAmount: parseFloat(tax.toFixed(2)),
      applied_coupon_id: appliedCoupon ? appliedCoupon.id : null,
      discount_amount: parseFloat((discountAmount || 0).toFixed(2)),
      redeemed_points: usePoints && !pointsLocked ? redeemablePoints : 0,
      points_discount: pointsDiscount,
      gift_wrap: formData.giftWrap,
      gift_wrap_cost: giftWrapFee,
    };
    sessionStorage.setItem('pendingCardOrder', JSON.stringify(pendingOrderData));
  }, [formData.paymentMethod, formData.giftWrap, selectedAddressId, user, subtotal, total, cartItems, discountAmount, usePoints, pointsLocked, redeemablePoints, appliedCoupon, giftWrapFee, pointsDiscount, shipping, tax]);

  // Record checkout progress so abandoned checkouts show up in the admin portal
  useEffect(() => {
    if (!user?.id || !isCartReady || cartItems.length === 0 || isPlacingOrder) return;
    const timer = setTimeout(() => {
      fetch('/api/checkout/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: currentStep === 1 ? 'address' : 'payment',
          paymentMethod: formData.paymentMethod,
          addressId: selectedAddressId,
          total: parseFloat(total.toFixed(2)),
          items: cartItems.map(i => ({ productId: i.id, quantity: i.quantity })),
        }),
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [user?.id, isCartReady, cartItems, isPlacingOrder, currentStep, formData.paymentMethod, selectedAddressId, total]);

  const openAddressModal = (addr) => { setEditingAddress(addr); setIsAddressModalOpen(true); };
  const closeAddressModal = () => { setEditingAddress(null); setIsAddressModalOpen(false); };

  const handleCheckoutAddressSave = async (addressData) => {
    if (!user) return;
    const httpMethod = editingAddress ? 'PUT' : 'POST';
    const endpoint = editingAddress
      ? `/api/users/${user.id}/addresses/${editingAddress.id}`
      : `/api/users/${user.id}/addresses`;
    const res = await fetchWithAuth(endpoint, {
      method: httpMethod,
      body: JSON.stringify({
        address_line1: addressData.addressLine1,
        address_line2: addressData.apartment || addressData.addressLine2,
        city: addressData.city, zip_code: addressData.zipCode || '0000',
        country: addressData.country || 'United Arab Emirates',
        state: addressData.state || '',
        customer_phone: addressData.customerPhone,
        address_label: addressData.addressLabel || addressData.addressLine1,
        is_default: addressData.isDefault || false,
        latitude: addressData.latitude, longitude: addressData.longitude,
      }),
    });
    if (!res.ok) throw new Error('Failed to save address');
    closeAddressModal();
    fetchShippingAddresses();
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      const res = await fetchWithAuth(`/api/users/${user.id}/addresses/${id}`, { method: 'DELETE' });
      if (!res.ok) { toast.error("This address can't be removed."); return; }
      fetchShippingAddresses();
      if (selectedAddressId === id) setSelectedAddressId(null);
    } catch { toast.error('Error deleting address.'); }
  };

  const handleTabbyCheckout = async () => {
    if (!selectedAddressId) { toast.error('Please select a shipping address.'); return; }
    const addr = shippingAddresses.find(a => a.id === selectedAddressId);
    if (!addr) { toast.error('Selected address not found.'); return; }
    setIsTabbyLoading(true);
    try {
      const shippingDate = new Date();
      shippingDate.setDate(shippingDate.getDate() + 7);
      sessionStorage.setItem('pendingTabbyOrder', JSON.stringify({
        user_address_id: selectedAddressId,
        subtotal: parseFloat(subtotal.toFixed(2)),
        shipping_cost: parseFloat(shipping.toFixed(2)),
        total_amount: parseFloat(total.toFixed(2)),
        shipping_scheduled_date: shippingDate.toISOString(),
        user_id: user.id,
        items: cartItems.map(i => ({ productId: i.id, quantity: i.quantity, price: i.price })),
        taxAmount: parseFloat(tax.toFixed(2)),
        applied_coupon_id: appliedCoupon ? appliedCoupon.id : null,
        discount_amount: parseFloat((discountAmount || 0).toFixed(2)),
        redeemed_points: usePoints && !pointsLocked ? redeemablePoints : 0,
        points_discount: pointsDiscount,
        gift_wrap: formData.giftWrap,
        gift_wrap_cost: giftWrapFee,
      }));
      const res = await fetch('/api/tabby/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          items: cartItems.map(i => ({ id: i.id, productId: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image || '', productUrl: `${window.location.origin}/product/${i.id}` })),
          buyer: { email: user.email, name: user.name || user.first_name || '', phone: addr.customerPhone || addr.customer_phone || '' },
          shippingAddress: { city: addr.city || 'Dubai', address: addressLine(addr), zip: addr.zipCode || addr.zip_code || '00000' },
          taxAmount: tax, shippingAmount: shipping, discountAmount: discountAmount || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Tabby checkout failed.'); setIsTabbyLoading(false); return; }
      window.location.href = data.webUrl;
    } catch {
      toast.error('Could not connect to Tabby. Please try another payment method.');
      setIsTabbyLoading(false);
    }
  };

  const buildOrderData = (extra = {}) => {
    const shippingDate = new Date();
    shippingDate.setDate(shippingDate.getDate() + 7);
    return {
      user_address_id: selectedAddressId,
      payment_method: formData.paymentMethod,
      subtotal: parseFloat(subtotal.toFixed(2)),
      shipping_cost: parseFloat(shipping.toFixed(2)),
      total_amount: parseFloat(total.toFixed(2)),
      shipping_scheduled_date: shippingDate.toISOString(),
      user_id: user.id,
      items: cartItems.map(i => ({ productId: i.id, quantity: i.quantity, price: i.price })),
      taxAmount: tax,
      applied_coupon_id: appliedCoupon ? appliedCoupon.id : null,
      discount_amount: discountAmount,
      redeemed_points: usePoints && !pointsLocked ? redeemablePoints : 0,
      points_discount: pointsDiscount,
      gift_wrap: formData.giftWrap,
      gift_wrap_cost: giftWrapFee,
      gift_message: formData.giftMessage || null,
      stripe_payment_intent_id: null,
      ...extra,
    };
  };

  // POST the order and route to confirmation. Returns true on success.
  const postOrder = async (orderData) => {
    try {
      const res = await fetchWithAuth('/api/orders', { method: 'POST', body: JSON.stringify(orderData) });
      const result = await res.json();
      if (res.status === 409 || res.ok) {
        // 409 = an order already exists for this payment, which is also a success
        sessionStorage.removeItem('pendingCardOrder');
        clearCart();
        // Refresh the global loyalty balance so the header/nav reflect redeemed/pending points
        fetchLoyalty?.();
        router.push(`/order-confirmed/${result.orderId}`);
        return true;
      }
      toast.error(result.message || 'Error placing order. Please contact support.');
      return false;
    } catch {
      toast.error('Error placing order. Please contact support.');
      return false;
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || !selectedAddressId || isPlacingOrder) return;
    setIsPlacingOrder(true);
    const ok = await postOrder(buildOrderData());
    if (!ok) setIsPlacingOrder(false);
  };

  // The card form charges the card, so the order is created in the same click —
  // there is no separate "place order" step after the money has been taken.
  const handleCardPaid = async (piId) => {
    setIsPlacingOrder(true);
    const ok = await postOrder(buildOrderData({ payment_method: 'card', stripe_payment_intent_id: piId }));
    if (!ok) {
      setPaidIntentId(piId);
      setIsPlacingOrder(false);
    }
  };

  const retryPaidOrder = async () => {
    if (!paidIntentId || isPlacingOrder) return;
    setIsPlacingOrder(true);
    const ok = await postOrder(buildOrderData({ payment_method: 'card', stripe_payment_intent_id: paidIntentId }));
    if (!ok) setIsPlacingOrder(false);
  };

  // Apple Pay / Google Pay express button: pay + place the order in one tap.
  // Wallet payments settle through Stripe, so they are recorded as a 'card' order.
  const handleWalletPayment = async (piId) => {
    if (!user || !selectedAddressId) { toast.error('Please select a shipping address first.'); return; }
    setIsPlacingOrder(true);
    const ok = await postOrder(buildOrderData({ payment_method: 'card', stripe_payment_intent_id: piId }));
    if (!ok) setIsPlacingOrder(false);
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code || isApplyingCoupon) return;
    if (usePoints) {
      setUsePoints(false);
      toast('Loyalty points removed — an order takes either a promo code or points.');
    }
    setIsApplyingCoupon(true);
    try { await applyCoupon(code); } finally { setIsApplyingCoupon(false); }
  };

  const goToStep = (step) => {
    if (step === 2 && !selectedAddressId) return;
    if (step === 1) setShowAddressPicker(false);
    setCurrentStep(step);
  };

  const handlePrimary = () => {
    if (currentStep === 1) {
      if (!selectedAddressId) { toast.error('Please choose a delivery address.'); return; }
      goToStep(2);
    } else if (method === 'tabby') {
      handleTabbyCheckout();
    } else if (method === 'cashOnDelivery') {
      handlePlaceOrder();
    }
  };

  if (!authLoading && !isAuthenticated) return null;

  const pageReady = !authLoading && isCartReady && addressesLoaded;
  // After an order succeeds the cart is cleared before navigation finishes; don't flash "empty".
  const bagEmpty = isCartReady && cartItems.length === 0 && !isPlacingOrder;
  // With card selected, the card form's own "Pay" button is the action.
  const showPrimary = !(currentStep === 2 && method === 'card');
  const primaryDisabled = isPlacingOrder || isTabbyLoading || hasStockIssues || (currentStep === 1 && !selectedAddressId);
  const showMobileBar = pageReady && !bagEmpty && showPrimary;

  let desktopLabel = 'Continue to payment';
  let mobileLabel = 'Continue to payment';
  if (currentStep === 2) {
    if (method === 'tabby') { desktopLabel = `Continue to Tabby · ${fmt(total)}`; mobileLabel = 'Continue to Tabby'; }
    else { desktopLabel = `Place order · ${fmt(total)}`; mobileLabel = 'Place order'; }
  }

  const summaryProps = {
    items: cartItems,
    totalQty,
    subtotal,
    discountAmount,
    couponCode: appliedCoupon?.code,
    pointsDiscount,
    shipping,
    giftWrapFee,
    tax,
    total,
  };

  const deliveryStep = (
    <motion.section
      key="delivery"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      aria-labelledby="delivery-heading"
      className={`${cardClass} p-5 sm:p-6`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="delivery-heading" className="text-[18px] font-semibold text-[#111114]">Delivery address</h2>
          <p className="mt-0.5 text-[13px] text-[#8a8a93]">Where should we deliver your order?</p>
        </div>
        {selectedAddress && showAddressPicker && (
          <button
            type="button"
            onClick={() => setShowAddressPicker(false)}
            className={`h-10 shrink-0 rounded-full px-3 text-[13px] font-semibold text-[#7c3aed] transition-colors hover:bg-[#f5f0fd] ${focusRing}`}
          >
            Done
          </button>
        )}
      </div>

      <div className="mt-4">
        {shippingAddresses.length === 0 ? (
          <AddAddressTile onClick={() => openAddressModal(null)} label="Add a delivery address" />
        ) : showAddressPicker || !selectedAddress ? (
          <div role="radiogroup" aria-labelledby="delivery-heading" className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {shippingAddresses.map(addr => {
              const checked = selectedAddressId === addr.id;
              const name = addressName(addr, user?.name);
              return (
                <div
                  key={addr.id}
                  className={`rounded-xl border transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#9869f7]/40 ${
                    checked ? 'border-[#9869f7] bg-[#faf7ff]' : 'border-[#e5e5ea] bg-white hover:border-[#c8c8cf]'
                  }`}
                >
                  <label className="flex cursor-pointer items-start gap-3 p-4">
                    <input
                      type="radio"
                      name="delivery-address"
                      className="sr-only"
                      checked={checked}
                      onChange={() => setSelectedAddressId(addr.id)}
                    />
                    <RadioDot checked={checked} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] font-semibold text-[#111114]">{name}</span>
                        {isDefaultAddress(addr) && <DefaultBadge />}
                      </span>
                      <span className="mt-1 block text-[13px] text-[#5a5a64]">{addressLine(addr)}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-[12px] text-[#8a8a93]">
                        <MapPin size={11} className="shrink-0" />
                        {[addr.city, addr.country].filter(Boolean).join(', ')}
                      </span>
                    </span>
                  </label>
                  <div className="flex items-center gap-1 border-t border-[#eeeef1] px-2 py-1">
                    <AddressActions
                      name={name}
                      onEdit={() => openAddressModal(addr)}
                      onRemove={() => handleDeleteAddress(addr.id)}
                      canRemove={addr.isDeletable !== false}
                    />
                  </div>
                </div>
              );
            })}
            <AddAddressTile onClick={() => openAddressModal(null)} label="Add new address" />
          </div>
        ) : (
          <div className="rounded-xl border border-[#9869f7] bg-[#faf7ff]">
            <div className="flex items-start gap-3 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#ece3fb] bg-white text-[#9869f7]">
                <MapPin size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-semibold text-[#111114]">{addressName(selectedAddress, user?.name)}</span>
                  {isDefaultAddress(selectedAddress) && <DefaultBadge />}
                </p>
                <p className="mt-1 text-[13px] text-[#5a5a64]">{addressLine(selectedAddress)}</p>
                <p className="mt-0.5 text-[12px] text-[#8a8a93]">
                  {[selectedAddress.city, selectedAddress.country].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1 border-t border-[#ece3fb] px-2 py-1">
              <button
                type="button"
                onClick={() => setShowAddressPicker(true)}
                className={`flex h-10 items-center rounded-full px-3 text-[12.5px] font-semibold text-[#7c3aed] transition-colors hover:bg-white ${focusRing}`}
              >
                Change address
              </button>
              <AddressActions
                name={addressName(selectedAddress, user?.name)}
                onEdit={() => openAddressModal(selectedAddress)}
                onRemove={() => handleDeleteAddress(selectedAddress.id)}
                canRemove={selectedAddress.isDeletable !== false}
              />
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );

  const paymentStep = (
    <motion.div
      key="payment"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="space-y-4"
    >
      {/* Delivery recap */}
      {selectedAddress && (
        <section aria-label="Delivery address" className={`${cardClass} flex items-center gap-3 p-4 sm:px-5`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f0fd] text-[#9869f7]">
            <MapPin size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-[#8a8a93]">Delivering to</p>
            <p className="truncate text-[14px] font-semibold text-[#111114]">{addressName(selectedAddress, user?.name)}</p>
            <p className="truncate text-[12.5px] text-[#5a5a64]">
              {[addressLine(selectedAddress), selectedAddress.city].filter(Boolean).join(', ')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setShowAddressPicker(true); setCurrentStep(1); }}
            className={`h-10 shrink-0 rounded-full px-3 text-[13px] font-semibold text-[#7c3aed] transition-colors hover:bg-[#f5f0fd] ${focusRing}`}
          >
            Change
          </button>
        </section>
      )}

      {/* Savings & extras — before payment, so the total is final when you pay */}
      <section aria-labelledby="extras-heading" className={`${cardClass} p-5 sm:p-6`}>
        <h2 id="extras-heading" className="text-[18px] font-semibold text-[#111114]">Savings &amp; extras</h2>

        <div className="mt-2 divide-y divide-[#eeeef1]">
          <div className="py-3.5">
            {appliedCoupon ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2">
                <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-emerald-700">
                  <Check size={14} className="shrink-0" />
                  <span className="truncate">{appliedCoupon.code} applied · −{fmt(discountAmount)}</span>
                </span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className={`h-9 shrink-0 rounded-full px-2 text-[12px] font-semibold text-emerald-700 hover:underline ${focusRing}`}
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setPromoOpen(o => !o)}
                  aria-expanded={promoOpen}
                  aria-controls="checkout-promo"
                  className={`flex w-full items-center gap-3 rounded-lg text-left ${focusRing}`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f0fd] text-[#9869f7]">
                    <Tag size={16} />
                  </span>
                  <span className="min-w-0 flex-1 text-[14px] font-medium text-[#111114]">Add a promo code</span>
                  <ChevronDown size={16} className={`shrink-0 text-[#8a8a93] transition-transform ${promoOpen ? 'rotate-180' : ''}`} />
                </button>
                {promoOpen && (
                  <div id="checkout-promo" className="mt-3">
                    <form onSubmit={e => { e.preventDefault(); handleApplyCoupon(); }} className="flex gap-2">
                      <label htmlFor="checkout-promo-code" className="sr-only">Promo code</label>
                      <input
                        id="checkout-promo-code"
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value); if (couponError) removeCoupon(); }}
                        placeholder="Enter code"
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        enterKeyHint="done"
                        aria-invalid={!!couponError}
                        aria-describedby={couponError ? 'checkout-promo-error' : undefined}
                        className="h-11 min-w-0 flex-1 rounded-xl border border-[#e5e5ea] bg-white px-3.5 text-[16px] text-[#111114] placeholder:text-[#b4b4bb] focus:border-[#9869f7] focus:outline-none focus:ring-2 focus:ring-[#9869f7]/15 lg:text-[14px]"
                      />
                      <button
                        type="submit"
                        disabled={!couponCode.trim() || isApplyingCoupon}
                        className="inline-flex h-11 min-w-[84px] items-center justify-center rounded-xl px-5 text-[13px] font-semibold text-white transition-opacity disabled:opacity-40"
                        style={{ background: GRADIENT }}
                      >
                        {isApplyingCoupon
                          ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-label="Applying" />
                          : 'Apply'}
                      </button>
                    </form>
                    {couponError && (
                      <p id="checkout-promo-error" role="alert" className="mt-2 text-[12px] font-medium text-red-600">{couponError}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {redeemablePoints > 0 && (
            <ToggleRow
              icon={<Star size={16} />}
              title="Use loyalty points"
              description={pointsLocked
                ? `Remove ${appliedCoupon.code} to redeem points — an order takes one discount`
                : `Redeem ${redeemablePoints.toLocaleString()} of ${loyaltyPoints.toLocaleString()} points · −${fmt((redeemablePoints / POINTS_BLOCK) * AED_PER_BLOCK)}`}
              checked={usePoints && !pointsLocked}
              onChange={setUsePoints}
              disabled={pointsLocked}
            />
          )}

          <ToggleRow
            icon={<Gift size={16} />}
            title="Gift wrap"
            description={`Naya signature packaging · +${fmt(GIFT_WRAP_FEE)}`}
            checked={formData.giftWrap}
            onChange={checked => setFormData(p => ({ ...p, giftWrap: checked }))}
          />
        </div>

        {method === 'card' && (
          <p className="mt-2 text-[11.5px] text-[#8a8a93]">Changing these refreshes the card form, so set them before entering your card.</p>
        )}
      </section>

      {/* Payment */}
      <section aria-labelledby="payment-heading" className={`${cardClass} p-5 sm:p-6`}>
        <h2 id="payment-heading" className="text-[18px] font-semibold text-[#111114]">Payment</h2>
        <p className="mt-0.5 text-[13px] text-[#8a8a93]">All transactions are secure and encrypted.</p>

        <div className="mt-4">
          <ExpressCheckoutButton
            stripePromise={stripePromise}
            amount={Math.round(total * 100)}
            disabled={isPlacingOrder || hasStockIssues}
            onBeforePay={() => {
              if (!selectedAddressId) { toast.error('Please select a shipping address first.'); return false; }
              if (total <= 0) return false;
              return true;
            }}
            onSuccess={handleWalletPayment}
          />
        </div>

        <div role="radiogroup" aria-labelledby="payment-heading" className="space-y-2.5">
          <PaymentOption
            value="card"
            checked={method === 'card'}
            onSelect={() => setFormData(p => ({ ...p, paymentMethod: 'card' }))}
            icon={<CreditCard size={20} strokeWidth={1.6} className="text-[#5a5a64]" />}
            title="Credit or debit card"
            description="Visa, Mastercard, Amex"
          >
            <div className="border-t border-[#ece3fb] bg-white p-4 sm:p-5">
              {paidIntentId ? (
                <p className="text-[13px] text-[#5a5a64]">Your card has already been charged — use “Try again” above to finish your order.</p>
              ) : hasStockIssues ? (
                <p className="text-[13px] text-[#5a5a64]">Update your bag before paying.</p>
              ) : clientSecret && stripePromise ? (
                <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm onSuccessfulPayment={handleCardPaid} buttonLabel={`Pay ${fmt(total)}`} clientSecret={clientSecret} />
                </Elements>
              ) : (
                <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-[#8a8a93]">
                  <Loader2 size={18} className="animate-spin text-[#9869f7]" />
                  Preparing secure card form…
                </div>
              )}
            </div>
          </PaymentOption>

          <PaymentOption
            value="cashOnDelivery"
            checked={method === 'cashOnDelivery'}
            onSelect={() => setFormData(p => ({ ...p, paymentMethod: 'cashOnDelivery' }))}
            icon={<Banknote size={20} strokeWidth={1.6} className="text-[#5a5a64]" />}
            title="Cash on delivery"
            description="Pay when your order arrives"
          />

          <PaymentOption
            value="tabby"
            checked={method === 'tabby'}
            onSelect={() => setFormData(p => ({ ...p, paymentMethod: 'tabby' }))}
            icon={<Image src="/0x0.png" alt="" width={32} height={32} className="h-8 w-8 rounded-lg object-cover" />}
            title="Pay in 4 with Tabby"
            description={`4 × ${fmt(total / 4)} · No interest`}
          >
            <div className="border-t border-[#ece3fb] bg-white p-4 sm:p-5">
              <TabbyCard price={total} />
            </div>
          </PaymentOption>
        </div>
      </section>
    </motion.div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className={`min-h-screen bg-white lg:pb-16 ${showMobileBar ? 'pb-32' : 'pb-16'}`}>
        <FlowHeader onBack={() => router.push('/cart')} />

        <main className="mx-auto max-w-[1180px] px-4 pt-6 sm:px-6 sm:pt-8">
          <CheckoutSteps step={currentStep} canPay={!!selectedAddressId} onGoTo={goToStep} />
          <h1 className="mt-4 text-[26px] font-semibold tracking-tight text-[#111114] sm:text-[32px]">Checkout</h1>

          {!pageReady ? (
            <CheckoutSkeleton />
          ) : bagEmpty ? (
            <div className="flex flex-col items-center gap-5 py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f5f0fd]">
                <ShoppingBag size={30} strokeWidth={1.5} className="text-[#9869f7]" />
              </div>
              <div>
                <h2 className="text-[20px] font-semibold text-[#111114]">Your bag is empty</h2>
                <p className="mt-1.5 text-[14px] text-[#5a5a64]">Add something to your bag before checking out.</p>
              </div>
              <Link
                href="/all-products"
                className={`inline-flex h-12 items-center gap-2 rounded-full px-8 text-[14px] font-semibold text-white transition-transform active:scale-[0.98] ${focusRing}`}
                style={{ background: GRADIENT }}
              >
                Explore the collection
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 items-start gap-6 sm:mt-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
              <div className="min-w-0 space-y-4">
                {/* Mobile: collapsible summary with the total always visible */}
                <div className="-mx-4 border-y border-[#e5e5ea] bg-[#faf9fc] sm:mx-0 sm:rounded-2xl sm:border lg:hidden">
                  <button
                    type="button"
                    onClick={() => setSummaryOpen(o => !o)}
                    aria-expanded={summaryOpen}
                    aria-controls="mobile-order-summary"
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 ${focusRing}`}
                  >
                    <span className="flex items-center gap-2 text-[14px] font-medium text-[#7c3aed]">
                      <ShoppingBag size={16} />
                      {summaryOpen ? 'Hide' : 'Show'} order summary
                      <ChevronDown size={15} className={`transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
                    </span>
                    <span className="text-[16px] font-bold tabular-nums text-[#111114]">{fmt(total)}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {summaryOpen && (
                      <motion.div
                        id="mobile-order-summary"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-[#eeeef1] px-4 pb-4 pt-3">
                          <OrderSummaryContent {...summaryProps} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {paidIntentId && (
                  <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
                    <div className="flex gap-3">
                      <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-amber-900">Your payment went through, but we couldn&apos;t create your order</p>
                        <p className="mt-1 text-[13px] text-amber-800">
                          Trying again won&apos;t charge you twice. If it keeps failing, contact us with payment reference{' '}
                          <span className="break-all font-mono text-[12px]">{paidIntentId}</span>.
                        </p>
                        <button
                          type="button"
                          onClick={retryPaidOrder}
                          disabled={isPlacingOrder}
                          className="mt-3 h-10 rounded-full bg-amber-900 px-5 text-[13px] font-semibold text-white transition-opacity disabled:opacity-50"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {hasStockIssues && (
                  <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
                    <p className="text-[13px] text-red-800">
                      <span className="font-semibold">Some items aren&apos;t available in the quantity you chose.</span>{' '}
                      <Link href="/cart" className="font-semibold underline underline-offset-2">Update your bag</Link> to continue.
                    </p>
                  </div>
                )}

                <AnimatePresence mode="wait" initial={false}>
                  {currentStep === 1 ? deliveryStep : paymentStep}
                </AnimatePresence>

                {showPrimary && (
                  <button
                    type="button"
                    onClick={handlePrimary}
                    disabled={primaryDisabled}
                    className="hidden h-14 w-full items-center justify-center gap-2.5 rounded-full text-[15px] font-semibold text-white transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9869f7] focus-visible:ring-offset-2 lg:flex"
                    style={{ background: GRADIENT, boxShadow: '0 6px 22px rgba(152,105,247,.32)' }}
                  >
                    {desktopLabel}
                    <ArrowRight size={17} />
                  </button>
                )}
              </div>

              <aside className="hidden lg:sticky lg:top-[84px] lg:block">
                <section aria-labelledby="summary-heading" className={`${cardClass} p-6`}>
                  <h2 id="summary-heading" className="mb-4 text-[17px] font-semibold text-[#111114]">Order summary</h2>
                  <OrderSummaryContent {...summaryProps} scrollItems />
                  <ul className="mt-5 space-y-2.5 border-t border-[#e5e5ea] pt-4">
                    {[
                      { Icon: Lock, text: 'Secured transaction', color: 'text-emerald-500' },
                      { Icon: ShieldCheck, text: 'Authentic products', color: 'text-[#9869f7]' },
                      { Icon: RotateCcw, text: '14-day returns', color: 'text-[#9869f7]' },
                    ].map(({ Icon, text, color }) => (
                      <li key={text} className="flex items-center gap-2.5 text-[12px] text-[#5a5a64]">
                        <Icon size={13} className={color} /> {text}
                      </li>
                    ))}
                  </ul>
                </section>
              </aside>
            </div>
          )}
        </main>

        {showMobileBar && (
          <div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e5e5ea] bg-white/95 backdrop-blur-md lg:hidden"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto flex max-w-[640px] items-center gap-4 px-4 pt-3">
              <div className="min-w-0">
                <p className="text-[11px] leading-none text-[#8a8a93]">Total · VAT incl.</p>
                <p className="mt-1 text-[18px] font-bold leading-none tabular-nums text-[#111114]">{fmt(total)}</p>
              </div>
              <button
                type="button"
                onClick={handlePrimary}
                disabled={primaryDisabled}
                className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full px-4 text-[15px] font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9869f7] focus-visible:ring-offset-2"
                style={{ background: GRADIENT, boxShadow: '0 6px 20px rgba(152,105,247,.30)' }}
              >
                {mobileLabel}
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        <AnimatePresence>
          {(isPlacingOrder || isTabbyLoading) && (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] flex items-center justify-center bg-white/85 px-6 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <Loader2 size={30} className="animate-spin text-[#9869f7]" />
                <p className="text-[16px] font-semibold text-[#111114]">
                  {isTabbyLoading ? 'Taking you to Tabby…' : 'Placing your order…'}
                </p>
                <p className="text-[13px] text-[#8a8a93]">Please don&apos;t close or refresh this page.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Modal isOpen={isAddressModalOpen} onClose={closeAddressModal} title={editingAddress ? 'Edit address' : 'New address'} size="max-w-3xl">
          <AddressInputForm initialData={editingAddress} onSave={handleCheckoutAddressSave} onCancel={closeAddressModal} />
        </Modal>
      </div>
    </MotionConfig>
  );
}
