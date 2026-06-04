'use client';

import { useState, useEffect, use, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Heart, Star, Plus, Minus, Check, ChevronRight, ChevronDown, ChevronUp, Truck, RotateCcw, ShieldCheck, X, Maximize2, Sparkles, Package, MapPin } from 'lucide-react';
import Reviews from '../../components/Reviews';
import Modal from '../../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import { calcShipping, getDeliveryInfo, ARTISAN_GIFT_THRESHOLD, ARTISAN_GIFT_NAME } from '../../../lib/shipping';
import ProductCard from '../../components/ProductCard';
import TabbyPromo from '../../components/TabbyPromo';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '../../components/ui/carousel';
import { MadeInFranceBadge } from '../../components/MadeInFranceBadge';

const LAVENDER = 'rgb(147,104,236)';
const LAVENDER_LIGHT = 'rgba(147,104,236,0.10)';

function parseSizes(sizeStr) {
  if (!sizeStr) return [];
  if (sizeStr.includes(',')) return sizeStr.split(',').map(s => s.trim());
  if (sizeStr.includes('/')) return sizeStr.split('/').map(s => s.trim());
  return [sizeStr.trim()];
}

function DeliveryEstimate({ cartItems }) {
  const [info, setInfo]         = useState(() => getDeliveryInfo());
  const [minsLeft, setMinsLeft] = useState(info.minsLeft);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      const updated = getDeliveryInfo();
      setInfo(updated);
      setMinsLeft(updated.minsLeft);
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const cartQty  = cartItems.reduce((s, i) => s + i.quantity, 0);
  const shipCost = calcShipping(cartQty + 1);
  const hrs      = minsLeft != null ? Math.floor(minsLeft / 60) : 0;
  const mins     = minsLeft != null ? minsLeft % 60 : 0;

  const TIERS = [
    { qty: '1 item',   cost: 'AED 20', free: false },
    { qty: '2 items',  cost: 'AED 10', free: false },
    { qty: '3+ items', cost: 'FREE',   free: true  },
  ];

  return (
    <>
      <div className="flex items-start gap-2">
        <Truck size={14} className="flex-shrink-0 mt-0.5" style={{ color: LAVENDER }} />
        <div className="space-y-0.5">
          <p className="text-[13px] text-gray-500 leading-snug">
            {info.isNextDay ? 'Get it ' : 'Estimated delivery '}
            <span className="font-semibold text-gray-900">{info.dateLabel}</span>
            <span className="mx-1.5 text-gray-300">·</span>
            {shipCost === 0
              ? <span className="font-semibold text-emerald-600">Free shipping</span>
              : <><span className="font-medium" style={{ color: LAVENDER }}>AED {shipCost} shipping</span>
                <span className="text-[11px] text-gray-400 ml-1.5">(free with 3+ items)</span></>}
            <button
              onClick={() => setShowModal(true)}
              className="ml-1.5 text-[11px] font-medium underline underline-offset-2 cursor-pointer transition-opacity hover:opacity-70"
              style={{ color: LAVENDER }}>
              Learn more
            </button>
          </p>
          {info.isNextDay && minsLeft != null && (
            <p className="text-[11px] font-medium" style={{ color: LAVENDER }}>
              Order within{' '}
              <span className="font-bold text-gray-900">{hrs > 0 ? `${hrs}h ` : ''}{mins}m</span>
              {' '}for tomorrow delivery
            </p>
          )}
        </div>
      </div>

      {/* Shipping model modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="How shipping works" size="max-w-md">
        <div className="space-y-6">

          {/* Intro */}
          <p className="text-[13px] text-gray-500 leading-relaxed">
            We believe in honest, transparent pricing. Our shipping is based on the number of items in your order — not the order value.
          </p>

          {/* Tier cards */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-3">Shipping tiers</p>
            <div className="space-y-2">
              {TIERS.map((tier) => (
                <div key={tier.qty}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border transition-all"
                  style={{
                    background: tier.free ? 'rgba(248,240,255,0.6)' : 'rgba(249,250,251,0.8)',
                    borderColor: tier.free ? 'rgba(216,180,254,0.5)' : '#f3f4f6',
                  }}>
                  <div className="flex items-center gap-2.5">
                    {tier.free
                      ? <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: LAVENDER }}>
                          <Check size={10} className="text-white" strokeWidth={3} />
                        </span>
                      : <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-gray-200" />}
                    <span className="text-[13px] font-medium text-gray-700">{tier.qty}</span>
                  </div>
                  <span className={`text-[14px] font-bold tabular-nums ${tier.free ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {tier.cost}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Artisan Gift */}
          <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(248,240,255,0.5)', border: '1px solid rgba(216,180,254,0.35)' }}>
            <div className="flex items-center gap-2">
              <span className="text-[13px]">🎁</span>
              <p className="text-[13px] font-bold" style={{ color: '#6b21a8' }}>{ARTISAN_GIFT_NAME}</p>
            </div>
            <p className="text-[12px] text-gray-500 leading-relaxed">
              Spend <span className="font-semibold text-gray-800">AED {ARTISAN_GIFT_THRESHOLD}+</span> and receive a complimentary handmade gift from our Crystal Bar collection — our way of celebrating your order and supporting our small artisan line.
            </p>
          </div>

          {/* Delivery speed */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">Delivery speed</p>
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
              <Truck size={15} className="flex-shrink-0 mt-0.5" style={{ color: LAVENDER }} />
              <div className="space-y-0.5">
                <p className="text-[13px] font-medium text-gray-800">via Fly Express</p>
                <p className="text-[12px] text-gray-500 leading-relaxed">
                  Orders placed before <span className="font-semibold text-gray-700">2:00 PM UAE time</span> are dispatched the same day and typically arrive the next business day.
                </p>
              </div>
            </div>
          </div>

          {/* Transparency note */}
          <div className="rounded-xl px-4 py-3 bg-gray-50 border border-gray-100">
            <p className="text-[11px] text-gray-400 leading-relaxed">
              <span className="font-semibold text-gray-600">Why we charge shipping:</span> Our actual cost per parcel via Fly Express is AED 32. We absorb the difference on multi-item orders because we'd rather reward you for ordering more than hide fees in product prices.
            </p>
          </div>

        </div>
      </Modal>
    </>
  );
}

function AccordionItem({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-[15px] font-semibold text-gray-900">{title}</span>
        {open ? <ChevronUp size={18} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
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
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [btDeselected, setBtDeselected] = useState({});

  const buyButtonRef = useRef(null);

  // Keyboard nav for lightbox — allImages accessed via ref to avoid TDZ
  const allImagesRef = useRef([]);
  useEffect(() => {
    if (!isZoomed) return;
    const onKey = (e) => {
      if (e.key === 'Escape')     { setIsZoomed(false); return; }
      if (e.key === 'ArrowRight') setSelectedImage(i => Math.min(allImagesRef.current.length - 1, i + 1));
      if (e.key === 'ArrowLeft')  setSelectedImage(i => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isZoomed]);

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
    const el = buyButtonRef.current;
    if (!el || !product) return;
    const observer = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting), { threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [product]);

  const handleAddToCart = () => {
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

  const handleBtAddToCart = () => {
    if (product) addToCart(product, 1);
    btCompanions
      .filter(p => !btDeselected[p.id])
      .forEach(p => addToCart({ ...p, stock_quantity: p.stockQuantity ?? p.stock_quantity }, 1));
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const recommendations = useMemo(() => {
    if (!product || !allProducts) return [];
    return allProducts.filter(p => p.id !== product.id && (p.brand === product.brand || p.categoryNames === product.categoryNames)).slice(0, 4);
  }, [product, allProducts]);

  const btCompanions = useMemo(() => recommendations.slice(0, 2), [recommendations]);

  const btTotal = useMemo(() => {
    if (!product) return 0;
    const extras = btCompanions
      .filter(p => !btDeselected[p.id])
      .reduce((sum, p) => sum + Number(p.price), 0);
    return Number(product.price) + extras;
  }, [product, btCompanions, btDeselected]);

  const sizes = useMemo(() => product?.size ? parseSizes(product.size) : [], [product]);
  const discountPct = product?.comparedprice > product?.price
    ? Math.round(((product.comparedprice - product.price) / product.comparedprice) * 100)
    : 0;
  const allImages = product?.images?.length ? product.images : (product?.imageUrl ? [product.imageUrl] : []);
  allImagesRef.current = allImages;
  const benefits = product?.benefits ? product.benefits.split('\n').filter(Boolean) : [];

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(196,167,254,0.2)', borderTopColor: LAVENDER }} />
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center bg-white">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <button onClick={() => router.push('/all-products')}
          className="px-8 py-3 rounded-full text-sm font-semibold text-white"
          style={{ background: LAVENDER }}>
          Back to Collection
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Sticky bar ── */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}
            className="fixed top-[72px] left-0 right-0 z-[140] hidden lg:block border-b border-gray-100 bg-white/95 backdrop-blur-md shadow-sm">
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-medium mb-0.5" style={{ color: LAVENDER }}>{product.brand || 'Naya Lumière'}</p>
                <p className="text-[14px] font-bold text-gray-900">{product.name}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[18px] font-bold text-gray-900">AED {Number(product.price).toFixed(0)}</span>
                <button onClick={handleAddToCart}
                  className="h-9 px-5 rounded-full text-[12px] font-bold text-white uppercase tracking-wide"
                  style={{ background: LAVENDER }}>
                  {isAdded ? 'Added ✓' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-8"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
            onClick={() => setIsZoomed(false)}
          >
            {/* Panel */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.22, ease: [0.32,0.72,0,1] }}
              className="relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl"
              style={{ width: 'min(780px, 95vw)', maxHeight: '90vh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={() => setIsZoomed(false)}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X size={15} className="text-gray-600" />
              </button>

              {/* Counter */}
              {allImages.length > 1 && (
                <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-gray-900/60 text-white text-[11px] font-semibold">
                  {selectedImage + 1} / {allImages.length}
                </div>
              )}

              {/* Main image area */}
              <div className="relative flex-1 flex items-center justify-center bg-[#f8f8f8]" style={{ minHeight: 420 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedImage}
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}
                    className="flex items-center justify-center p-10 w-full h-full"
                    style={{ maxHeight: allImages.length > 1 ? 'calc(90vh - 120px)' : 'calc(90vh - 40px)' }}
                  >
                    <Image
                      src={allImages[selectedImage] || ''}
                      alt={`${product?.name} — image ${selectedImage + 1}`}
                      width={700} height={700}
                      className="max-w-full max-h-full object-contain"
                      style={{ width: 'auto', height: 'auto', maxHeight: allImages.length > 1 ? 'calc(90vh - 140px)' : 'calc(90vh - 60px)' }}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Prev / Next arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage(i => Math.max(0, i - 1))}
                      disabled={selectedImage === 0}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-25 transition-all"
                    >
                      <ChevronRight size={16} className="rotate-180" />
                    </button>
                    <button
                      onClick={() => setSelectedImage(i => Math.min(allImages.length - 1, i + 1))}
                      disabled={selectedImage === allImages.length - 1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-25 transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail strip */}
              {allImages.length > 1 && (
                <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 overflow-x-auto">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className="relative w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all"
                      style={{ borderColor: selectedImage === i ? LAVENDER : 'transparent', background: '#f3f3f3' }}
                    >
                      <Image src={img} alt={`thumb ${i + 1}`} fill sizes="56px" className="object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Breadcrumb ── */}
        <nav className="py-4 flex items-center gap-1.5 text-[13px] text-gray-400">
          <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
          {product.categoryName && (
            <>
              <ChevronRight size={13} className="text-gray-300" />
              <Link href={`/collections/${product.categorySlug || ''}`} className="hover:text-gray-600 transition-colors">
                {product.categoryName}
              </Link>
            </>
          )}
          <ChevronRight size={13} className="text-gray-300" />
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* ── Main grid ── */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 pb-16">

          {/* LEFT — Gallery */}
          <div className="lg:sticky lg:top-28 self-start">
            <div className="flex gap-3">

              {/* Thumbnail rail */}
              {allImages.length > 1 && (
                <div className="flex flex-col gap-2 flex-shrink-0 w-[72px]">
                  {allImages.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImage(i)}
                      className="relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 bg-gray-50"
                      style={{ borderColor: selectedImage === i ? LAVENDER : 'transparent' }}>
                      <Image src={img} alt={`${product.name} ${i + 1}`} fill sizes="72px"
                        className="object-contain p-1.5" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div className="flex-1 relative">
                {/* Discount badge */}
                {discountPct > 0 && (
                  <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[12px] font-bold text-white"
                    style={{ background: LAVENDER }}>
                    -{discountPct}%
                  </div>
                )}
                <div
                  className="relative aspect-square rounded-3xl overflow-hidden bg-gray-50 cursor-zoom-in group"
                  onClick={() => setIsZoomed(true)}>
                  <AnimatePresence mode="wait">
                    <motion.div key={selectedImage}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex items-center justify-center p-8"
                      drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.12}
                      onDragEnd={(_, { offset }) => {
                        if (offset.x < -50 && selectedImage < allImages.length - 1) setSelectedImage(s => s + 1);
                        else if (offset.x > 50 && selectedImage > 0) setSelectedImage(s => s - 1);
                      }}>
                      <Image
                        src={allImages[selectedImage] || ''}
                        alt={product.name}
                        width={700} height={700} priority
                        className="max-w-full max-h-full object-contain group-hover:scale-[1.03] transition-transform duration-500 pointer-events-none"
                        style={{ width: 'auto', height: 'auto' }}
                      />
                    </motion.div>
                  </AnimatePresence>
                  <button
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    onClick={e => { e.stopPropagation(); setIsZoomed(true); }}>
                    <Maximize2 size={13} className="text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Info */}
          <div className="flex flex-col gap-5">

            {/* Brand + Made in France */}
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: LAVENDER }}>
                {product.brand || 'Naya Lumière'}
              </p>
              {product.brand && /gern[eé]t/i.test(product.brand) && (
                <MadeInFranceBadge variant="light" />
              )}
            </div>


            {/* Name */}
            <h1 className="text-[28px] lg:text-[34px] font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Homemade tag — Crystal Bar only */}
            {product.name && /crystal\s*bar/i.test(product.name) && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 14px',
                  borderRadius: '100px',
                  background: 'linear-gradient(135deg, rgba(248,240,255,0.97), rgba(255,240,250,0.97))',
                  border: '1px solid rgba(216,180,254,0.55)',
                  boxShadow: '0 2px 12px rgba(147,51,234,0.14), inset 0 1px 0 rgba(255,255,255,0.85)',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#6b21a8',
                  width: 'fit-content',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Sparkles size={12} color="#9333ea" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                Homemade
              </span>
            )}

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={14}
                    fill={s <= Math.round(product.averageRating || 0) ? '#f59e0b' : 'transparent'}
                    className={s <= Math.round(product.averageRating || 0) ? 'text-amber-400' : 'text-gray-200'}
                  />
                ))}
              </div>
              {product.averageRating > 0 && (
                <span className="text-[14px] font-semibold text-gray-900">{Number(product.averageRating).toFixed(1)}</span>
              )}
              {product.reviewCount > 0 && (
                <span className="text-[13px] text-gray-400">({product.reviewCount} reviews)</span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-[32px] font-bold text-gray-900">AED {Number(product.price).toFixed(0)}</span>
              {product.comparedprice > product.price && (
                <span className="text-[16px] text-gray-400 line-through font-medium">
                  AED {Number(product.comparedprice).toFixed(0)}
                </span>
              )}
            </div>

            {/* Tabby promo widget */}
            {product?.price && (
              <TabbyPromo price={product.price} source="product" lang="en" />
            )}

            {/* Deliver to strip */}
            {(() => {
              // Single address → treat as default regardless of flag
              // Multiple addresses → prefer the one flagged is_default, else first
              const addr = shippingAddresses.length === 1
                ? shippingAddresses[0]
                : (shippingAddresses.find(a => a.isDefault) ?? shippingAddresses[0] ?? null);

              const name = contactInfo?.name || '';
              const line = addr ? (addr.addressLine1 || addr.shippingAddress || '') : '';
              const city = addr?.city || '';
              const full = [line, city].filter(Boolean).join(', ');
              const truncated = full.length > 38 ? full.slice(0, 38) + '…' : full;

              if (!user) return (
                <Link href="/auth"
                  className="flex items-center gap-2 py-2 text-[13px] font-medium transition-colors hover:opacity-80"
                  style={{ color: LAVENDER }}>
                  <MapPin size={14} className="flex-shrink-0" style={{ color: LAVENDER }} />
                  Sign in to see delivery options
                </Link>
              );

              if (!addr) return (
                <Link href="/account/addresses"
                  className="flex items-center gap-2 py-2 text-[13px] font-medium transition-colors hover:opacity-80"
                  style={{ color: LAVENDER }}>
                  <MapPin size={14} className="flex-shrink-0" style={{ color: LAVENDER }} />
                  Add a delivery address
                </Link>
              );

              return (
                <Link href="/account/addresses"
                  className="flex items-start gap-2 py-2 group">
                  <MapPin size={14} className="flex-shrink-0 mt-0.5" style={{ color: LAVENDER }} />
                  <p className="text-[13px] text-gray-500 leading-snug">
                    Deliver to{' '}
                    <span className="font-semibold text-gray-800">{name}</span>
                    {truncated && (
                      <>
                        <span className="mx-1 text-gray-300">·</span>
                        <span className="group-hover:underline underline-offset-2" style={{ color: LAVENDER }}>{truncated}</span>
                      </>
                    )}
                  </p>
                </Link>
              );
            })()}

            {/* Delivery estimate with live cutoff countdown */}
            <DeliveryEstimate cartItems={cartItems} />

            {/* Description */}
            {(product.description || product.long_description) && (
              <p className="text-[14px] text-gray-500 leading-relaxed">
                {product.description || product.long_description}
              </p>
            )}

            {/* Size selector */}
            {sizes.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500 mb-2">Size</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => (
                    <button key={size} onClick={() => setSelectedSize(size)}
                      className="px-4 py-2 rounded-full border text-[13px] font-medium transition-all duration-150"
                      style={selectedSize === size
                        ? { borderColor: LAVENDER, color: LAVENDER, background: LAVENDER_LIGHT, borderWidth: '1.5px' }
                        : { borderColor: '#e5e7eb', color: '#374151', background: 'white' }}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock urgency indicator */}
            {(() => {
              const qty = product.stock_quantity ?? product.stockQuantity;
              if (qty == null) return null;
              if (Number(qty) === 0) return (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-[13px] font-semibold text-red-600">Out of stock</span>
                </div>
              );
              if (Number(qty) <= 5) return (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                  <span className="text-[13px] font-semibold text-red-600">Only {qty} left in stock – order soon!</span>
                </div>
              );
              return (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="text-[13px] font-medium text-emerald-700">In stock – ready to ship</span>
                </div>
              );
            })()}

            {/* Quantity + CTA + Wishlist */}
            <div className="flex items-center gap-3" ref={buyButtonRef}>
              {/* Qty */}
              <div className="flex items-center border border-gray-200 rounded-full px-1 gap-0.5">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors">
                  <Minus size={14} />
                </button>
                <span className="w-7 text-center text-[15px] font-semibold text-gray-900 tabular-nums">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors">
                  <Plus size={14} />
                </button>
              </div>

              {/* Add to cart */}
              <button onClick={handleAddToCart}
                className="flex-1 h-12 rounded-full text-[13px] font-bold text-white uppercase tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                style={{ background: LAVENDER }}>
                {isAdded
                  ? <><Check size={16} /> Added</>
                  : <>Add to Cart — AED {Number(product.price * quantity).toFixed(0)}</>}
              </button>

              {/* Wishlist */}
              <button onClick={handleWishlistToggle}
                className="w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all flex-shrink-0"
                style={isWishlisted
                  ? { borderColor: LAVENDER, color: LAVENDER, background: LAVENDER_LIGHT }
                  : { borderColor: '#e5e7eb', color: '#9ca3af' }}>
                <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { icon: Truck, title: 'Free Delivery', sub: 'Orders 200+ AED' },
                { icon: RotateCcw, title: '14-Day Returns', sub: 'Hassle-free' },
                { icon: ShieldCheck, title: 'Authentic', sub: '100% Genuine' },
              ].map(({ icon: Icon, title, sub }) => (
                <div key={title} className="flex flex-col items-center text-center gap-1.5 py-3 px-2 rounded-xl border border-gray-100">
                  <Icon size={16} strokeWidth={1.6} style={{ color: LAVENDER }} />
                  <div>
                    <p className="text-[12px] font-semibold text-gray-800">{title}</p>
                    <p className="text-[11px] text-gray-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Sold by / Delivered by */}
            <div className="flex items-center gap-2.5 py-2.5 px-3.5 rounded-xl border border-gray-100 bg-gray-50/50">
              <Package size={13} style={{ color: LAVENDER }} className="flex-shrink-0" />
              <p className="text-[12px] text-gray-500 leading-none">
                Sold by{' '}<span className="font-semibold text-gray-700">Naya Lumière Cosmetics</span>
                {' · '}
                Delivered by{' '}<span className="font-semibold text-gray-700">Fly Express</span>
              </p>
            </div>

            {/* Accordions */}
            <div className="mt-2">
              {benefits.length > 0 && (
                <AccordionItem title="Key Benefits" defaultOpen>
                  <ul className="space-y-2">
                    {benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: LAVENDER }} />
                        <span className="text-[13px] text-gray-600 leading-relaxed">{b.replace(/^[-•]\s*/, '')}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionItem>
              )}

              {product.how_to_use && (
                <AccordionItem title="How to Use">
                  <div className="space-y-2">
                    {product.how_to_use.split('\n').filter(Boolean).map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-[11px] font-bold tabular-nums mt-0.5 flex-shrink-0 w-5" style={{ color: LAVENDER }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <p className="text-[13px] text-gray-600 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </AccordionItem>
              )}

              {product.ingredients && (
                <AccordionItem title="Full Ingredients">
                  <p className="text-[13px] text-gray-500 leading-relaxed">{product.ingredients}</p>
                </AccordionItem>
              )}
            </div>

            {/* ── Frequently Bought Together ── */}
            {btCompanions.length > 0 && (
              <div className="border-t border-gray-100 pt-5">
                <p className="text-[13px] font-bold text-gray-900 mb-4">Frequently bought together</p>

                {/* Amazon-style: products left, total+CTA right */}
                <div className="flex items-start gap-4">

                  {/* Products row */}
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {/* Current product */}
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                      <div className="relative w-[90px] h-[90px] rounded-xl border-2 bg-gray-50 overflow-hidden flex items-center justify-center p-1.5"
                        style={{ borderColor: LAVENDER }}>
                        {allImages[0] && (
                          <Image src={allImages[0]} alt={product.name} width={84} height={84} className="object-contain w-full h-full" />
                        )}
                        <div className="absolute top-1 right-1 w-4 h-4 rounded flex items-center justify-center"
                          style={{ background: LAVENDER }}>
                          <Check size={9} className="text-white" strokeWidth={3} />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-600 text-center line-clamp-2 leading-snug w-[90px]">
                        <span className="font-semibold">This item:</span> {product.name}
                      </p>
                      <p className="text-[12px] font-bold text-gray-900 tabular-nums">AED {Number(product.price).toFixed(0)}</p>
                    </div>

                    {btCompanions.map((companion) => {
                      const isSelected = !btDeselected[companion.id];
                      return (
                        <div key={companion.id} className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-gray-400 font-light text-lg leading-none flex-shrink-0">+</span>
                          <button
                            onClick={() => setBtDeselected(prev => ({ ...prev, [companion.id]: !prev[companion.id] }))}
                            className="flex flex-col items-center gap-1.5 cursor-pointer"
                          >
                            <div className="relative w-[90px] h-[90px] rounded-xl border-2 bg-gray-50 overflow-hidden flex items-center justify-center p-1.5 transition-all duration-200"
                              style={{
                                borderColor: isSelected ? 'rgba(216,180,254,0.7)' : '#e5e7eb',
                                opacity: isSelected ? 1 : 0.5,
                              }}>
                              {companion.imageUrl && (
                                <Image src={companion.imageUrl} alt={companion.name} width={84} height={84} className="object-contain w-full h-full" />
                              )}
                              <div className="absolute top-1 right-1 w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200"
                                style={isSelected
                                  ? { background: LAVENDER, borderColor: LAVENDER }
                                  : { background: 'white', borderColor: '#9ca3af' }}>
                                {isSelected && <Check size={9} className="text-white" strokeWidth={3} />}
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-600 text-center line-clamp-2 leading-snug w-[90px]" style={{ color: isSelected ? LAVENDER : '#6b7280' }}>
                              {companion.name}
                            </p>
                            <p className="text-[12px] font-bold tabular-nums" style={{ color: isSelected ? '#111827' : '#9ca3af' }}>
                              AED {Number(companion.price).toFixed(0)}
                            </p>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total + CTA — right panel */}
                  <div className="flex-shrink-0 flex flex-col gap-3 pt-1 min-w-[130px]">
                    <div>
                      <p className="text-[11px] text-gray-500 font-medium mb-0.5">Total price</p>
                      <p className="text-[18px] font-bold text-gray-900 tabular-nums">AED {btTotal.toFixed(0)}</p>
                    </div>
                    <button
                      onClick={handleBtAddToCart}
                      className="w-full h-9 rounded-full text-[11px] font-bold text-white uppercase tracking-wide transition-all active:scale-[0.98]"
                      style={{ background: LAVENDER }}>
                      Add all to cart
                    </button>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      Tap an item to include or exclude it
                    </p>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Recommendations ── */}
        {recommendations.length > 0 && (
          <section className="border-t border-gray-100 pt-10 pb-14">
            <div className="flex items-end justify-between mb-6">
              <div className="space-y-1">
                <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-gray-400">Complete the routine</p>
                <h2 className="text-[26px] font-bold text-gray-900">You might also like</h2>
              </div>
              <Link href="/all-products" className="text-sm font-medium transition-colors" style={{ color: LAVENDER }}>
                View all →
              </Link>
            </div>
            <Carousel opts={{ align: 'start', loop: true }} className="w-full">
              <CarouselContent className="-ml-4">
                {recommendations.map(rec => (
                  <CarouselItem key={rec.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/4">
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

      </div>

      {/* ── Reviews ── */}
      <div id="reviews" className="border-t border-gray-100 bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Reviews productId={product.id} />
        </div>
      </div>
    </div>
  );
}
