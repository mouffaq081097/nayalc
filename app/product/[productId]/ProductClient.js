'use client';

import { useState, useEffect, use, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Heart, Star, Plus, Minus, Check, ChevronRight, Info, ArrowRight, Sparkles, Zap, Maximize2, Loader2, Clock, ShieldCheck, Quote, FlaskConical, Droplets, Microscope, Waves, Truck, RotateCcw, X, ShoppingBag } from 'lucide-react';
import Reviews from '../../components/Reviews';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import ProductCard from '../../components/ProductCard';

export default function ProductClient({ params, initialProduct }) {
  const resolvedParams = use(params);
  const { productId } = resolvedParams;
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { products: allProducts } = useAppContext();
  const router = useRouter();
  
  // SCROLL ANIMATION ENGINE
  const { scrollYProgress } = useScroll();
  
  const springScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const scale = useTransform(springScroll, [0, 0.1], [1, 0.95]);

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

  const ingredients = useMemo(() => {
    if (!product?.description) return [];
    // Extract potential key ingredients from description or use defaults
    const commonIngredients = ['Hyaluronic Acid', 'Vitamin C', 'Retinol', 'Peptides', 'Niacinamide', 'Ceramides'];
    return commonIngredients.filter(ing => product.description.toLowerCase().includes(ing.toLowerCase())).slice(0, 3);
  }, [product]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (initialProduct && !user) return; // Only re-fetch if we need wishlist or didn't have initial data
      
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
            const isInWishlist = wishlistData.wishlist ? 
                wishlistData.wishlist.some(item => item.productId === data.id || item.productId === productId) :
                false;
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
      const response = await fetch(isWishlisted ? `/api/wishlist/${user.id}/${product.id}` : `/api/wishlist`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: isWishlisted ? null : JSON.stringify({ userId: user.id, productId: product.id }),
      });
      if (response.ok) setIsWishlisted(!isWishlisted);
    } catch (error) { console.error('Error updating wishlist:', error); }
  };

  const recommendations = useMemo(() => {
    if (!product || !allProducts) return [];
    return allProducts.filter(p => p.id !== product.id && (p.brand === product.brand || p.categoryNames === product.categoryNames)).slice(0, 4);
  }, [product, allProducts]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cl-bg)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(196,167,254,0.25)', borderTopColor: 'rgb(147,104,236)' }}></div>
        <span className="text-[10px] tracking-[0.4em] text-gray-400 font-bold">Synchronizing Vault</span>
      </div>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <h2 className="text-3xl font-serif italic text-gray-900">Selection Offline</h2>
        <Button onClick={() => router.push('/all-products')} className="bg-black text-white px-10 py-6 rounded-full text-[11px] font-black tracking-[0.3em] transition-all">
          Return to Boutique
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans text-[#1d1d1f] antialiased selection:bg-purple-100/40" style={{ background: 'var(--cl-bg)' }}>

      {/* Sticky Buy Bar — appears when main Add to Bag scrolls out of view */}
      <AnimatePresence>
        {showStickyBar && product && (
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed top-[78px] left-0 right-0 z-[140] hidden lg:block px-4"
          >
            <div className="max-w-5xl mx-auto">
              <div
                className="flex items-center justify-between px-6 h-12 rounded-2xl backdrop-blur-2xl border"
                style={{ background: 'rgba(253,248,255,0.96)', borderColor: 'rgba(216,180,254,0.40)', boxShadow: '0 4px 24px rgba(147,51,234,0.10)' }}
              >
                <div>
                  <p className="text-[10px] font-black tracking-tight text-gray-400 leading-none mb-0.5 uppercase">{product.brand || 'Naya Lumière'}</p>
                  <h2 className="text-[13px] font-semibold tracking-tight text-gray-900 leading-none">{product.name}</h2>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[14px] font-semibold">AED {Number(product.price).toFixed(2)}</span>
                  <button
                    onClick={handleAddToCart}
                    className={`flex items-center gap-2 h-8 px-5 rounded-full text-[10px] font-black tracking-tight transition-all duration-500 shadow-md text-white uppercase ${isAdded ? 'bg-green-600' : ''}`}
                    style={!isAdded ? { background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))' } : {}}
                  >
                    {isAdded ? <><Check size={13} /> Secured</> : <><ShoppingBag size={13} /> Add to Bag</>}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Image Modal */}
      <AnimatePresence>
        {isZoomed && product && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[500] bg-black/92 backdrop-blur-md flex items-center justify-center"
            onClick={() => setIsZoomed(false)}
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              transition={{ duration: 0.25 }}
              className="relative max-h-[90vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={product.images ? product.images[selectedImage] : product.imageUrl}
                alt={product.name}
                width={900}
                height={1100}
                className="max-h-[85vh] max-w-[85vw] object-contain rounded-2xl"
              />
              {product.images && product.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {product.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${selectedImage === i ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1440px] mx-auto">
        <div className="grid lg:grid-cols-12 gap-0 lg:pt-24 pb-12">
          
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7 px-0 lg:px-12">
            <div className="lg:sticky lg:top-32">

              {/* ── Gallery: vertical thumbnail rail + main image side by side ── */}
              <div className="flex gap-3 lg:gap-4">

                {/* Vertical thumbnail rail — desktop only */}
                {product.images && product.images.length > 1 && (
                  <div className="hidden lg:flex flex-col gap-2.5 flex-shrink-0" style={{ width: 76 }}>
                    {product.images.map((img, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="relative overflow-hidden rounded-2xl flex-shrink-0 transition-all duration-300"
                        style={{
                          width: 76,
                          height: 96,
                          background: '#fff',
                          border: selectedImage === index
                            ? '2px solid rgb(147,104,236)'
                            : '2px solid rgba(216,180,254,0.3)',
                          boxShadow: selectedImage === index
                            ? '0 0 0 3px rgba(196,167,254,0.22), 0 4px 16px rgba(147,51,234,0.14)'
                            : '0 1px 4px rgba(0,0,0,0.06)',
                          opacity: selectedImage === index ? 1 : 0.52,
                        }}
                        aria-label={`View image ${index + 1}`}
                      >
                        {/* Active indicator bar */}
                        {selectedImage === index && (
                          <motion.div
                            layoutId="thumb-active"
                            className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full z-10"
                            style={{ background: 'linear-gradient(180deg, rgb(196,167,254), rgb(126,105,230))' }}
                          />
                        )}
                        <Image
                          src={img}
                          alt={product.imagesData?.[index]?.alt || `${product.name} - View ${index + 1}`}
                          fill
                          sizes="76px"
                          className="object-contain p-2"
                        />
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Main image */}
                <div className="flex-1 flex flex-col gap-6">
                  <motion.div
                    style={{
                      scale: typeof window !== 'undefined' && window.innerWidth > 1024 ? scale : 1,
                      background: '#fafafa',
                      boxShadow: '0 2px 40px rgba(147,51,234,0.06), 0 1px 4px rgba(0,0,0,0.04)',
                    }}
                    className="w-full aspect-[3/4] lg:aspect-[4/5] lg:rounded-[2rem] overflow-hidden relative group cursor-zoom-in"
                    onClick={() => setIsZoomed(true)}
                  >
                    {/* Subtle radial light center */}
                    <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(255,255,255,0.9) 0%, rgba(248,244,255,0.4) 100%)' }} />

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedImage}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.01 }}
                        transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="absolute inset-0 flex items-center justify-center p-8 lg:p-12 z-10"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.15}
                        onDragEnd={(_, { offset }) => {
                          if (offset.x < -50 && product.images && selectedImage < product.images.length - 1)
                            setSelectedImage(selectedImage + 1);
                          else if (offset.x > 50 && selectedImage > 0)
                            setSelectedImage(selectedImage - 1);
                        }}
                      >
                        <Image
                          src={product.images ? product.images[selectedImage] : product.imageUrl}
                          alt={product.imagesData?.[selectedImage]?.alt || `${product.name} - Premium Skincare`}
                          width={680}
                          height={850}
                          priority
                          className="max-w-full max-h-full object-contain drop-shadow-sm transition-transform duration-700 group-hover:scale-[1.03] pointer-events-none"
                          style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }}
                        />
                      </motion.div>
                    </AnimatePresence>

                    {/* Mobile: dot indicators */}
                    {product.images && product.images.length > 1 && (
                      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-30 lg:hidden">
                        {product.images.map((_, i) => (
                          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${selectedImage === i ? 'w-4' : 'w-1.5'}`} style={{ background: selectedImage === i ? 'rgb(147,104,236)' : 'rgba(196,167,254,0.5)' }} />
                        ))}
                      </div>
                    )}

                    {/* Zoom icon */}
                    <button className="hidden lg:flex absolute top-5 right-5 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-sm z-30 border border-gray-100/80 hover:text-gray-700">
                      <Maximize2 size={14} />
                    </button>

                    {/* Image counter badge */}
                    {product.images && product.images.length > 1 && (
                      <div className="hidden lg:flex absolute bottom-5 right-5 items-center gap-1.5 px-2.5 py-1 rounded-full z-30"
                        style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(8px)', border: '1px solid rgba(216,180,254,0.3)' }}>
                        <span className="text-[10px] font-bold tabular-nums" style={{ color: 'rgb(126,105,230)' }}>{selectedImage + 1}</span>
                        <span className="text-[10px] text-gray-300">/</span>
                        <span className="text-[10px] font-medium text-gray-400">{product.images.length}</span>
                      </div>
                    )}
                  </motion.div>

                  {/* Feature pills row */}
                  <div className="hidden lg:flex items-center gap-3">
                    {[
                      { icon: FlaskConical, label: 'Clinically Tested' },
                      { icon: Droplets, label: 'Pure Botanicals' },
                      { icon: ShieldCheck, label: 'Dermatologist Approved' },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                        style={{ background: 'rgba(248,240,255,0.8)', borderColor: 'rgba(216,180,254,0.3)', color: 'rgb(126,105,230)' }}>
                        <Icon size={11} strokeWidth={2} />
                        <span className="text-[10px] font-semibold tracking-wide">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-5 px-6 lg:pr-16 lg:pl-0 mt-8 lg:mt-0 text-left">
            <div className="space-y-8 lg:space-y-10 lg:sticky lg:top-32">
                <div className="space-y-2 lg:space-y-3 text-left">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="h-[1px] w-6 hidden lg:block" style={{ background: 'rgba(196,167,254,0.6)' }}></span>
                            <p className="text-[12px] lg:text-[13px] font-black tracking-tight uppercase" style={{ color: 'rgb(147,104,236)' }}>{product.brand || 'Naya Lumière Signature'}</p>
                        </div>
                        {product.isNew && <Badge className="bg-gray-100 text-gray-900 border-none px-2.5 py-1 rounded-md text-[8px] font-black tracking-widest lg:hidden">New</Badge>}
                    </div>
                    <h1 className="text-3xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-gray-900">{product.name}</h1>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl lg:text-2xl font-semibold">AED {Number(product.price).toFixed(2)}</span>
                        {product.comparedprice > product.price && <span className="text-sm lg:text-base text-gray-400 line-through">AED {Number(product.comparedprice).toFixed(2)}</span>}
                    </div>
                </div>

                <div className="flex items-center gap-3 lg:hidden">
                    <button
                      onClick={handleAddToCart}
                      className={`flex-grow h-12 rounded-full text-[11px] font-black tracking-tight uppercase transition-all duration-500 text-white active:scale-[0.98] ${isAdded ? 'bg-green-600' : ''}`}
                      style={!isAdded ? { background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))' } : {}}
                    >
                        {isAdded ? 'Selection Secured' : 'Add to Bag'}
                    </button>
                    <button onClick={handleWishlistToggle} className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all`}
                      style={isWishlisted ? { background: 'rgba(196,167,254,0.1)', color: 'rgb(126,105,230)', borderColor: 'rgba(196,167,254,0.4)' } : { background: 'var(--cl-glass)', color: 'var(--cl-text-deep)', borderColor: 'var(--cl-glass-border)' }}
                    >
                        <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
                    </button>
                </div>

                <div className="flex items-center gap-6 py-4 lg:py-5 border-y border-gray-100">
                    <div className="flex flex-col gap-0.5 text-left">
                        <div className="flex items-center gap-1">
                            <span className="text-base font-bold">4.9</span>
                            <div style={{ color: 'rgb(167,139,250)' }}>{[...Array(5)].map((_, i) => <Star key={i} size={11} fill="currentColor" />)}</div>
                        </div>
                        <span className="text-[8px] lg:text-[9px] font-bold text-gray-400 tracking-widest">Satisfaction</span>
                    </div>
                    <Separator orientation="vertical" className="h-6 lg:h-8" />
                    <div className="flex flex-col gap-0.5 text-left">
                        <span className="text-base font-bold">100%</span>
                        <span className="text-[8px] lg:text-[9px] font-bold text-gray-400 tracking-widest">Originality</span>
                    </div>
                </div>

                <div className="space-y-6 lg:space-y-8 text-left">
                    <div className="space-y-2 lg:space-y-3">
                        <h3 className="text-[10px] lg:text-[11px] font-bold tracking-widest text-gray-400">The Selection</h3>
                        <p className="text-[14px] lg:text-[15px] text-gray-600 leading-relaxed font-normal">{product.description}</p>
                    </div>

                    {product.benefits && (
                        <div className="space-y-2 lg:space-y-3">
                            <h3 className="text-[10px] lg:text-[11px] font-bold tracking-widest text-gray-400">Benefits</h3>
                            <ul className="space-y-1.5">
                                {product.benefits.split('\n').filter(Boolean).map((b, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[13px] lg:text-[14px] text-gray-600 leading-relaxed">
                                        <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: 'rgb(167,139,250)' }} />
                                        {b.replace(/^[-•]\s*/, '')}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {product.ingredients && (
                        <div className="space-y-2 lg:space-y-3">
                            <h3 className="text-[10px] lg:text-[11px] font-bold tracking-widest text-gray-400">Key Ingredients</h3>
                            <p className="text-[13px] lg:text-[14px] text-gray-500 leading-relaxed">{product.ingredients}</p>
                        </div>
                    )}

                    {!product.ingredients && ingredients.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {ingredients.map((ing, i) => (
                                <div key={i} className="px-3 py-1.5 lg:px-4 lg:py-2 bg-gray-50 rounded-full border border-gray-100 flex items-center gap-1.5">
                                    <Sparkles size={10} style={{ color: 'rgb(167,139,250)', opacity: 0.7 }} />
                                    <span className="text-[9px] lg:text-[10px] font-black tracking-widest text-gray-900">{ing}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ background: 'var(--cl-bg-lavender)', borderColor: 'var(--cl-glass-border)' }}>
                        <div className="space-y-0.5 text-left">
                            <span className="text-[9px] font-bold text-gray-400 tracking-widest">Quantity</span>
                            <p className="text-[13px] font-semibold">Reserve {quantity} units</p>
                        </div>
                        <div className="flex items-center bg-white rounded-full p-1 shadow-sm gap-1">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-50"><Minus size={14} /></button>
                            <span className="text-base font-bold w-6 text-center tabular-nums">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-50"><Plus size={14} /></button>
                        </div>
                    </div>

                    <div className="hidden lg:block">
                        <div className="space-y-3" ref={buyButtonRef}>
                            <button
                              onClick={handleAddToCart}
                              className={`w-full h-14 rounded-xl text-[13px] font-bold tracking-widest transition-all duration-500 text-white ${isAdded ? 'bg-green-600' : ''}`}
                              style={!isAdded ? { background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))', boxShadow: '0 8px 28px rgba(147,51,234,0.25)' } : {}}
                            >
                                {isAdded ? <div className="flex items-center justify-center gap-2"><Check size={18} /> Selection Secured</div> : 'Reserve for Acquisition'}
                            </button>
                            <button
                              onClick={handleWishlistToggle}
                              className="w-full h-12 rounded-xl border text-[11px] font-bold tracking-[0.1em] transition-all flex items-center justify-center gap-2"
                              style={isWishlisted ? { background: 'rgba(196,167,254,0.1)', color: 'rgb(126,105,230)', borderColor: 'rgba(196,167,254,0.4)' } : { background: 'var(--cl-glass)', color: 'var(--cl-text-deep)', borderColor: 'var(--cl-glass-border)' }}
                            >
                                <Heart size={16} className={isWishlisted ? 'fill-current' : ''} /> {isWishlisted ? 'Saved to Vault' : 'Save for Later'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:gap-5 pt-8 border-t border-gray-100 text-left">
                    {[ 
                        { icon: Truck, title: "Priority Emirates Shipping", desc: "Complimentary on acquisitions over 200 AED." },
                        { icon: ShieldCheck, title: "Authenticity Certified", desc: "100% original masterpieces from official ateliers." },
                        { icon: RotateCcw, title: "Boutique Return Standard", desc: "30-day elite protection on all selections." }
                    ].map((feat, i) => (
                        <div key={i} className="flex gap-4 group cursor-default">
                            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center transition-colors group-hover:scale-105" style={{ background: 'rgba(216,180,254,0.15)', color: 'rgb(126,105,230)' }}><feat.icon size={18} strokeWidth={1.5} /></div>
                            <div className="space-y-0.5 text-left">
                                <h4 className="text-[11px] lg:text-[12px] font-bold tracking-tight">{feat.title}</h4>
                                <p className="text-[11px] lg:text-[12px] text-gray-500 leading-snug">{feat.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </div>

        <section className="mt-20 space-y-24 px-6 lg:px-20 pb-20 relative">
            <div className="max-w-5xl mx-auto text-center space-y-10">
                <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                    <Badge className="border-none font-black text-[11px] lg:text-[12px] tracking-[0.3em] px-6 py-2.5 text-white" style={{ background: 'linear-gradient(135deg, rgb(216,180,254), rgb(167,139,250))' }}>The Narrative</Badge>
                    <h2 className="text-4xl lg:text-6xl font-semibold tracking-tight text-gray-900 leading-[1.1]">Designed for <br/> <span className="italic serif font-light" style={{ color: 'rgb(147,104,236)' }}>Absolute Radiance.</span></h2>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.3 }} className="relative">
                    <Quote className="absolute -left-12 -top-12 w-24 h-24 -scale-x-100" style={{ color: 'rgba(196,167,254,0.15)' }} />
                    <p className="text-lg lg:text-2xl text-gray-500 leading-[1.6] font-medium max-w-3xl mx-auto italic text-center">{product.long_description || product.description}</p>
                </motion.div>
            </div>

            <div className="rounded-[4rem] p-12 lg:p-20 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, var(--cl-bg-lavender), rgba(248,240,255,0.8))' }}>
                <div className="grid lg:grid-cols-12 gap-16 relative z-10 text-left">
                    <div className="lg:col-span-4 space-y-6">
                        <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight leading-tight text-gray-900">Our <br/> Standards.</h2>
                        <p className="text-gray-500 text-base leading-relaxed font-normal">Every Naya Lumière selection is held to the highest standards of clean beauty, clinical integrity, and ethical sourcing.</p>
                    </div>
                    <div className="lg:col-span-8 grid md:grid-cols-2 gap-x-10 gap-y-10">
                        {[
                            { label: 'Animal Welfare', value: 'Cruelty Free', icon: ShieldCheck },
                            { label: 'Clinical Validation', value: 'Dermatologically Tested', icon: FlaskConical },
                            { label: 'Formula Integrity', value: 'Vegan Formula', icon: Droplets },
                            { label: 'Clean Chemistry', value: 'Paraben & SLS Free', icon: Zap },
                            { label: 'Beauty Standard', value: 'Clean Beauty Certified', icon: Sparkles },
                            { label: 'Environmental Care', value: 'Sustainable Sourcing', icon: Waves }
                        ].map((spec, i) => (
                            <div key={i} className="space-y-3 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><spec.icon size={12} style={{ color: 'rgb(147,104,236)' }} /></div>
                                    <span className="text-[10px] font-bold text-gray-400 tracking-widest">{spec.label}</span>
                                </div>
                                <p className="text-xl font-medium border-b border-gray-200 pb-3 text-gray-900">{spec.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="absolute right-0 bottom-0 text-[20vw] font-black text-white/40 select-none pointer-events-none -mb-16 -mr-8 italic">Soin</div>
            </div>

            {product.how_to_use && (
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-20 items-start text-left">
                    <div className="space-y-8 lg:sticky lg:top-40">
                        <div className="space-y-4">
                            <Badge className="border-none px-6 py-2.5 rounded-full text-[11px] lg:text-[12px] font-black tracking-widest text-white" style={{ background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))' }}>Protocol</Badge>
                            <h2 className="text-4xl lg:text-6xl font-semibold tracking-tighter leading-tight">The Ritual.</h2>
                        </div>
                        <p className="text-lg text-gray-500 leading-relaxed font-medium">A precise sequence designed to synchronize our clinical formulas with your skin's natural frequency.</p>
                        <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl relative group bg-[#f5f5f7]">
                            <Image 
                                src={product.imageUrl || (product.images && product.images[0]) || '/favicon.jpeg'} 
                                alt={`${product.name} - Ritual Application Guide`}
                                width={600} 
                                height={800} 
                                className="w-full h-full object-contain p-12 mix-blend-multiply transition-transform duration-[2000ms] group-hover:scale-110" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent pointer-events-none"></div>
                            <div className="absolute bottom-10 left-10 text-gray-900">
                                <p className="text-xs font-bold tracking-[0.2em] opacity-40">Ritual Masterpiece</p>
                                <h4 className="text-xl font-serif italic">{product.name}</h4>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-16 pt-8 text-left">
                        {product.how_to_use.split('\n').map((step, i) => (
                            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} key={i} className="space-y-4 group">
                                <span className="text-[60px] lg:text-[80px] font-black leading-none select-none block" style={{ color: 'rgba(196,167,254,0.12)' }}>0{i+1}</span>
                                <div className="space-y-3">
                                    <h3 className="text-xl lg:text-2xl font-semibold">Step {i+1}</h3>
                                    <p className="text-lg lg:text-xl text-gray-500 leading-relaxed font-normal">{step}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </section>

        <section className="py-24 border-y relative overflow-hidden" style={{ background: 'var(--cl-bg-lavender)', borderColor: 'rgba(216,180,254,0.25)' }}>
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] select-none pointer-events-none"><span className="text-[20vw] font-black tracking-tighter italic">Standards</span></div>
            <div className="max-w-7xl mx-auto px-6 lg:px-20 relative z-10 text-center">
                <div className="mb-16 space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <span className="h-[1px] w-8" style={{ background: 'rgba(196,167,254,0.6)' }}></span>
                        <span className="text-[10px] font-black tracking-[0.4em]" style={{ color: 'rgb(147,104,236)' }}>Boutique Ethics</span>
                        <span className="h-[1px] w-8" style={{ background: 'rgba(196,167,254,0.6)' }}></span>
                    </div>
                    <h2 className="text-3xl lg:text-5xl font-semibold tracking-tight text-gray-900">Selection Integrity</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                    {[ 
                        { icon: ShieldCheck, title: "Authenticity", desc: "Every selection is 100% original, verified by our Paris curator and protected by Naya encryption.", bg: "bg-white/80" },
                        { icon: Droplets, title: "Pure Efficacy", desc: "Formulated without biological compromise. Clinical results driven by nature's most potent botanicals.", bg: "bg-white/80" },
                        { icon: Sparkles, title: "Elite Privilege", desc: "Acquisition grants permanent access to our exclusive Lumière VIP journal and laboratory previews.", bg: "bg-white/80" }
                    ].map((item, i) => (
                        <div key={i} className="backdrop-blur-xl p-10 rounded-[3rem] border border-white/60 transition-all duration-700 flex flex-col items-center text-center space-y-6" style={{ background: 'rgba(255,255,255,0.75)', boxShadow: '0 8px 32px rgba(147,51,234,0.06)' }}>
                            <div className="w-16 h-16 rounded-[1.5rem] border flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg" style={{ background: 'rgba(216,180,254,0.12)', borderColor: 'rgba(196,167,254,0.25)', color: 'rgb(126,105,230)' }}><item.icon size={28} strokeWidth={1.5} /></div>
                            <div className="space-y-3">
                                <h3 className="text-xl font-bold tracking-tight text-gray-900">{item.title}</h3>
                                <p className="text-[15px] text-gray-500 font-medium leading-relaxed italic">"{item.desc}"</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        <section className="py-24 px-6 lg:px-20 text-left" style={{ background: 'var(--cl-bg)' }}>
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row items-end justify-between gap-6 border-b border-gray-100 pb-8 text-left">
                    <div className="space-y-2">
                        <Badge className="border-none font-bold text-[9px] tracking-widest px-3 py-1 text-white" style={{ background: 'linear-gradient(135deg, rgb(216,180,254), rgb(167,139,250))' }}>Synergy</Badge>
                        <h2 className="text-3xl lg:text-5xl font-semibold tracking-tight text-gray-900 leading-none">Complete the Routine.</h2>
                    </div>
                    <Link href="/all-products" className="hover:underline flex items-center gap-1 text-base font-medium group text-left" style={{ color: 'rgb(126,105,230)' }}>
                        Explore Collections <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
                    {recommendations.map((rec) => (
                        <ProductCard key={rec.id} {...rec} image={rec.imageUrl} />
                    ))}
                </div>
            </div>
        </section>

        <div id="reviews" className="py-24 px-6 lg:px-20 border-t" style={{ background: 'var(--cl-bg-lavender)', borderColor: 'rgba(216,180,254,0.25)' }}>
            <Reviews productId={product.id} />
        </div>
      </div>
    </div>
  );
}
