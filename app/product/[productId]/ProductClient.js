'use client';

import { useState, useEffect, use, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Heart, Star, Plus, Minus, Check, ChevronRight, Maximize2, ShieldCheck, FlaskConical, Droplets, Truck, RotateCcw, X, ShoppingBag, Lock } from 'lucide-react';
import Reviews from '../../components/Reviews';
import TabbyPromo from '../../components/TabbyPromo';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import ProductCard from '../../components/ProductCard';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '../../components/ui/carousel';

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

  const buyButtonRef = useRef(null);

  const primaryAddress = useMemo(() => {
    return shippingAddresses?.find((addr) => addr.is_primary) || shippingAddresses?.[0] || null;
  }, [shippingAddresses]);

  const ingredients = useMemo(() => {
    if (!product?.description) return [];
    const commonIngredients = ['Hyaluronic Acid', 'Vitamin C', 'Retinol', 'Peptides', 'Niacinamide', 'Ceramides'];
    return commonIngredients.filter(ing => product.description.toLowerCase().includes(ing.toLowerCase())).slice(0, 3);
  }, [product]);

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
          const wishlistResponse = await fetch(`/api/wishlist?userId=${user.id}`);
          if (wishlistResponse.ok) {
            const wishlistData = await wishlistResponse.json();
            const isInWishlist = wishlistData.wishlist
              ? wishlistData.wishlist.some(item => item.productId === data.id || item.productId === productId)
              : false;
            setIsWishlisted(isInWishlist);
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
    const el = buyButtonRef.current;
    if (!el || !product) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
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
        {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: isWishlisted ? null : JSON.stringify({ userId: user.id, productId: product.id }),
        }
      );
      if (response.ok) setIsWishlisted(!isWishlisted);
    } catch (error) { console.error('Error updating wishlist:', error); }
  };

  const recommendations = useMemo(() => {
    if (!product || !allProducts) return [];
    return allProducts
      .filter(p => p.id !== product.id && (p.brand === product.brand || p.categoryNames === product.categoryNames))
      .slice(0, 4);
  }, [product, allProducts]);

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#ffffff' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(196,167,254,0.2)', borderTopColor: '#9333ea' }} />
        <span className="text-[11px] font-medium text-purple-400 uppercase tracking-widest">Loading</span>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error || !product) return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center" style={{ background: '#ffffff' }}>
      <div className="space-y-5">
        <h2 className="text-2xl font-bold text-[#1a0533]">Product not found</h2>
        <Button onClick={() => router.push('/all-products')}
          className="cl-gradient-btn px-8 py-3 rounded-full text-[12px] font-semibold uppercase tracking-widest">
          Back to Collection
        </Button>
      </div>
    </div>
  );

  /* ── Page ── */
  return (
    <div className="min-h-screen font-sans text-[#1d1d1f] antialiased" style={{ background: '#ffffff' }}>

      {/* ── Desktop sticky bar ── */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="fixed top-[78px] left-0 right-0 z-[140] hidden lg:block px-4"
          >
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between px-6 h-14 rounded-2xl backdrop-blur-2xl border"
                style={{ background: 'rgba(253,248,255,0.97)', borderColor: 'rgba(216,180,254,0.35)', boxShadow: '0 4px 24px rgba(147,51,234,0.10)' }}>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-400 leading-none mb-0.5">{product.brand || 'Naya Lumière'}</p>
                  <h2 className="text-[14px] font-bold text-[#1a0533] leading-none">{product.name}</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] font-medium text-purple-300">AED</span>
                    <span className="text-[18px] font-bold"
                      style={{ backgroundImage: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {Number(product.price).toFixed(2)}
                    </span>
                  </div>
                  <button onClick={handleAddToCart}
                    className="cl-gradient-btn flex items-center gap-1.5 h-9 px-5 rounded-full text-[11px] font-semibold uppercase tracking-wide text-white">
                    {isAdded ? <><Check size={13} /> Added</> : <><ShoppingBag size={13} /> Add to Bag</>}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full-screen zoom modal ── */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[500] bg-black/93 backdrop-blur-md flex items-center justify-center"
            onClick={() => setIsZoomed(false)}
          >
            <motion.div
              initial={{ scale: 0.93 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.93 }}
              transition={{ duration: 0.22 }}
              className="relative max-h-[90vh] max-w-[90vw]"
              onClick={e => e.stopPropagation()}
            >
              <Image
                src={product.images ? product.images[selectedImage] : product.imageUrl}
                alt={product.name}
                width={900} height={1100}
                className="max-h-[85vh] max-w-[85vw] object-contain rounded-2xl"
              />
              {product.images?.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {product.images.map((_, i) => (
                    <button key={i} onClick={() => setSelectedImage(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${selectedImage === i ? 'w-5 bg-white' : 'w-1.5 bg-white/35'}`} />
                  ))}
                </div>
              )}
            </motion.div>
            <button onClick={() => setIsZoomed(false)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="max-w-[1440px] mx-auto">
        <div className="grid lg:grid-cols-12 gap-0 pt-4 lg:pt-24 pb-12">

          {/* LEFT — Gallery */}
          <div className="lg:col-span-6 px-3 lg:px-12">
            <div className="lg:sticky lg:top-32">
              <div className="flex gap-2.5 lg:gap-4">

                {/* Thumbnail rail */}
                {product.images?.length > 1 && (
                  <div className="flex flex-col gap-2 flex-shrink-0 w-[58px] lg:w-[80px]">
                    {product.images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className="relative overflow-hidden rounded-2xl w-full flex-shrink-0 transition-all duration-200"
                        style={{
                          aspectRatio: '3/4',
                          background: '#fff',
                          border: selectedImage === index ? '2px solid #9333ea' : '2px solid rgba(216,180,254,0.3)',
                          boxShadow: selectedImage === index
                            ? '0 0 0 3px rgba(147,51,234,0.10), 0 4px 14px rgba(147,51,234,0.18)'
                            : '0 1px 4px rgba(0,0,0,0.05)',
                          opacity: selectedImage === index ? 1 : 0.55,
                        }}
                        aria-label={`View image ${index + 1}`}
                      >
                        <Image
                          src={img}
                          alt={product.imagesData?.[index]?.alt || `${product.name} view ${index + 1}`}
                          fill sizes="80px"
                          className="object-contain p-1.5"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Main image */}
                <div className="flex-1 flex flex-col gap-4">
                  <div
                    className="w-full aspect-[3/4] lg:aspect-[4/5] rounded-3xl lg:rounded-[2.5rem] overflow-hidden relative cursor-zoom-in group"
                    style={{
                      background: 'linear-gradient(145deg, #ffffff 0%, rgba(245,240,255,0.55) 100%)',
                      boxShadow: '0 8px 48px rgba(147,51,234,0.10), 0 2px 8px rgba(0,0,0,0.04)',
                      border: '1px solid rgba(216,180,254,0.18)',
                    }}
                    onClick={() => setIsZoomed(true)}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedImage}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.28 }}
                        className="absolute inset-0 flex items-center justify-center p-5 lg:p-10"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.15}
                        onDragEnd={(_, { offset }) => {
                          if (offset.x < -50 && product.images && selectedImage < product.images.length - 1)
                            setSelectedImage(s => s + 1);
                          else if (offset.x > 50 && selectedImage > 0)
                            setSelectedImage(s => s - 1);
                        }}
                      >
                        <Image
                          src={product.images ? product.images[selectedImage] : product.imageUrl}
                          alt={product.imagesData?.[selectedImage]?.alt || product.name}
                          width={850} height={1000} priority
                          className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-[1.04] pointer-events-none drop-shadow-sm"
                          style={{ width: 'auto', height: 'auto' }}
                        />
                      </motion.div>
                    </AnimatePresence>

                    {/* Zoom button */}
                    <button
                      className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 text-purple-600"
                      style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', border: '1px solid rgba(216,180,254,0.35)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                      onClick={e => { e.stopPropagation(); setIsZoomed(true); }}
                    >
                      <Maximize2 size={14} />
                    </button>

                    {/* Image counter */}
                    {product.images?.length > 1 && (
                      <div className="absolute bottom-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full z-20"
                        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', border: '1px solid rgba(216,180,254,0.28)' }}>
                        <span className="text-[11px] font-semibold tabular-nums text-purple-600">{selectedImage + 1}</span>
                        <span className="text-[11px] text-black/25 mx-0.5">/</span>
                        <span className="text-[11px] text-black/45">{product.images.length}</span>
                      </div>
                    )}
                  </div>

                  {/* Feature pills — desktop */}
                  <div className="hidden lg:flex items-center gap-2">
                    {[
                      { icon: FlaskConical, label: 'Clinically Tested' },
                      { icon: Droplets, label: 'Pure Botanicals' },
                      { icon: ShieldCheck, label: 'Dermatologist Approved' },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                        style={{ background: 'rgba(255,255,255,0.8)', borderColor: 'rgba(216,180,254,0.3)', color: '#7c3aed' }}>
                        <Icon size={11} strokeWidth={2} />
                        <span className="text-[10px] font-medium">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Info */}
          <div className="lg:col-span-6 px-4 lg:pr-14 lg:pl-4 mt-6 lg:mt-0">
            <div className="lg:sticky lg:top-32 space-y-5 lg:space-y-6">

              {/* Brand + New badge */}
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-600">
                  {product.brand || 'Naya Lumière'}
                </p>
                {product.isNew && (
                  <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-600 text-[9px] font-bold uppercase tracking-wider border border-purple-100">
                    New
                  </span>
                )}
              </div>

              {/* Product name */}
              <h1 className="text-[26px] lg:text-[40px] font-bold leading-[1.1] text-[#1a0533]">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={13}
                      fill={s <= Math.round(product.averageRating || 4.9) ? '#9333ea' : 'transparent'}
                      className={s <= Math.round(product.averageRating || 4.9) ? 'text-purple-600' : 'text-gray-200'}
                    />
                  ))}
                </div>
                <span className="text-[13px] font-semibold text-[#1a0533]">{product.averageRating || '4.9'}</span>
                <span className="text-[13px] text-black/35">· Verified Reviews</span>
              </div>

              {/* Price */}
              <div className="flex items-end gap-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[13px] font-medium text-purple-300">AED</span>
                  <span className="text-[44px] lg:text-[52px] font-bold leading-none"
                    style={{ backgroundImage: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {Number(product.price).toFixed(2)}
                  </span>
                </div>
                {product.comparedprice > product.price && (
                  <div className="flex flex-col gap-1 mb-2">
                    <span className="text-sm text-gray-300 line-through font-medium">
                      AED {Number(product.comparedprice).toFixed(2)}
                    </span>
                    <span className="text-[10px] font-semibold text-purple-500 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100 text-center">
                      Save {Math.round(((product.comparedprice - product.price) / product.comparedprice) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Tabby */}
              <TabbyPromo price={product.price} source="product" />

              {/* Specs chips */}
              {(product.form || product.size) && (
                <div className="flex flex-wrap gap-2">
                  {product.form && (
                    <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[12px]"
                      style={{ borderColor: 'rgba(216,180,254,0.4)', background: 'rgba(255,255,255,0.6)', color: '#6b21a8' }}>
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-purple-300">Form</span>
                      <span className="font-medium">{product.form}</span>
                    </div>
                  )}
                  {product.size && (
                    <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[12px]"
                      style={{ borderColor: 'rgba(216,180,254,0.4)', background: 'rgba(255,255,255,0.6)', color: '#6b21a8' }}>
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-purple-300">Size</span>
                      <span className="font-medium">{product.size}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl border"
                style={{ background: 'rgba(255,255,255,0.8)', borderColor: 'rgba(216,180,254,0.35)' }}>
                <span className="text-[13px] text-black/45 font-medium">Quantity</span>
                <div className="flex items-center rounded-full py-0.5 px-1 gap-0.5 border"
                  style={{ background: '#ffffff', borderColor: 'rgba(216,180,254,0.3)' }}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white text-black/45 hover:text-purple-600 transition-colors">
                    <Minus size={13} />
                  </button>
                  <span className="text-[14px] font-semibold w-7 text-center tabular-nums text-[#1a0533]">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white text-black/45 hover:text-purple-600 transition-colors">
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* CTA */}
              <div className="flex gap-3" ref={buyButtonRef}>
                <button
                  onClick={handleAddToCart}
                  className="cl-gradient-btn flex-1 h-14 rounded-full text-[14px] font-semibold uppercase tracking-widest text-white active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isAdded
                    ? <><Check size={17} /> Added to Bag</>
                    : <><ShoppingBag size={17} /> Add to Bag</>}
                </button>
                <button
                  onClick={handleWishlistToggle}
                  className="w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
                  style={isWishlisted
                    ? { background: 'rgba(147,51,234,0.07)', borderColor: '#9333ea', color: '#9333ea' }
                    : { background: 'white', borderColor: 'rgba(216,180,254,0.5)', color: '#9333ea' }}
                >
                  <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
                </button>
              </div>

              {/* Trust grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-gray-100/80">
                {[
                  { icon: Truck, title: 'Free Delivery', sub: 'Orders over AED 200' },
                  { icon: ShieldCheck, title: '100% Authentic', sub: 'Official source' },
                  { icon: RotateCcw, title: '30-Day Returns', sub: 'Sealed items' },
                  { icon: Lock, title: 'Secure Payment', sub: `Encrypted · ${primaryAddress?.city || 'UAE'}` },
                ].map(({ icon: Icon, title, sub }) => (
                  <div key={title} className="flex items-start gap-2.5 p-3 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.5)' }}>
                    <Icon size={15} strokeWidth={1.6} className="text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[12px] font-semibold text-[#1a0533]">{title}</p>
                      <p className="text-[11px] text-black/40">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* ── Product details (description / benefits / brand) ── */}
        {(product.long_description || product.description || product.benefits || product.ingredients || product.brand) && (
          <section className="border-t border-gray-100 px-5 lg:px-16 py-14 lg:py-20">
            <div className="max-w-[1200px] mx-auto space-y-12">

              {(product.long_description || product.description) && (
                <div>
                  <h2 className="text-[18px] font-bold text-[#1a0533] mb-4">Product description</h2>
                  <p className="text-[14px] text-black/55 leading-[1.7]">
                    {product.long_description || product.description}
                  </p>
                </div>
              )}

              {(product.benefits || product.ingredients || ingredients.length > 0 || product.brand) && (
                <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 pt-6 border-t border-gray-100 items-start">

                  {product.benefits && (
                    <div>
                      <h2 className="text-[18px] font-bold text-[#1a0533] mb-5">Benefits</h2>
                      {product.benefits.split('\n').filter(Boolean).map((b, i) => (
                        <div key={i} className="flex items-start gap-3 py-2.5 border-b border-gray-100">
                          <span className="text-[11px] font-medium tabular-nums mt-0.5 w-5 flex-shrink-0 text-purple-400">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <p className="text-[13px] text-black/55 leading-relaxed">{b.replace(/^[-•]\s*/, '')}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-10">
                    {(product.ingredients || ingredients.length > 0) && (
                      <div>
                        <h2 className="text-[18px] font-bold text-[#1a0533] mb-4">Formulation</h2>
                        {product.ingredients ? (
                          <p className="text-[13px] text-black/55 leading-[1.7]">{product.ingredients}</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {ingredients.map((ing, i) => (
                              <span key={i} className="px-3 py-1.5 rounded-full border text-[12px] font-medium text-purple-600"
                                style={{ borderColor: 'rgba(216,180,254,0.35)', background: 'rgba(255,255,255,0.6)' }}>
                                {ing}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {product.brand && (
                      <div className="pt-8 border-t border-gray-100">
                        <h2 className="text-[18px] font-bold text-[#1a0533] mb-4">Brand</h2>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-16 h-16 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                            {product.brandImageUrl ? (
                              <Image src={product.brandImageUrl} alt={product.brand} width={64} height={64}
                                className="object-contain p-2 w-full h-full" />
                            ) : (
                              <span className="text-2xl font-bold text-black/15 select-none">
                                {product.brand.charAt(0)}
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/all-products?brand=${encodeURIComponent(product.brand)}`}
                            className="text-[14px] font-semibold text-[#1a0533] hover:text-purple-600 transition-colors underline underline-offset-2 decoration-purple-200"
                          >
                            {product.brand.toUpperCase()}
                          </Link>
                        </div>
                        <p className="text-[13px] text-black/50 leading-[1.7]">
                          Formulated with a commitment to purity, efficacy, and uncompromising quality for those who demand the very best.
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </section>
        )}

        {/* ── How to use ── */}
        {(product.how_to_use || product.how_to_use_video) && (
          <section className="border-t border-gray-100 px-5 lg:px-16 py-14 lg:py-20">
            <div className="max-w-[1200px] mx-auto">
              <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-start">

                {product.how_to_use_video && (
                  <div className="relative rounded-3xl overflow-hidden bg-black h-[320px] lg:h-[420px] group"
                    style={{ border: '1px solid rgba(216,180,254,0.18)' }}>
                    <video src={product.how_to_use_video} autoPlay muted loop playsInline
                      className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-[1.03]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-5 left-5">
                      <p className="text-[9px] font-semibold text-white/45 uppercase tracking-widest mb-1">How to use</p>
                      <p className="text-[13px] font-medium text-white/90">{product.name}</p>
                    </div>
                  </div>
                )}

                {product.how_to_use && (
                  <div>
                    <h2 className="text-[18px] font-bold text-[#1a0533] mb-5">How to use</h2>
                    {product.how_to_use.split('\n').filter(Boolean).map((step, i) => (
                      <div key={i} className="flex items-start gap-3 py-2.5 border-b border-gray-100">
                        <span className="text-[11px] font-medium tabular-nums mt-0.5 w-5 text-purple-400">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <p className="text-[13px] text-black/55 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Recommendations ── */}
        {recommendations.length > 0 && (
          <section className="border-t border-gray-100 pt-10 pb-14 px-5 lg:px-20">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-400 mb-1">Complete the routine</p>
                  <h2 className="text-[26px] lg:text-[34px] font-bold text-[#1a0533] leading-tight">You might also like</h2>
                </div>
                <Link href="/all-products"
                  className="text-[13px] font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 group">
                  View all <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <Carousel opts={{ align: 'start', loop: true }} className="w-full">
                <CarouselContent className="-ml-4">
                  {recommendations.map((rec) => (
                    <CarouselItem key={rec.id} className="pl-4 basis-full md:basis-1/3 lg:basis-1/4">
                      <ProductCard {...rec} image={rec.imageUrl} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="hidden md:block">
                  <CarouselPrevious className="-left-12" />
                  <CarouselNext className="-right-12" />
                </div>
              </Carousel>
            </div>
          </section>
        )}
      </div>

      {/* ── Reviews ── */}
      <div id="reviews" className="pt-10 pb-16 px-5 lg:px-20 border-t border-gray-100 bg-white">
        <Reviews productId={product.id} />
      </div>
    </div>
  );
}
