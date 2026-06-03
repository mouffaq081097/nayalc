'use client';

import { useState, useEffect, use, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Heart, Star, Plus, Minus, Check, ChevronRight, ChevronDown, ChevronUp, Truck, RotateCcw, ShieldCheck, X, ShoppingBag, Maximize2 } from 'lucide-react';
import Reviews from '../../components/Reviews';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
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
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { shippingAddresses } = useUser();
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

  const recommendations = useMemo(() => {
    if (!product || !allProducts) return [];
    return allProducts.filter(p => p.id !== product.id && (p.brand === product.brand || p.categoryNames === product.categoryNames)).slice(0, 4);
  }, [product, allProducts]);

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
                  padding: '5px 12px',
                  borderRadius: '100px',
                  background: '#fef3c7',
                  border: '1px solid #f59e0b',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.13em',
                  textTransform: 'uppercase',
                  color: '#92400e',
                  width: 'fit-content',
                }}
              >
                ✦ Homemade
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
