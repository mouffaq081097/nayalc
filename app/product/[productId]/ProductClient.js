'use client';

import { useState, useEffect, use, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Heart, Star, Plus, Minus, Check, ChevronRight, Truck, RotateCcw, ShieldCheck, Sparkles, ShoppingBag } from 'lucide-react';
import Reviews from '../../components/Reviews';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import ProductCard from '../../components/ProductCard';
import TabbyPromo from '../../components/TabbyPromo';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '../../components/ui/carousel';
import { MadeInFranceBadge } from '../../components/MadeInFranceBadge';
import { MadeInUAEBadge } from '../../components/MadeInUAEBadge';
import { RecentlyViewedSection } from '../../components/RecentlyViewedSection';
import { trackRecentlyViewed } from '../../hooks/useRecentlyViewed';

import ProductGallery from './_components/ProductGallery';
import DeliveryCard from './_components/DeliveryCard';
import ProductDetails from './_components/ProductDetails';
import BoughtTogether from './_components/BoughtTogether';
import { LAVENDER, LAVENDER_LIGHT, LAVENDER_HOVER, BORDER, aed, BUTTON, EYEBROW, SECTION_TITLE, WELL } from './_components/theme';

function parseSizes(sizeStr) {
  if (!sizeStr) return [];
  if (sizeStr.includes(',')) return sizeStr.split(',').map(s => s.trim());
  if (sizeStr.includes('/')) return sizeStr.split('/').map(s => s.trim());
  return [sizeStr.trim()];
}

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
  const [selectedSize, setSelectedSize] = useState(null);

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
    if (product?.size) {
      const sizes = parseSizes(product.size);
      if (sizes.length > 0) setSelectedSize(sizes[0]);
    }
  }, [product]);

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

  // Broadcast sticky-bar visibility so the global chat launcher can lift above it
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('nayalc:product-sticky-bar', { detail: { visible: showStickyBar } }));
  }, [showStickyBar]);

  // Reset the chat launcher position when leaving the product page
  useEffect(() => () => {
    window.dispatchEvent(new CustomEvent('nayalc:product-sticky-bar', { detail: { visible: false } }));
  }, []);

  const stock = product ? Number(product.stock_quantity ?? product.stockQuantity ?? NaN) : NaN;
  const hasStockInfo = Number.isFinite(stock);
  const outOfStock = hasStockInfo && stock <= 0;
  const maxQty = hasStockInfo ? Math.max(1, stock) : 99;

  // Never let a stale quantity exceed what is actually left
  useEffect(() => { setQuantity(q => Math.min(q, maxQty)); }, [maxQty]);

  const handleAddToCart = () => {
    if (outOfStock) return;
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleWishlistToggle = async () => {
    if (!user) { router.push('/auth'); return; }
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

  const sizes = useMemo(() => product?.size ? parseSizes(product.size) : [], [product]);

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
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <p className="text-sm text-gray-500">It may have been renamed or is no longer available.</p>
        <button onClick={() => router.push('/all-products')}
          className={`px-8 py-3 rounded-full text-sm font-semibold text-white ${BUTTON}`}>
          Browse all products
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
  const metaLine = [sizes.length === 1 && product.size, product.form].filter(Boolean).join(' · ');
  const hasLongCopy = Boolean(product.long_description || product.benefits || product.how_to_use || product.ingredients);

  return (
    <div className="relative min-h-screen bg-white text-gray-900 overflow-x-clip">
      {/* ── Sticky buy bar (desktop: bottom bar, mobile: floating pill above the nav) ── */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed left-3 right-3 md:left-0 md:right-0 z-[140] bottom-[calc(env(safe-area-inset-bottom,0px)+84px)] md:bottom-0">
            <div className="mx-auto max-w-md md:max-w-none rounded-2xl md:rounded-none bg-white/95 backdrop-blur-md md:border-t shadow-[0_6px_24px_rgba(17,24,39,0.14)] md:shadow-[0_-4px_20px_rgba(17,24,39,0.06)]"
              style={{ borderColor: BORDER }}>
              <div className="max-w-7xl mx-auto px-3 md:px-6 h-16 flex items-center gap-3">
                {allImages[0] && (
                  <span className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0" style={{ background: WELL }}>
                    <Image src={allImages[0]} alt="" fill sizes="44px" className="object-contain p-1" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="hidden md:block text-[11px] font-medium" style={{ color: LAVENDER }}>{brandName}</p>
                  <p className="text-[13px] md:text-[14px] font-semibold text-gray-900 truncate">{product.name}</p>
                  <p className="md:hidden text-[13px] font-bold text-gray-900 tabular-nums">{aed(product.price)}</p>
                </div>
                <span className="hidden md:block text-[18px] font-bold text-gray-900 tabular-nums">{aed(product.price)}</span>
                <button onClick={handleAddToCart} disabled={outOfStock}
                  className={`h-11 px-5 rounded-full text-[13px] font-semibold text-white flex items-center gap-2 flex-shrink-0 active:scale-[0.98] transition-all disabled:opacity-50 ${BUTTON}`}>
                  {outOfStock ? 'Out of stock' : isAdded ? <><Check size={15} /> Added</> : <><ShoppingBag size={15} /> Add to cart</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Breadcrumb ── */}
        <nav aria-label="Breadcrumb" className="py-4 md:py-5 flex items-center gap-1.5 text-[13px] text-gray-400 min-w-0">
          <Link href="/" className="hover:text-gray-700 transition-colors flex-shrink-0">Home</Link>
          {product.brand && product.brandSlug && (
            <>
              <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
              <Link href={`/brand/${product.brandSlug}`} className="hover:text-gray-700 transition-colors flex-shrink-0">{product.brand}</Link>
            </>
          )}
          {product.categoryName && (
            <>
              <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
              <Link href={`/collections/${product.categorySlug || ''}`} className="hover:text-gray-700 transition-colors flex-shrink-0 hidden sm:inline">
                {product.categoryName}
              </Link>
              <ChevronRight size={13} className="text-gray-300 flex-shrink-0 hidden sm:inline" />
            </>
          )}
          {!product.categoryName && <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />}
          <span className="text-gray-700 font-medium truncate" aria-current="page">{product.name}</span>
        </nav>

        {/* ── Hero: gallery + buy box ── */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 pb-14 md:pb-20">

          <div className="lg:col-span-7 lg:sticky lg:top-28 self-start">
            <ProductGallery
              images={allImages}
              name={product.name}
              discountPct={discountPct}
              badge={isHomemade && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/90 shadow-sm" style={{ color: LAVENDER_HOVER, border: `1px solid ${BORDER}` }}>
                  <Sparkles size={12} color="#9333ea" strokeWidth={2.5} /> Homemade
                </span>
              )}
            />
          </div>

          <div className="lg:col-span-5 flex flex-col">

            {/* Identity */}
            <div className="flex items-center gap-2.5 flex-wrap mb-3">
              {product.brandSlug
                ? <Link href={`/brand/${product.brandSlug}`} className="text-[13px] font-semibold hover:underline underline-offset-4" style={{ color: LAVENDER }}>{brandName}</Link>
                : <span className="text-[13px] font-semibold" style={{ color: LAVENDER }}>{brandName}</span>}
              {product.brand && /gern[eé]t/i.test(product.brand) && <MadeInFranceBadge variant="light" />}
              {product.brand && /naya\s*lumi[eè]?re?\s*perfumes?/i.test(product.brand) && <MadeInUAEBadge variant="light" />}
            </div>

            <h1 className="text-[26px] sm:text-[30px] lg:text-[34px] font-bold leading-tight text-gray-900">
              {product.name}
            </h1>

            {metaLine && <p className="mt-2 text-[14px] text-gray-500">{metaLine}</p>}

            {/* Rating */}
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 w-fit group">
              <Stars rating={rating} />
              {reviewCount > 0 ? (
                <>
                  <span className="text-[14px] font-semibold text-gray-900">{rating.toFixed(1)}</span>
                  <span className="text-[13px] text-gray-500 group-hover:underline underline-offset-2">
                    {reviewCount} review{reviewCount === 1 ? '' : 's'}
                  </span>
                </>
              ) : (
                <span className="text-[13px] text-gray-500 group-hover:underline underline-offset-2">No reviews yet — be the first</span>
              )}
            </a>

            {/* Price */}
            <div className="mt-6 pb-6 border-b" style={{ borderColor: BORDER }}>
              <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
                <span className="text-[32px] font-bold text-gray-900 tabular-nums leading-none">{aed(product.price)}</span>
                {hasDiscount && (
                  <>
                    <span className="text-[16px] text-gray-400 line-through tabular-nums">{aed(product.comparedprice)}</span>
                    <span className="px-2 py-0.5 rounded-full text-[12px] font-semibold" style={{ background: LAVENDER_LIGHT, color: LAVENDER_HOVER }}>
                      Save {aed(product.comparedprice - product.price)}
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1.5 text-[12px] text-gray-400">VAT included</p>
              {product.price > 0 && (
                <div className="mt-4">
                  <TabbyPromo price={product.price} source="product" lang="en" />
                </div>
              )}
            </div>

            {/* Short description */}
            {product.description && (
              <p className="mt-6 text-[15px] text-gray-600 leading-relaxed">
                {product.description}
                {hasLongCopy && (
                  <a href="#details" className="ml-1.5 text-[13px] font-medium whitespace-nowrap hover:underline underline-offset-2" style={{ color: LAVENDER }}>
                    Read more
                  </a>
                )}
              </p>
            )}

            {/* Size selector — only when there is a real choice */}
            {sizes.length > 1 && (
              <div className="mt-6">
                <p className="text-[13px] font-medium text-gray-700 mb-2.5">
                  Size: <span className="font-semibold text-gray-900">{selectedSize}</span>
                </p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
                  {sizes.map(size => (
                    <button key={size} onClick={() => setSelectedSize(size)} role="radio" aria-checked={selectedSize === size}
                      className="min-w-[64px] px-4 py-2.5 rounded-xl border text-[13px] font-medium transition-all duration-150"
                      style={selectedSize === size
                        ? { borderColor: LAVENDER, color: LAVENDER_HOVER, background: LAVENDER_LIGHT, boxShadow: `inset 0 0 0 1px ${LAVENDER}` }
                        : { borderColor: '#e5e7eb', color: '#374151', background: 'white' }}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            {hasStockInfo && (
              <div className="mt-6 flex items-center gap-2">
                {outOfStock ? (
                  <><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[13px] font-semibold text-red-600">Out of stock</span></>
                ) : lowStock ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                    </span>
                    <span className="text-[13px] font-semibold text-amber-700">Only {stock} left — order soon</span>
                  </>
                ) : (
                  <><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[13px] font-medium text-emerald-700">In stock, ready to ship</span></>
                )}
              </div>
            )}

            {/* Quantity + CTA + Wishlist */}
            <div className="mt-3 flex items-stretch gap-2.5" ref={buyButtonRef}>
              <div className="flex items-center rounded-full border border-gray-200 bg-white px-1">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1 || outOfStock}
                  aria-label="Decrease quantity"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-colors">
                  <Minus size={14} />
                </button>
                <span className="w-7 text-center text-[15px] font-semibold text-gray-900 tabular-nums" aria-live="polite">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(maxQty, q + 1))} disabled={quantity >= maxQty || outOfStock}
                  aria-label="Increase quantity"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-colors">
                  <Plus size={14} />
                </button>
              </div>

              <button onClick={handleAddToCart} disabled={outOfStock}
                className={`flex-1 h-12 rounded-full text-[14px] font-semibold text-white flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(147,104,236,0.32)] hover:shadow-[0_10px_28px_rgba(147,104,236,0.42)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed ${BUTTON}`}>
                {outOfStock
                  ? 'Out of stock'
                  : isAdded
                    ? <><Check size={16} /> Added to cart</>
                    : <><ShoppingBag size={16} /> Add to cart · {aed(product.price * quantity)}</>}
              </button>

              <button onClick={handleWishlistToggle}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'} aria-pressed={isWishlisted}
                className="w-12 h-12 rounded-full border flex items-center justify-center transition-all flex-shrink-0 hover:border-purple-300"
                style={isWishlisted
                  ? { borderColor: LAVENDER, color: LAVENDER, background: LAVENDER_LIGHT }
                  : { borderColor: '#e5e7eb', color: '#9ca3af', background: 'white' }}>
                <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
              </button>
            </div>
            {outOfStock && (
              <p className="mt-2 text-[12px] text-gray-500">Save it to your wishlist and we'll keep it handy for when it's back.</p>
            )}

            {/* Delivery */}
            <div className="mt-6">
              <DeliveryCard
                user={user}
                shippingAddresses={shippingAddresses}
                contactName={contactInfo?.name}
                cartItems={cartItems}
                quantity={quantity}
              />
            </div>

            {/* Promises */}
            <ul className="mt-4 grid grid-cols-3 gap-2">
              {[
                { icon: Truck, title: 'Free shipping', sub: 'On 3+ items' },
                { icon: RotateCcw, title: '14-day returns', sub: 'Hassle-free' },
                { icon: ShieldCheck, title: '100% authentic', sub: `From ${brandName}` },
              ].map(({ icon: Icon, title, sub }) => (
                <li key={title} className="flex flex-col items-center text-center gap-1 py-3 px-1.5 rounded-xl" style={{ background: WELL }}>
                  <Icon size={16} strokeWidth={1.7} style={{ color: LAVENDER }} />
                  <p className="text-[12px] font-semibold text-gray-800 leading-tight">{title}</p>
                  <p className="text-[11px] text-gray-400 leading-tight line-clamp-1">{sub}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Details + bundle ── */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 pb-14 md:pb-20">
          <div className={btCompanions.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'}>
            <ProductDetails product={product} />
          </div>
          {btCompanions.length > 0 && (
            <div className="lg:col-span-5 lg:pt-[84px]">
              <BoughtTogether
                product={product}
                image={allImages[0]}
                companions={btCompanions}
                onAddAll={handleBundleAdd}
                disabled={outOfStock}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Reviews ── */}
      <section id="reviews" className="scroll-mt-24 py-12 md:py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reviews productId={product.id} />
        </div>
      </section>

      {/* ── Recommendations ── */}
      {recommendations.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 border-t border-gray-100">
          <div className="flex items-end justify-between mb-6">
            <div className="space-y-1">
              <p className={EYEBROW}>Complete the routine</p>
              <h2 className={SECTION_TITLE}>You might also like</h2>
            </div>
            <Link href={product.brandSlug ? `/brand/${product.brandSlug}` : '/all-products'}
              className="shrink-0 text-sm font-medium transition-colors hover:opacity-70" style={{ color: LAVENDER }}>
              {product.brandSlug ? `More from ${brandName}` : 'View all'} →
            </Link>
          </div>
          <Carousel opts={{ align: 'start' }} className="w-full">
            <CarouselContent className="-ml-4">
              {recommendations.map(rec => (
                <CarouselItem key={rec.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <ProductCard {...rec} image={rec.imageUrl} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="-left-12" />
              <CarouselNext className="-right-12" />
            </div>
          </Carousel>
        </section>
      )}

      {/* ── Recently Viewed ── */}
      <div className="pb-24 md:pb-12">
        <RecentlyViewedSection excludeId={product.id} />
      </div>
    </div>
  );
}
