'use client';

import { useState, useEffect, use, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Heart, Star, Plus, Minus, Check, ChevronRight, Truck, RotateCcw, ShieldCheck, Sparkles, MessageCircle } from 'lucide-react';
import Reviews from '../../components/Reviews';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import ProductCard from '../../components/ProductCard';
import TabbyPromo from '../../components/TabbyPromo';
import { MadeInFranceBadge } from '../../components/MadeInFranceBadge';
import { MadeInUAEBadge } from '../../components/MadeInUAEBadge';
import { RecentlyViewedSection } from '../../components/RecentlyViewedSection';
import { orderableQty, isPreorderOnly, preorderUnits, leadDays } from '@/lib/backorderRules';
import { getPreorderInfo, FREE_SHIPPING_FROM } from '@/lib/shipping';
import { RETURN_WINDOW_DAYS } from '@/lib/policies';
import { whatsappUrl } from '@/lib/contact';
import { trackRecentlyViewed } from '../../hooks/useRecentlyViewed';

import ProductGallery from './_components/ProductGallery';
import DeliveryCard from './_components/DeliveryCard';
import ProductDetails from './_components/ProductDetails';
import BoughtTogether from './_components/BoughtTogether';
import StockAlertForm from './_components/StockAlertForm';
import { LAVENDER, LAVENDER_HOVER, aed, BUTTON, SECTION_TITLE, WELL } from './_components/theme';
import { useSignIn } from '@/app/context/SignInContext';
import { useLocale } from '@/app/context/LocaleContext';

function Stars({ rating, size = 14 }) {
  const rounded = Math.round(rating || 0);
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={size}
          fill={s <= rounded ? '#f59e0b' : 'transparent'}
          className={s <= rounded ? 'text-amber-400' : 'text-gray-200'} />
      ))}
    </span>
  );
}

export default function ProductClient({ params, initialProduct }) {
  const { openSignIn } = useSignIn();
  const { t, rich, date, locale } = useLocale();
  const resolvedParams = use(params);
  const { productId } = resolvedParams;
  const { addToCart, cartItems } = useCart();
  const { user } = useAuth();
  const { shippingAddresses, contactInfo } = useUser();
  const { products: allProducts } = useAppContext();
  const router = useRouter();

  const [product, setProduct] = useState(initialProduct || null);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const buyButtonRef = useRef(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (initialProduct && !user) return;
      try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        data.price = parseFloat(data.price);
        if (data.comparedprice) data.comparedprice = parseFloat(data.comparedprice);
        if (data.averageRating) data.averageRating = parseFloat(data.averageRating);
        setProduct(data);
        if (user?.id) {
          const wr = await fetch(`/api/wishlist?userId=${user.id}`);
          if (wr.ok) {
            const wd = await wr.json();
            setIsWishlisted(wd.wishlist?.some(item => item.productId === data.id || item.productId === productId) || false);
          }
        }
      } catch (err) {
        if (!initialProduct) setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, user, initialProduct]);

  useEffect(() => {
    if (product?.id) trackRecentlyViewed(product);
  }, [product?.id]);

  // Records one product view per browser session (mirrors VisitTracker's session-scoped pattern).
  useEffect(() => {
    if (!product?.id) return;
    try {
      const key = `nlc_pv_${product.id}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');

      let vid = localStorage.getItem('nlc_vid');
      if (!vid) { vid = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`; localStorage.setItem('nlc_vid', vid); }
      const sid = sessionStorage.getItem('nlc_sid') || '';

      const payload = JSON.stringify({ productId: product.id, visitorId: vid, sessionId: sid });
      if (navigator.sendBeacon) navigator.sendBeacon('/api/track/product-view', new Blob([payload], { type: 'application/json' }));
      else fetch('/api/track/product-view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
    } catch {}
  }, [product?.id]);

  // Sticky bar appears once the main buy button has scrolled out of view upwards
  useEffect(() => {
    const el = buyButtonRef.current;
    if (!el || !product) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product]);

  // Let other bottom bars (the welcome offer on phones) sit above the sticky buy bar
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('nayalc:sticky-buy-bar', { detail: { visible: showStickyBar } }));
  }, [showStickyBar]);
  useEffect(() => () => {
    window.dispatchEvent(new CustomEvent('nayalc:sticky-buy-bar', { detail: { visible: false } }));
  }, []);

  const stock = product ? Number(product.stock_quantity ?? product.stockQuantity ?? NaN) : NaN;
  const hasStockInfo = Number.isFinite(stock);
  // Past the shelf stock, a product that takes pre-orders can still be bought (lib/backorderRules.js)
  const maxOrder = product ? orderableQty(product) : 0;
  const outOfStock = hasStockInfo && maxOrder <= 0;
  const preorderOnly = hasStockInfo && !!product && isPreorderOnly(product);
  const maxQty = hasStockInfo ? Math.max(1, maxOrder) : 99;
  const preorderQty = hasStockInfo && product ? preorderUnits(product, quantity) : 0;
  const preorderShipBy = useMemo(
    () => (product && maxOrder > Math.max(0, stock) ? getPreorderInfo(leadDays(product)).shipByLabel : ''),
    [product, maxOrder, stock]
  );

  // Never let a stale quantity exceed what is actually left
  useEffect(() => { setQuantity(q => Math.min(q, maxQty)); }, [maxQty]);

  const handleAddToCart = () => {
    if (outOfStock) return;
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleWishlistToggle = async () => {
    if (!user) { openSignIn(); return; }
    try {
      const method = isWishlisted ? 'DELETE' : 'POST';
      const response = await fetch(
        isWishlisted ? `/api/wishlist/${user.id}/${product.id}` : `/api/wishlist`,
        { method, headers: { 'Content-Type': 'application/json' }, body: isWishlisted ? null : JSON.stringify({ userId: user.id, productId: product.id }) }
      );
      if (response.ok) setIsWishlisted(!isWishlisted);
    } catch (e) { console.error(e); }
  };

  const handleBundleAdd = (companions) => {
    if (outOfStock) return;
    addToCart(product, 1);
    companions.forEach(p => addToCart({ ...p, stock_quantity: p.stockQuantity ?? p.stock_quantity }, 1));
  };

  const recommendations = useMemo(() => {
    if (!product || !allProducts) return [];
    return allProducts.filter(p => p.id !== product.id && (p.brand === product.brand || p.categoryNames === product.categoryNames)).slice(0, 8);
  }, [product, allProducts]);

  // Companions must be purchasable — an out-of-stock add would silently fail
  const btCompanions = useMemo(
    () => recommendations.filter(p => Number(p.stockQuantity ?? p.stock_quantity ?? 1) > 0).slice(0, 2),
    [recommendations]
  );

  // Other sizes are their own products, linked in the editor's Sizes card (lib/sizeGroups.js)
  const sizeOptions = product?.sizeOptions?.length > 1 ? product.sizeOptions : [];

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 aspect-square rounded-[28px] animate-pulse" style={{ background: WELL }} />
        <div className="lg:col-span-5 space-y-4 pt-4">
          {[30, 80, 60, 40, 100].map((w, i) => (
            <div key={i} className="h-5 rounded-full animate-pulse" style={{ width: `${w}%`, background: WELL }} />
          ))}
        </div>
      </div>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center bg-white">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">{t('Product not found')}</h2>
        <p className="text-sm text-gray-500">{t('It may have been renamed or is no longer available.')}</p>
        <button onClick={() => router.push('/all-products')}
          className={`px-8 py-3 rounded-full text-sm font-semibold text-white ${BUTTON}`}>
          {t('Browse all products')}
        </button>
      </div>
    </div>
  );

  const allImages = product.images?.length ? product.images : (product.imageUrl ? [product.imageUrl] : []);
  const hasDiscount = product.comparedprice > product.price;
  const discountPct = hasDiscount ? Math.round(((product.comparedprice - product.price) / product.comparedprice) * 100) : 0;
  const rating = Number(product.averageRating) || 0;
  const reviewCount = Number(product.reviewCount) || 0;
  const brandName = product.brand || 'Naya Lumière';
  const isHomemade = /crystal\s*bar/i.test(product.name || '');
  const lowStock = hasStockInfo && stock > 0 && stock <= 5;
  const metaLine = [!sizeOptions.length && product.size, product.form].filter(Boolean).join(' · ');
  const hasLongCopy = Boolean(product.long_description || product.benefits || product.how_to_use || product.ingredients);

  const brandIsFrench = !!product.brand && /gern[eé]t/i.test(product.brand);
  const brandIsEmirati = !!product.brand && /naya\s*lumi[eè]?re?\s*perfumes?/i.test(product.brand);
  const ctaLabel = outOfStock ? t('Out of stock') : preorderOnly ? t('Pre-order') : t('Add to cart');
  const shipByLabel = date(preorderShipBy);

  return (
    <div className="relative min-h-screen bg-white text-gray-900 overflow-x-clip">
      {/* ── Sticky buy bar along the bottom once the main button scrolls away ── */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 right-0 bottom-0 z-[140] pb-[env(safe-area-inset-bottom,0px)] bg-white">
            <div className="bg-white border-t border-[#ececec] shadow-[0_-4px_20px_rgba(17,24,39,0.06)]">
              <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center gap-3">
                {allImages[0] && (
                  <span className="relative w-11 h-11 overflow-hidden flex-shrink-0" style={{ background: WELL }}>
                    <Image src={allImages[0]} alt="" fill sizes="44px" className="object-contain p-1 mix-blend-multiply" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p dir="auto" className="text-[13px] md:text-[14px] font-semibold text-gray-900 truncate rtl:text-right">{product.name}</p>
                  <p className="text-[13px] text-gray-500 tabular-nums">{aed(product.price)}</p>
                </div>
                {outOfStock ? (
                  // Sold out: take the shopper to "Email me when it's back"
                  <button
                    onClick={() => {
                      document.getElementById('stock-alert')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      setTimeout(() => document.getElementById('stock-alert-email')?.focus({ preventScroll: true }), 400);
                    }}
                    className={`h-11 px-6 text-[13px] font-semibold uppercase tracking-[0.04em] flex items-center gap-2 flex-shrink-0 transition-colors ${BUTTON}`}>
                    {t('Notify me')}
                  </button>
                ) : (
                  <button onClick={handleAddToCart}
                    className={`h-11 px-6 text-[13px] font-semibold uppercase tracking-[0.04em] flex items-center gap-2 flex-shrink-0 transition-colors disabled:opacity-50 ${BUTTON}`}>
                    {isAdded ? <><Check size={15} /> {t('Added')}</> : ctaLabel}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero (after Pitaka): photos on the left, buying panel on the right ── */}
      <div className="lg:grid lg:grid-cols-[minmax(0,55%)_minmax(0,45%)]">

        {/* Photos. Phones and tablets: swipe gallery with thumbnails. Desktop: every photo stacked, full height. */}
        <div className="lg:hidden min-w-0">
          <ProductGallery
            images={allImages}
            name={product.name}
            discountPct={discountPct}
            badge={isHomemade && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/90" style={{ color: LAVENDER_HOVER }}>
                <Sparkles size={12} strokeWidth={2.5} /> {t('Homemade')}
              </span>
            )}
          />
        </div>
        <div className="hidden lg:block">
          {allImages.map((src, i) => (
            <div key={src + i} className="relative aspect-square" style={{ background: WELL }}>
              <Image
                src={src}
                alt={i === 0 ? product.name : t('{name}, photo {n}', { name: product.name, n: i + 1 })}
                fill
                priority={i === 0}
                sizes="55vw"
                className="object-contain p-[9%] mix-blend-multiply"
              />
              {i === 0 && allImages.length > 1 && (
                <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-[11px] font-medium text-white tabular-nums">
                  1 / {allImages.length}
                </span>
              )}
              {i === 0 && hasDiscount && (
                <span className="absolute top-6 start-6 rounded-full px-2.5 py-1 text-[12px] font-semibold text-white" style={{ background: LAVENDER }} dir="ltr">−{discountPct}%</span>
              )}
            </div>
          ))}
        </div>

        {/* Buying panel — stays in view while the photos scroll past */}
        <div className="px-4 sm:px-6 lg:px-[clamp(32px,5vw,80px)] pt-6 lg:pt-10 pb-12">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+32px)] max-w-[520px]">

            <nav aria-label={t('Breadcrumb')} className="flex items-center gap-1.5 text-[12px] text-[#6b6b73] min-w-0">
              <Link href="/" className="hover:text-gray-700 shrink-0">{t('Home')}</Link>
              {product.brand && product.brandSlug && (
                <><ChevronRight size={12} className="shrink-0 flip-rtl" /><Link href={`/brand/${product.brandSlug}`} className="hover:text-gray-700 shrink-0">{product.brand}</Link></>
              )}
              {product.categoryName && (
                <><ChevronRight size={12} className="shrink-0 hidden sm:block flip-rtl" /><Link href={`/collections/${product.categorySlug || ''}`} className="hover:text-gray-700 truncate hidden sm:block">{t(product.categoryName)}</Link></>
              )}
            </nav>

            <h1 className="mt-4 text-[22px] md:text-[26px] font-semibold leading-tight text-[#111114]"><bdi>{product.name}</bdi></h1>
            <p className="mt-1.5 flex items-center gap-2 text-[13px] text-gray-500">
              {product.brandSlug
                ? <Link href={`/brand/${product.brandSlug}`} className="hover:text-gray-900 underline-offset-4 hover:underline">{brandName}</Link>
                : <span>{brandName}</span>}
              {brandIsFrench && <MadeInFranceBadge variant="light" />}
              {brandIsEmirati && <MadeInUAEBadge variant="light" />}
              {isHomemade && <span className="font-semibold uppercase tracking-[0.12em] text-[10.5px]" style={{ color: LAVENDER }}>{t('Homemade')}</span>}
            </p>

            {/* Stars only once there's a review; empty grey stars read as "nobody buys this" */}
            {reviewCount > 0 && (
              <a href="#reviews" className="mt-3 inline-flex items-center gap-2 w-fit group">
                <Stars rating={rating} size={13} />
                <span className="text-[12.5px] text-[#6b6b73] group-hover:underline underline-offset-2">
                  {`${rating.toFixed(1)} · ${t(reviewCount === 1 ? '{n} review' : '{n} reviews', { n: reviewCount })}`}
                </span>
              </a>
            )}

            {/* Price */}
            <div className="mt-5 flex items-baseline flex-wrap gap-x-3 gap-y-1">
              <span className="text-[28px] md:text-[30px] font-semibold text-[#111114] tabular-nums leading-none">{aed(product.price)}</span>
              {hasDiscount && (
                <>
                  <span className="text-[16px] text-[#6b6b73] line-through tabular-nums">{aed(product.comparedprice)}</span>
                  <span className="rounded-full px-2 py-0.5 text-[12px] font-semibold text-white" style={{ background: LAVENDER }} dir="ltr">−{discountPct}%</span>
                </>
              )}
            </div>
            <p className="mt-1.5 text-[12px] text-[#6b6b73]">{t('VAT included')}{metaLine && <> · <bdi>{metaLine}</bdi></>}</p>

            {/* Size: each option is its own product, with its own price and stock */}
            {sizeOptions.length > 0 && (
              <nav aria-label={t('Sizes')} className="mt-6">
                <p className="text-[13px] text-gray-600 mb-2.5">{rich('Size: {size}', { size: <bdi className="font-medium text-[#111114]">{product.size}</bdi> })}</p>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((o) => {
                    const current = Number(o.id) === Number(product.id);
                    const cls = `min-w-[84px] px-4 py-2 border text-start text-[13px] transition-colors ${current ? 'border-[#111114] text-[#111114]' : 'border-[#dcdcdc] text-gray-700 hover:border-gray-500'}`;
                    const body = (
                      <>
                        <span className={`block ${current ? 'font-semibold' : 'font-medium'}`}><bdi>{o.size || t('Size')}</bdi></span>
                        <span className="block text-[11.5px] text-[#6b6b73] tabular-nums">{o.available ? aed(o.price) : t('Sold out')}</span>
                      </>
                    );
                    return current
                      ? <span key={o.id} aria-current="page" className={cls}>{body}</span>
                      : <Link key={o.id} href={`/product/${o.slug || o.id}`} className={cls}>{body}</Link>;
                  })}
                </div>
              </nav>
            )}

            {/* Short description, folded like Pitaka's highlights */}
            {product.description && (
              <details open className="group mt-6 border-t border-[#ececec] pt-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[13.5px] font-semibold text-[#111114]">
                  {t('Overview')}
                  <Minus size={16} className="hidden group-open:block" /><Plus size={16} className="group-open:hidden" />
                </summary>
                <p dir="auto" className="mt-3 text-[14px] leading-relaxed text-gray-600">
                  {product.description}
                  {hasLongCopy && <a href="#details" className="ms-1.5 whitespace-nowrap text-[13px] font-medium text-[#111114] underline underline-offset-4">{t('Read more')}</a>}
                </p>
              </details>
            )}

            {/* Stock */}
            {hasStockInfo && (
              <p className="mt-6 flex items-center gap-2 text-[13px]">
                {outOfStock ? (
                  <><span className="w-2 h-2 rounded-full bg-red-500" /><span className="font-semibold text-red-600">{t('Out of stock')}</span></>
                ) : preorderOnly ? (
                  <><span className="w-2 h-2 rounded-full" style={{ background: LAVENDER }} /><span className="font-semibold" style={{ color: LAVENDER }}>{t('Pre-order · ships by {date}', { date: shipByLabel })}</span></>
                ) : preorderQty > 0 ? (
                  <><span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" /><span className="font-semibold text-amber-700">{t(preorderQty === 1 ? 'Only {stock} in stock · the other {n} ships by {date}, in one parcel with the rest' : 'Only {stock} in stock · the other {n} ship by {date}, in one parcel with the rest', { stock, n: preorderQty, date: shipByLabel })}</span></>
                ) : lowStock ? (
                  <><span className="w-2 h-2 rounded-full bg-amber-500" /><span className="font-semibold text-amber-700">{t('Only {n} left', { n: stock })}</span></>
                ) : (
                  <><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="font-medium text-emerald-700">{t('In stock, ready to ship')}</span></>
                )}
              </p>
            )}

            {/* Quantity + the big black button */}
            {/* Sold out with no pre-orders: "Email me when it's back" instead of the buy row */}
            {outOfStock && (
              <div className="mt-3 flex items-end gap-2.5" ref={buyButtonRef}>
                <div className="min-w-0 flex-1"><StockAlertForm productId={product.id} defaultEmail={user?.email || ''} /></div>
              </div>
            )}
            <div className={`mt-3 flex items-stretch gap-2.5 ${outOfStock ? 'hidden' : ''}`} ref={outOfStock ? undefined : buyButtonRef}>
              <div className="flex items-center border border-[#dcdcdc]">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1 || outOfStock}
                  aria-label={t('Decrease quantity')} className="w-10 h-[52px] flex items-center justify-center text-gray-600 hover:text-gray-900 disabled:opacity-30">
                  <Minus size={14} />
                </button>
                <span className="w-7 text-center text-[15px] font-medium tabular-nums" aria-live="polite">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(maxQty, q + 1))} disabled={quantity >= maxQty || outOfStock}
                  aria-label={t('Increase quantity')} className="w-10 h-[52px] flex items-center justify-center text-gray-600 hover:text-gray-900 disabled:opacity-30">
                  <Plus size={14} />
                </button>
              </div>
              <button onClick={handleAddToCart} disabled={outOfStock}
                className={`flex-1 h-[52px] text-[14px] font-semibold uppercase tracking-[0.05em] flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${BUTTON}`}>
                {isAdded ? <><Check size={16} /> {t('Added to cart')}</> : outOfStock ? t('Out of stock') : <span>{ctaLabel}<span className="hidden sm:inline"> · {aed(product.price * quantity)}</span></span>}
              </button>
              <button onClick={handleWishlistToggle}
                aria-label={isWishlisted ? t('Remove from wishlist') : t('Save to wishlist')} aria-pressed={isWishlisted}
                className={`w-[52px] h-[52px] border flex items-center justify-center shrink-0 transition-colors ${isWishlisted ? 'border-[#111114] text-[#e63939]' : 'border-[#dcdcdc] text-gray-500 hover:border-gray-500'}`}>
                <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
              </button>
            </div>
            {outOfStock && (
              <button type="button" onClick={handleWishlistToggle} aria-pressed={isWishlisted} className="mt-3 inline-flex items-center gap-2 text-[13px] text-[#111114] underline underline-offset-4 decoration-gray-300 hover:decoration-[#111114]">
                <Heart size={15} className={isWishlisted ? 'fill-[#e63939] text-[#e63939]' : ''} />
                {isWishlisted ? t('Saved to your wishlist') : t('Save to wishlist')}
              </button>
            )}

            {product.price > 0 && (
              <div className="mt-4"><TabbyPromo price={product.price} source="product" lang={locale} /></div>
            )}

            <div className="mt-5">
              <DeliveryCard user={user} shippingAddresses={shippingAddresses} contactName={contactInfo?.name} cartItems={cartItems} quantity={quantity} />
            </div>

            <ul className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: Truck, title: t('Free shipping'), sub: t('On {n}+ items', { n: FREE_SHIPPING_FROM }), href: '/shipping-returns#delivery' },
                { icon: RotateCcw, title: t('{n}-day returns', { n: RETURN_WINDOW_DAYS }), sub: t('Unopened items'), href: '/shipping-returns#returns' },
                { icon: ShieldCheck, title: t('100% authentic'), sub: t('From {brand}', { brand: brandName }) },
              ].map(({ icon: Icon, title, sub, href }) => {
                const body = (
                  <>
                    <Icon size={16} strokeWidth={1.6} className="text-[#111114]" />
                    <p className="text-[12px] font-semibold text-gray-800 leading-tight">{title}</p>
                    <p className="text-[11px] text-gray-500 leading-tight line-clamp-1">{sub}</p>
                  </>
                );
                return (
                  <li key={title} style={{ background: WELL }}>
                    {href
                      ? <Link href={href} className="flex h-full flex-col items-center gap-1 py-3 px-1.5 hover:opacity-80">{body}</Link>
                      : <div className="flex h-full flex-col items-center gap-1 py-3 px-1.5">{body}</div>}
                  </li>
                );
              })}
            </ul>

            {/* Questions: WhatsApp when it's set up (lib/contact.js), otherwise the contact page */}
            {(() => {
              const wa = whatsappUrl(t('Hello, I have a question about {name}: {url}', { name: product.name, url: `https://nayalc.com/product/${product.slug || product.id}` }));
              const label = rich('Questions about this product? {action}', { action: <b className="font-semibold">{wa ? t('Ask us on WhatsApp') : t('Contact us')}</b> });
              const cls = 'mt-3 flex items-center justify-between gap-3 border border-[#ececec] px-4 py-3 text-[13px] text-[#111114] hover:border-[#111114] transition-colors';
              return wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className={cls}>
                  <span className="flex items-center gap-2.5"><MessageCircle size={17} strokeWidth={1.6} className="shrink-0" /><span>{label}</span></span>
                  <ChevronRight size={16} className="shrink-0 flip-rtl" />
                </a>
              ) : (
                <Link href="/contact" className={cls}>
                  <span className="flex items-center gap-2.5"><MessageCircle size={17} strokeWidth={1.6} className="shrink-0" /><span>{label}</span></span>
                  <ChevronRight size={16} className="shrink-0 flip-rtl" />
                </Link>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Section tabs, as on Pitaka ── */}
      <nav aria-label={t('Product sections')} className="border-t border-[#ececec] py-8 md:py-12 flex justify-center items-center gap-5 md:gap-8 text-[14px] md:text-[15px]">
        {hasLongCopy && <a href="#details" className="text-[#111114] hover:opacity-70">{t('Details')}</a>}
        {hasLongCopy && <span aria-hidden="true" className="text-gray-300">|</span>}
        <a href="#reviews" className="text-[#111114] hover:opacity-70">{t('Reviews')}{reviewCount > 0 ? ` (${reviewCount})` : ''}</a>
        {recommendations.length > 0 && <><span aria-hidden="true" className="text-gray-300">|</span><a href="#more" className="text-[#111114] hover:opacity-70">{t('You may also like')}</a></>}
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Details + bundle ── */}
        <div id="details" className="scroll-mt-28 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 pb-14 md:pb-20">
          <div className={`min-w-0 ${btCompanions.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
            <ProductDetails product={product} />
          </div>
          {btCompanions.length > 0 && (
            <div className="min-w-0 lg:col-span-5">
              <BoughtTogether product={product} image={allImages[0]} companions={btCompanions} onAddAll={handleBundleAdd} disabled={outOfStock} />
            </div>
          )}
        </div>
      </div>

      {/* ── Reviews ── */}
      <section id="reviews" className="scroll-mt-28 py-12 md:py-16 bg-white border-t border-[#ececec]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reviews productId={product.id} />
        </div>
      </section>

      {/* ── You may also like: the same panels as the listing pages ── */}
      {recommendations.length > 0 && (
        <section id="more" className="scroll-mt-28 py-14 md:py-20 border-t border-[#ececec]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 md:mb-12 text-center">
              <h2 className={SECTION_TITLE}>{t('You may also like')}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-2.5">
              {recommendations.slice(0, 4).map(rec => (
                <ProductCard key={rec.id} {...rec} image={rec.imageUrl} />
              ))}
            </div>
            <div className="mt-9 flex justify-center">
              <Link href={product.brandSlug ? `/brand/${product.brandSlug}` : '/all-products'}
                className="inline-flex h-10 items-center rounded-full border-[1.5px] border-[#111114] px-6 text-[13px] font-semibold text-[#111114] hover:bg-[#111114] hover:text-white transition-colors">
                {product.brandSlug ? t('More from {brand}', { brand: brandName }) : t('View all products')}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Recently viewed ── */}
      <div className="pb-24 md:pb-12">
        <RecentlyViewedSection excludeId={product.id} />
      </div>
    </div>
  );
}
