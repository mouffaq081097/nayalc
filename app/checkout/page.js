"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import BrandLogo from '../components/BrandLogo';
import { headingFont } from '../components/home/SectionHeading';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, MapPin, Lock, Check, Gift, ShieldCheck, Loader2,
  Pencil, Trash2, Plus, RotateCcw, ChevronDown, Star, AlertTriangle, ShoppingBag,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { createFetchWithAuth } from '../lib/api';
import { calcShipping, getPreorderInfo, getDeliveryInfo } from '@/lib/shipping';
import { orderableQty, preorderUnits, leadDays } from '@/lib/backorderRules';
import { POINTS_BLOCK, AED_PER_BLOCK } from '@/lib/loyalty';
import { vatFromGross } from '@/lib/vat';
import CheckoutForm from './CheckoutForm';
import ExpressCheckoutButton from './ExpressCheckoutButton';
import TabbyCard from '../components/TabbyCard';

const Modal = dynamic(() => import('../components/Modal'), { ssr: false });
const AddressInputForm = dynamic(() => import('../components/AddressInputForm'), { ssr: false });

// Storefront palette: ink actions and selections, warm off-white panels, lavender only for small accents
// Checkout action buttons: solid violet, 12px corners (one shape for every action in the flow)
const ACTION = '#5b35ec';
const ACCENT = 'rgb(147,104,236)';
// Must match app/api/orders/route.js, which rejects an order whose total drifts
// from its own calculation.
const GIFT_WRAP_FEE = 100;
// Redemption rate comes from lib/loyalty.js so checkout can never show a
// discount the order API would compute differently.

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111114]/30';
const cardClass = 'rounded-xl border border-[#e4e4e7] bg-white';

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
    <header className="sticky top-0 z-40 border-b border-[#ececec] bg-white">
      <div className="relative mx-auto flex h-[60px] max-w-[1240px] items-center justify-between px-4 sm:px-6 md:h-[72px] lg:px-8">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to bag"
          className={`group flex h-[38px] shrink-0 items-center gap-2 text-[13px] font-medium text-[#111114] transition-opacity hover:opacity-70 ${focusRing}`}
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
          <ShieldCheck size={14} className="text-[#111114]" />
          Secure checkout
        </div>
        <div className="w-[38px] sm:hidden" aria-hidden="true" />
      </div>
    </header>
  );
}

function CheckoutSkeleton() {
  return (
    <div role="status" className="mt-5 grid grid-cols-1 gap-6 motion-safe:animate-pulse sm:mt-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14">
      <span className="sr-only">Loading checkout</span>
      <div className="space-y-4">
        <div className="h-52 rounded-xl bg-[#f6f5f2]" />
        <div className="h-[52px] rounded-xl bg-[#f6f5f2]" />
      </div>
      <div className="hidden h-96 rounded-xl bg-[#f6f5f2] lg:block" />
    </div>
  );
}

/* ── Building blocks ───────────────────────────────────────────── */

function RadioDot({ checked }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        checked ? 'border-[#111114] bg-[#111114]' : 'border-[#d4d4dc] bg-white'
      }`}
    >
      {checked && <span className="h-2 w-2 rounded-full bg-white" />}
    </span>
  );
}

function DefaultBadge() {
  return (
    <span className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold text-white" style={{ background: ACCENT }}>Default</span>
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

function OrderSummaryContent({ items, totalQty, subtotal, discountAmount, couponCode, pointsDiscount, shipping, giftWrapFee, tax, total, promo = null, scrollItems = false }) {
  return (
    <>
      <ul className={`space-y-3 ${scrollItems ? 'max-h-[280px] overflow-y-auto pr-1 pt-1.5' : 'pt-1.5'}`}>
        {items.map(item => (
          <li key={item.id} className="flex items-center gap-3">
            <div className="h-16 w-14 shrink-0 bg-white p-1.5">
              <ImageWithFallback src={item.image} alt={item.name} className="h-full w-full object-contain mix-blend-multiply" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[13px] font-medium leading-snug text-[#111114]">{item.name}</p>
              <p className="truncate text-[11.5px] text-[#8a8a93]">
                {item.brand ? `${item.brand} · ` : ''}<span className="tabular-nums text-[#111114]">× {item.quantity}</span>
              </p>
              {preorderUnits(item, item.quantity) > 0 && (
                <p className="truncate text-[11.5px] font-semibold" style={{ color: ACCENT }}>
                  {preorderUnits(item, item.quantity) === item.quantity ? 'Pre-order' : `${preorderUnits(item, item.quantity)} on pre-order`}
                </p>
              )}
            </div>
            <p className="shrink-0 text-[13px] font-semibold tabular-nums text-[#111114]">{fmt(item.price * item.quantity)}</p>
          </li>
        ))}
      </ul>

      {promo && <div className="mt-5">{promo}</div>}

      <dl className="mt-5 space-y-2.5 border-t border-[#e2e0db] pt-4 text-[13.5px]">
        <SummaryRow label={`Subtotal (${totalQty} ${totalQty === 1 ? 'item' : 'items'})`} value={fmt(subtotal)} />
        {discountAmount > 0 && (
          <SummaryRow label={`Promo${couponCode ? ` (${couponCode})` : ''}`} value={`−${fmt(discountAmount)}`} positive />
        )}
        {pointsDiscount > 0 && <SummaryRow label="Loyalty points" value={`−${fmt(pointsDiscount)}`} positive />}
        <SummaryRow label="Shipping" value={shipping === 0 ? 'Free' : fmt(shipping)} positive={shipping === 0} />
        {giftWrapFee > 0 && <SummaryRow label="Gift wrap" value={fmt(giftWrapFee)} />}
      </dl>

      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-[#111114] pt-4">
        <span className="text-[15px] font-semibold text-[#111114]">Total</span>
        <span className="text-[22px] font-bold tabular-nums text-[#111114]">{fmt(total)}</span>
      </div>
      <p className="mt-1 text-right text-[11.5px] text-[#8a8a93]">Includes VAT of {fmt(tax)}</p>
    </>
  );
}

function ToggleRow({ icon, title, description, checked, onChange, disabled = false }) {
  return (
    <label className={`flex items-center gap-3 py-3.5 has-[:focus-visible]:rounded-lg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#111114]/30 ${disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f6f5f2] text-[#111114]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium text-[#111114]">{title}</span>
        <span className="block text-[12px] text-[#8a8a93]">{description}</span>
      </span>
      <input type="checkbox" role="switch" className="sr-only" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? 'bg-[#111114]' : 'bg-[#e5e5ea]'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </span>
    </label>
  );
}

/** One row of the payment list: radio, name, a short hint on the right; what it needs opens underneath. */
function PaymentOption({ value, checked, onSelect, title, hint, children }) {
  return (
    <div className="has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-[#111114]/30">
      <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5">
        <input type="radio" name="payment-method" value={value} className="sr-only" checked={checked} onChange={onSelect} />
        <RadioDot checked={checked} />
        <span className="min-w-0 flex-1 text-[14px] font-semibold text-[#111114]">{title}</span>
        <span className="shrink-0 text-[12px] text-[#8a8a93]">{hint}</span>
      </label>
      {checked && children && <div className="px-4 pb-4 sm:pl-12">{children}</div>}
    </div>
  );
}

function AddAddressTile({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[120px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#c8c8cf] text-[#5a5a64] transition-colors hover:border-[#111114] hover:bg-[#f6f5f2] hover:text-[#111114] ${focusRing}`}
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
    hasPreorder,
  } = useCart();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { fetchLoyalty } = useAppContext();
  const fetchWithAuth = useMemo(() => createFetchWithAuth(logout), [logout]);
  const router = useRouter();

  const [extrasOpen, setExtrasOpen] = useState(false);
  // From the card field: complete (ready to pay) and while a payment is processing
  const [cardStatus, setCardStatus] = useState({ ready: false, processing: false });
  // { applePay, googlePay } when this device has a wallet, else null (reported by ExpressCheckoutButton)
  const [wallet, setWallet] = useState(null);
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
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  // Set when the card was charged but creating the order failed, so the order can be
  // retried against the same payment instead of charging the customer again.
  const [paidIntentId, setPaidIntentId] = useState(null);
  const piCreatedRef = useRef(false);
  const prevClientSecretRef = useRef('');

  const method = formData.paymentMethod;
  const hasStockIssues = cartItems.some(item => orderableQty(item) === 0 || item.quantity > orderableQty(item));
  // A bag with pre-order units ships in one parcel once they arrive, and is paid up front
  const preorderShipBy = hasPreorder
    ? getPreorderInfo(Math.max(...cartItems.filter(i => preorderUnits(i, i.quantity) > 0).map(leadDays))).shipByLabel
    : '';
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

  // The wallet row disappears if the device stops offering one; don't leave it selected
  useEffect(() => {
    if (!wallet && formData.paymentMethod === 'wallet') {
      setFormData(p => ({ ...p, paymentMethod: hasPreorder ? 'card' : 'cashOnDelivery' }));
    }
  }, [wallet, formData.paymentMethod, hasPreorder]);

  // Cash on delivery isn't offered for pre-orders, so move a COD selection to card
  useEffect(() => {
    if (hasPreorder && formData.paymentMethod === 'cashOnDelivery') {
      setFormData(p => ({ ...p, paymentMethod: 'card' }));
    }
  }, [hasPreorder, formData.paymentMethod]);

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
          step: selectedAddressId ? 'payment' : 'address',
          paymentMethod: formData.paymentMethod,
          addressId: selectedAddressId,
          total: parseFloat(total.toFixed(2)),
          items: cartItems.map(i => ({ productId: i.id, quantity: i.quantity })),
        }),
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [user?.id, isCartReady, cartItems, isPlacingOrder, formData.paymentMethod, selectedAddressId, total]);

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
      const orderData = {
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
        gift_message: formData.giftMessage || null,
      };
      sessionStorage.setItem('pendingTabbyOrder', JSON.stringify(orderData));
      const res = await fetch('/api/tabby/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          items: cartItems.map(i => ({ id: i.id, productId: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image || '', productUrl: `${window.location.origin}/product/${i.id}` })),
          buyer: { email: user.email, name: user.name || user.first_name || '', phone: addr.customerPhone || addr.customer_phone || '' },
          shippingAddress: { city: addr.city || 'Dubai', address: addressLine(addr), zip: addr.zipCode || addr.zip_code || '00000' },
          taxAmount: tax, shippingAmount: shipping, discountAmount: discountAmount || 0,
          orderData,
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

  // One page: the place-order button (cash on delivery / Tabby) or the card form's own Pay button
  const handlePrimary = () => {
    if (!selectedAddressId) { setShowAddressPicker(true); toast.error('Please choose a delivery address.'); return; }
    if (method === 'tabby') handleTabbyCheckout();
    else if (method === 'cashOnDelivery') handlePlaceOrder();
  };

  if (!authLoading && !isAuthenticated) return null;

  const pageReady = !authLoading && isCartReady && addressesLoaded;
  // After an order succeeds the cart is cleared before navigation finishes; don't flash "empty".
  const bagEmpty = isCartReady && cartItems.length === 0 && !isPlacingOrder;
  const walletName = wallet?.applePay ? 'Apple Pay' : 'Google Pay';
  // With a wallet chosen (and an address), Stripe's own wallet button takes the main button's place
  const walletButton = method === 'wallet' && !!selectedAddressId;
  const walletProps = {
    stripePromise,
    amount: Math.round(total * 100),
    disabled: isPlacingOrder || hasStockIssues,
    onBeforePay: () => {
      if (!selectedAddressId) { toast.error('Please select a shipping address first.'); return false; }
      return total > 0;
    },
    onSuccess: handleWalletPayment,
  };

  // One main button for every method; for card it submits the card field's form
  const showPrimary = true;
  const payByCard = method === 'card' && !!selectedAddressId;
  const primaryDisabled = isPlacingOrder || isTabbyLoading || hasStockIssues
    || (payByCard && (!clientSecret || !cardStatus.ready || cardStatus.processing || !!paidIntentId));
  const showMobileBar = pageReady && !bagEmpty && showPrimary;
  const primaryProps = payByCard
    ? { type: 'submit', form: 'card-payment-form' }
    : { type: 'button', onClick: handlePrimary };

  let desktopLabel = `Place order · ${fmt(total)}`;
  let mobileLabel = 'Place order';
  if (method === 'tabby') { desktopLabel = `Continue to Tabby · ${fmt(total)}`; mobileLabel = 'Continue to Tabby'; }
  if (method === 'card') { desktopLabel = `Pay ${fmt(total)}`; mobileLabel = 'Pay now'; }
  if (method === 'wallet') { desktopLabel = 'Choose a delivery address'; mobileLabel = 'Choose an address'; }
  if (cardStatus.processing) { desktopLabel = 'Processing payment…'; mobileLabel = 'Processing…'; }

  // Promo code, always open in the order summary (`id` differs for the phone and desktop copies)
  const promoBlock = (id) => (appliedCoupon ? (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-2">
      <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-emerald-700">
        <Check size={14} className="shrink-0" />
        <span className="truncate">{appliedCoupon.code} applied · −{fmt(discountAmount)}</span>
      </span>
      <button type="button" onClick={removeCoupon} className={`h-8 shrink-0 rounded-full px-2 text-[12px] font-semibold text-[#111114] underline underline-offset-4 ${focusRing}`}>
        Remove
      </button>
    </div>
  ) : (
    <>
      <form onSubmit={e => { e.preventDefault(); handleApplyCoupon(); }} className="flex gap-2">
        <label htmlFor={id} className="sr-only">Discount code</label>
        <input
          id={id}
          value={couponCode}
          onChange={e => { setCouponCode(e.target.value); if (couponError) removeCoupon(); }}
          placeholder="Discount code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          enterKeyHint="done"
          aria-invalid={!!couponError}
          className="h-11 min-w-0 flex-1 rounded-xl border border-[#d9d9de] bg-white px-4 text-[16px] text-[#111114] placeholder:text-[#9a9aa2] focus:border-[#111114] focus:outline-none focus:ring-2 focus:ring-[#111114]/10 lg:text-[14px]"
        />
        <button
          type="submit"
          disabled={!couponCode.trim() || isApplyingCoupon}
          className="inline-flex h-11 min-w-[84px] items-center justify-center rounded-xl px-5 text-[13px] font-semibold text-white transition-opacity disabled:opacity-35"
          style={{ background: ACTION }}
        >
          {isApplyingCoupon
            ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-label="Applying" />
            : 'Apply'}
        </button>
      </form>
      {couponError && <p role="alert" className="mt-2 text-[12px] font-medium text-red-600">{couponError}</p>}
    </>
  ));

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

  // A row of the details card: label on the left (above on phones), value on the right
  const rowLabel = 'w-full shrink-0 text-[13px] text-[#8a8a93] sm:w-[120px] sm:pt-px';
  const delivery = getDeliveryInfo();
  const extrasSummary = [
    formData.giftWrap && 'Gift wrap',
    usePoints && !pointsLocked && `${redeemablePoints.toLocaleString()} points`,
  ].filter(Boolean).join(' · ');

  const detailsCard = (
    <section aria-label="Delivery and payment" className={`${cardClass} divide-y divide-[#ececec]`}>
      {/* Deliver to */}
      <div>
        <button
          type="button"
          onClick={() => setShowAddressPicker(o => !o)}
          aria-expanded={showAddressPicker || !selectedAddress}
          className={`flex w-full flex-col gap-1 px-5 py-4 text-left sm:flex-row sm:gap-4 sm:px-6 ${focusRing}`}
        >
          <span className={rowLabel}>Deliver to</span>
          <span className="flex min-w-0 flex-1 items-start gap-3">
            <span className="min-w-0 flex-1 text-[14px] leading-snug text-[#111114]">
              {selectedAddress ? (
                <>
                  <span className="block font-semibold">{addressName(selectedAddress, user?.name)}</span>
                  <span className="block text-[#5a5a64]">
                    {[addressLine(selectedAddress), selectedAddress.city, selectedAddress.country].filter(Boolean).join(', ')}
                  </span>
                </>
              ) : (
                <span className="text-[#5a5a64]">{shippingAddresses.length ? 'Choose a delivery address' : 'Add a delivery address'}</span>
              )}
            </span>
            <ChevronDown size={18} className={`mt-0.5 shrink-0 text-[#8a8a93] transition-transform ${showAddressPicker || !selectedAddress ? 'rotate-180' : ''}`} />
          </span>
        </button>
        {(showAddressPicker || !selectedAddress) && (
          <div className="px-5 pb-5 sm:px-6">
            {shippingAddresses.length === 0 ? (
              <AddAddressTile onClick={() => openAddressModal(null)} label="Add a delivery address" />
            ) : (
          <div role="radiogroup" aria-label="Delivery address" className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {shippingAddresses.map(addr => {
              const checked = selectedAddressId === addr.id;
              const name = addressName(addr, user?.name);
              return (
                <div
                  key={addr.id}
                  className={`rounded-xl border transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#111114]/30 ${
                    checked ? 'border-[#111114] bg-white' : 'border-[#e4e4e7] bg-white hover:border-[#a1a1aa]'
                  }`}
                >
                  <label className="flex cursor-pointer items-start gap-3 p-4">
                    <input
                      type="radio"
                      name="delivery-address"
                      className="sr-only"
                      checked={checked}
                      onChange={() => { setSelectedAddressId(addr.id); setShowAddressPicker(false); }}
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
            )}
          </div>
        )}
      </div>

      {/* Delivery: one standard service, so it's a read-out rather than a choice */}
      <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:gap-4 sm:px-6">
        <span className={rowLabel}>Delivery</span>
        <span className="min-w-0 flex-1 text-[14px] leading-snug text-[#111114]">
          <span className="block font-semibold">Standard delivery · {shipping === 0 ? 'Free' : fmt(shipping)}</span>
          <span className="block text-[#5a5a64]">
            {hasPreorder ? `Ships by ${preorderShipBy}, in one parcel` : `Arrives ${delivery.rangeLabel} with our courier partners`}
          </span>
        </span>
      </div>

      {/* Extras: gift wrap and loyalty points, opened in place */}
      <div>
        <button
          type="button"
          onClick={() => setExtrasOpen(o => !o)}
          aria-expanded={extrasOpen}
          className={`flex w-full flex-col gap-1 px-5 py-4 text-left sm:flex-row sm:gap-4 sm:px-6 ${focusRing}`}
        >
          <span className={rowLabel}>Extras</span>
          <span className="flex min-w-0 flex-1 items-start gap-3">
            <span className="min-w-0 flex-1 text-[14px] leading-snug text-[#111114]">
              {extrasSummary || <span className="text-[#5a5a64]">Gift wrap{redeemablePoints > 0 ? ', loyalty points' : ''}</span>}
            </span>
            <ChevronDown size={18} className={`mt-0.5 shrink-0 text-[#8a8a93] transition-transform ${extrasOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>
        {extrasOpen && (
          <div className="divide-y divide-[#ececec] px-5 pb-2 sm:px-6 sm:pl-[160px]">
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
            {method === 'card' && (
              <p className="py-3 text-[11.5px] text-[#8a8a93]">Changing these refreshes the card form, so set them before entering your card.</p>
            )}
          </div>
        )}
      </div>

      {/* Payment */}
      <div className="px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
          <span className={rowLabel}>Payment</span>
          <span className="flex-1 text-[13px] text-[#5a5a64]">All transactions are secure and encrypted.</span>
        </div>
        {hasPreorder && (
          <div className="mt-4 rounded-xl bg-[#f6f5f2] px-4 py-3 text-[13px] leading-relaxed text-[#2a2a31]">
            <p className="font-semibold" style={{ color: ACCENT }}>Your order includes pre-order items · ships by {preorderShipBy}</p>
            <p className="mt-0.5">We&apos;ll send everything together in one parcel once they arrive, and email you when it&apos;s on its way. Cash on delivery isn&apos;t available for pre-orders.</p>
          </div>
        )}

        <div role="radiogroup" aria-label="Payment method" className="mt-4 divide-y divide-[#ececec] overflow-hidden rounded-xl border border-[#e4e4e7]">
          {wallet && (
            <PaymentOption
              value="wallet"
              checked={method === 'wallet'}
              onSelect={() => setFormData(p => ({ ...p, paymentMethod: 'wallet' }))}
              title={walletName}
              hint="Pay in one tap"
            />
          )}
          <PaymentOption
            value="card"
            checked={method === 'card'}
            onSelect={() => setFormData(p => ({ ...p, paymentMethod: 'card' }))}
            title="Card"
            hint="Visa · Mastercard · Amex"
          >
            <div>
              {!selectedAddressId ? (
                <p className="text-[13px] text-[#5a5a64]">Choose a delivery address above to pay by card.</p>
              ) : paidIntentId ? (
                <p className="text-[13px] text-[#5a5a64]">Your card has already been charged — use “Try again” above to finish your order.</p>
              ) : hasStockIssues ? (
                <p className="text-[13px] text-[#5a5a64]">Update your bag before paying.</p>
              ) : clientSecret && stripePromise ? (
                <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm onSuccessfulPayment={handleCardPaid} clientSecret={clientSecret} formId="card-payment-form" onStatusChange={setCardStatus} />
                </Elements>
              ) : (
                <div className="flex items-center gap-2 py-3 text-[13px] text-[#8a8a93]">
                  <Loader2 size={18} className="animate-spin text-[#111114]" />
                  Preparing secure card form…
                </div>
              )}
            </div>
          </PaymentOption>

          {!hasPreorder && (
            <PaymentOption
              value="cashOnDelivery"
              checked={method === 'cashOnDelivery'}
              onSelect={() => setFormData(p => ({ ...p, paymentMethod: 'cashOnDelivery' }))}
              title="Cash on delivery"
              hint="Pay when it arrives"
            />
          )}

          <PaymentOption
            value="tabby"
            checked={method === 'tabby'}
            onSelect={() => setFormData(p => ({ ...p, paymentMethod: 'tabby' }))}
            title="Tabby"
            hint={<span className="flex items-center gap-2">Split into payments<Image src="/0x0.png" alt="" width={22} height={22} className="h-[22px] w-[22px] rounded-md object-cover" /></span>}
          >
            <TabbyCard price={total} />
          </PaymentOption>
        </div>
      </div>
    </section>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className={`min-h-screen bg-white lg:pb-16 ${showMobileBar ? 'pb-32' : 'pb-16'}`}>
        <FlowHeader onBack={() => router.push('/cart')} />

        <main className="mx-auto max-w-[1240px] px-4 pt-6 sm:px-6 sm:pt-10 lg:px-8">
          <h1 className={`${headingFont} mt-5 text-[28px] font-medium uppercase leading-tight text-[#111114] sm:text-[40px]`}>Checkout</h1>

          {!pageReady ? (
            <CheckoutSkeleton />
          ) : bagEmpty ? (
            <div className="flex flex-col items-center gap-5 py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f6f5f2]">
                <ShoppingBag size={30} strokeWidth={1.3} className="text-[#111114]" />
              </div>
              <div>
                <h2 className="text-[20px] font-semibold text-[#111114]">Your bag is empty</h2>
                <p className="mt-1.5 text-[14px] text-[#5a5a64]">Add something to your bag before checking out.</p>
              </div>
              <Link
                href="/all-products"
                className={`inline-flex h-12 items-center gap-2 rounded-xl px-8 text-[14px] font-semibold text-white transition-transform active:scale-[0.98] ${focusRing}`}
                style={{ background: ACTION }}
              >
                Explore the collection
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 items-start gap-6 sm:mt-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14">
              <div className="min-w-0 space-y-4">
                {/* Mobile: collapsible summary with the total always visible */}
                <div className="-mx-4 bg-[#f6f5f2] sm:mx-0 sm:rounded-xl lg:hidden">
                  <button
                    type="button"
                    onClick={() => setSummaryOpen(o => !o)}
                    aria-expanded={summaryOpen}
                    aria-controls="mobile-order-summary"
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 ${focusRing}`}
                  >
                    <span className="flex items-center gap-2 text-[14px] font-medium text-[#111114]">
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
                        <div className="border-t border-[#e2e0db] px-4 pb-4 pt-3">
                          <OrderSummaryContent {...summaryProps} promo={promoBlock('promo-code-mobile')} />
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

                {detailsCard}

                {/* Always mounted so it can report the device's wallet; drawn only when chosen */}
                <div className="hidden lg:block">
                  <ExpressCheckoutButton {...walletProps} onAvailable={setWallet} show={walletButton} />
                </div>
                {showPrimary && !walletButton && (
                  <button
                    {...primaryProps}
                    disabled={primaryDisabled}
                    className="hidden h-[52px] w-full items-center justify-center gap-2.5 rounded-xl text-[15px] font-semibold text-white transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b35ec] focus-visible:ring-offset-2 lg:flex"
                    style={{ background: ACTION }}
                  >
                    {desktopLabel}
                    <ArrowRight size={17} />
                  </button>
                )}
                <p className="flex items-center gap-1.5 pt-1 text-[12px] text-[#8a8a93]">
                  <Lock size={12} /> Payments are encrypted and processed securely.
                </p>
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[#5a5a64]">
                  <Link href="/terms" className="underline underline-offset-4 hover:text-[#111114]">Terms of service</Link>
                  <Link href="/privacy" className="underline underline-offset-4 hover:text-[#111114]">Privacy policy</Link>
                </p>
              </div>

              <aside className="hidden lg:sticky lg:top-[84px] lg:block">
                <section aria-labelledby="summary-heading" className="rounded-xl bg-[#f6f5f2] p-6 sm:p-7">
                  <h2 id="summary-heading" className={`${headingFont} mb-4 text-[17px] font-medium uppercase tracking-wide text-[#111114]`}>Order summary</h2>
                  <OrderSummaryContent {...summaryProps} promo={promoBlock('promo-code')} scrollItems />
                  <ul className="mt-5 space-y-2.5 border-t border-[#e2e0db] pt-4">
                    {[
                      { Icon: Lock, text: 'Secured transaction', color: 'text-[#111114]' },
                      { Icon: ShieldCheck, text: 'Authentic products', color: 'text-[#111114]' },
                      { Icon: RotateCcw, text: '14-day returns', color: 'text-[#111114]' },
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
            className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ececec] bg-white lg:hidden"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto flex max-w-[640px] items-center gap-4 px-4 pt-3">
              <div className="min-w-0">
                <p className="text-[11px] leading-none text-[#8a8a93]">Total · VAT incl.</p>
                <p className="mt-1 text-[18px] font-bold leading-none tabular-nums text-[#111114]">{fmt(total)}</p>
              </div>
              {walletButton ? (
                <div className="min-w-0 flex-1"><ExpressCheckoutButton {...walletProps} show /></div>
              ) : (
              <button
                {...primaryProps}
                disabled={primaryDisabled}
                className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b35ec] focus-visible:ring-offset-2"
                style={{ background: ACTION }}
              >
                {mobileLabel}
                <ArrowRight size={17} />
              </button>
              )}
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
                <Loader2 size={30} className="animate-spin text-[#111114]" />
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
