'use client';

import { useState, useEffect, use, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Heart, Star, Plus, Minus, Check, ChevronRight, Sparkles, Maximize2, ShieldCheck, FlaskConical, Droplets, Waves, Truck, RotateCcw, X, ShoppingBag, Lock } from 'lucide-react';
import Reviews from '../../components/Reviews';
import TabbyPromo from '../../components/TabbyPromo';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import ProductCard from '../../components/ProductCard';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '../../components/ui/carousel';

export default function ProductClient({ params, initialProduct }) {
  const resolvedParams = use(params);
  const { productId } = resolvedParams;
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { shippingAddresses, fetchShippingAddresses } = useUser();
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

  const primaryAddress = useMemo(() => {
    return shippingAddresses?.find((addr) => addr.is_primary) || shippingAddresses?.[0] || null;
  }, [shippingAddresses]);

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
        <span className="text-[10px] tracking-[0.4em] text-black/80 font-bold font-bold">Synchronizing Vault</span>
      </div>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <h2 className="text-3xl font-serif italic text-black font-black">Selection Offline</h2>
        <Button onClick={() => router.push('/all-products')} className="cl-gradient-btn px-10 py-6 rounded-full text-[11px] font-black tracking-[0.3em] transition-all">
          Return to Boutique
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans text-[#1d1d1f] antialiased selection:bg-purple-100/40 bg-white">

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
                  <p className="text-[10px] font-black tracking-tight text-black/80 font-bold leading-none mb-0.5 uppercase">{product.brand || 'Naya Lumière'}</p>
                  <h2 className="text-[13px] font-semibold tracking-tight text-black font-black leading-none">{product.name}</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[9px] font-semibold text-purple-300">AED</span>
                    <span className="text-[15px] font-bold" style={{
                      backgroundImage: 'linear-gradient(135deg, rgb(147,104,236), rgb(196,167,254))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>{Number(product.price).toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className={`cl-gradient-btn flex items-center gap-2 h-8 px-5 rounded-full text-[10px] font-black tracking-tight transition-all duration-500 shadow-md text-white uppercase ${isAdded ? 'bg-green-600' : ''}`}
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
          <div className="lg:col-span-6 px-0 lg:px-12">
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
                        className="absolute inset-0 flex items-center justify-center p-6 lg:p-10 z-10"
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
                          width={850}
                          height={1000}
                          priority
                          className="max-w-full max-h-full object-contain drop-shadow-sm transition-transform duration-700 group-hover:scale-[1.03] pointer-events-none"
                          style={{ width: 'auto', height: 'auto' }}
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
                    <button className="hidden lg:flex absolute top-5 right-5 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md items-center justify-center text-black/80 font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-sm z-30 border border-gray-100/80 hover:text-black font-bold">
                      <Maximize2 size={14} />
                    </button>

                    {/* Image counter badge */}
                    {product.images && product.images.length > 1 && (
                      <div className="hidden lg:flex absolute bottom-5 right-5 items-center gap-1.5 px-2.5 py-1 rounded-full z-30"
                        style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(8px)', border: '1px solid rgba(216,180,254,0.3)' }}>
                        <span className="text-[10px] font-bold tabular-nums" style={{ color: 'rgb(126,105,230)' }}>{selectedImage + 1}</span>
                        <span className="text-[10px] text-black/60 font-bold">/</span>
                        <span className="text-[10px] font-bold text-black/80 font-bold">{product.images.length}</span>
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
          <div className="lg:col-span-6 px-6 lg:pr-12 lg:pl-4 mt-8 lg:mt-0 text-left">
            <div className="space-y-8 lg:space-y-10 lg:sticky lg:top-32">
                <div className="space-y-2 lg:space-y-3 text-left">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="h-[1px] w-6 hidden lg:block" style={{ background: 'rgba(196,167,254,0.6)' }}></span>
                            <p className="text-[12px] lg:text-[13px] font-black tracking-tight uppercase" style={{ color: 'rgb(147,104,236)' }}>{product.brand || 'Naya Lumière Signature'}</p>
                        </div>
                        {product.isNew && <Badge className="bg-gray-100 text-black font-black border-none px-2.5 py-1 rounded-md text-[8px] font-black tracking-widest lg:hidden">New</Badge>}
                    </div>
                    <h1 className="text-3xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-black font-black">{product.name}</h1>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-5">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-[11px] lg:text-[12px] font-semibold" style={{ color: 'rgb(167,139,250)' }}>AED</span>
                                <span className="text-4xl lg:text-5xl font-bold" style={{
                                  backgroundImage: 'linear-gradient(135deg, rgb(147,104,236), rgb(196,167,254))',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                }}>
                                  {Number(product.price).toFixed(2)}
                                </span>
                            </div>

                            {product.comparedprice > product.price && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm text-gray-300 line-through font-medium">AED {Number(product.comparedprice).toFixed(2)}</span>
                                    <Badge className="bg-purple-50 text-purple-400 border border-purple-100 px-2.5 py-1 rounded-full text-[9px] font-semibold w-fit">
                                        Save {Math.round(((product.comparedprice - product.price) / product.comparedprice) * 100)}%
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>
                    <TabbyPromo price={product.price} source="product" />
                </div>

                <div className="flex items-center gap-3 lg:hidden">
                    <button
                      onClick={handleAddToCart}
                      className={`cl-gradient-btn flex-grow h-12 rounded-full text-[11px] font-black tracking-tight uppercase transition-all duration-500 text-white active:scale-[0.98] ${isAdded ? 'bg-green-600 shadow-none' : ''}`}
                    >
                        {isAdded ? 'Selection Secured' : 'Add to Bag'}
                    </button>
                    <button onClick={handleWishlistToggle} className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all`}
                      style={isWishlisted ? { background: 'rgba(196,167,254,0.1)', color: 'rgb(126,105,230)', borderColor: 'rgba(196,167,254,0.4)' } : { background: 'var(--cl-glass)', color: 'var(--cl-text-deep)', borderColor: 'var(--cl-glass-border)' }}
                    >
                        <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
                    </button>
                </div>

                <div className="py-2">
                    <div className="inline-flex items-center gap-4 px-5 py-3 rounded-2xl border transition-all duration-300 hover:shadow-sm" style={{ background: 'rgba(248,240,255,0.3)', borderColor: 'rgba(216,180,254,0.25)' }}>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                        key={star} 
                                        size={14} 
                                        fill={star <= Math.round(product.averageRating || 4.9) ? "rgb(147,104,236)" : "transparent"} 
                                        className={star <= Math.round(product.averageRating || 4.9) ? "text-[rgb(147,104,236)]" : "text-gray-300"}
                                    />
                                ))}
                                <span className="text-[14px] font-bold text-black ml-1">{product.averageRating || '4.9'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-black/60 tracking-wider uppercase">Customer Satisfaction</span>
                                <span className="w-1 h-1 rounded-full bg-black/20"></span>
                                <span className="text-[10px] font-bold text-black/40 uppercase tracking-tight">Verified Reviews</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 lg:space-y-5 text-left">
                    {product.form && (
                        <div className="flex items-center justify-between px-1 pb-4 border-b border-gray-100">
                            <span className="text-[12px] text-black/45 font-medium">Form</span>
                            <span className="text-[13px] font-semibold text-black">{product.form}</span>
                        </div>
                    )}
                    {product.size && (
                        <div className="flex items-center justify-between px-1 pb-4 border-b border-gray-100">
                            <span className="text-[12px] text-black/45 font-medium">Size / Volume</span>
                            <span className="text-[13px] font-semibold text-black">{product.size}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(216,180,254,0.35)' }}>
                        <span className="text-[12px] text-black/45 font-medium">Quantity</span>
                        <div className="flex items-center bg-white rounded-full p-1 gap-1 border" style={{ borderColor: 'rgba(216,180,254,0.3)' }}>
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--cl-bg-lavender)] text-black/60 hover:text-[var(--cl-purple)] transition-colors"><Minus size={13} strokeWidth={2} /></button>
                            <span className="text-[13px] font-semibold w-6 text-center tabular-nums text-black">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--cl-bg-lavender)] text-black/60 hover:text-[var(--cl-purple)] transition-colors"><Plus size={13} strokeWidth={2} /></button>
                        </div>
                    </div>

                    <div className="hidden lg:block">
                        <div className="space-y-3" ref={buyButtonRef}>
                            <button
                              onClick={handleAddToCart}
                              className={`cl-gradient-btn w-full h-14 rounded-xl text-[14px] font-bold tracking-wide transition-all duration-500 text-white shadow-md active:scale-95 flex items-center justify-center gap-2 ${isAdded ? 'bg-green-600 shadow-none' : ''}`}
                            >
                                {isAdded ? <><Check size={18} /> Selection Secured</> : <><ShoppingBag size={16} /> Add to Bag</>}
                            </button>
                            <button
                              onClick={handleWishlistToggle}
                              className={`cl-gradient-btn w-full h-12 rounded-xl text-[11px] font-bold tracking-[0.1em] transition-all flex items-center justify-center gap-2 ${isWishlisted ? 'opacity-80' : ''}`}
                            >
                                <Heart size={16} className={isWishlisted ? 'fill-current' : ''} /> {isWishlisted ? 'Saved to Vault' : 'Save for Later'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Editorial Guarantees Section (Letoile Inspired) Moved Here ── */}
                <div className="pt-4 lg:pt-6">
                    <div className="border-t border-gray-200/80 pt-6 lg:pt-8">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                            {/* Item 1 */}
                            <div className="flex flex-col items-start px-2 group">
                                <div className="mb-3 text-[var(--cl-purple)] transform transition-transform duration-500 group-hover:-translate-y-1">
                                    <Truck size={24} strokeWidth={1.5} />
                                </div>
                                <h4 className="text-[11px] font-bold tracking-[0.1em] uppercase text-black font-black mb-1.5">Priority Delivery</h4>
                                <p className="text-[12px] text-black font-semibold leading-relaxed">Complimentary on orders over 200 AED. Ships within 2-3 days.</p>
                            </div>
                            
                            {/* Item 2 */}
                            <div className="flex flex-col items-start px-2 group">
                                <div className="mb-3 text-[var(--cl-purple)] transform transition-transform duration-500 group-hover:-translate-y-1">
                                    <ShieldCheck size={24} strokeWidth={1.5} />
                                </div>
                                <h4 className="text-[11px] font-bold tracking-[0.1em] uppercase text-black font-black mb-1.5">100% Authentic</h4>
                                <p className="text-[12px] text-black font-semibold leading-relaxed">Original masterpieces sourced directly from official ateliers.</p>
                            </div>
                            
                            {/* Item 3 */}
                            <div className="flex flex-col items-start px-2 group">
                                <div className="mb-3 text-[var(--cl-purple)] transform transition-transform duration-500 group-hover:-translate-y-1">
                                    <RotateCcw size={24} strokeWidth={1.5} />
                                </div>
                                <h4 className="text-[11px] font-bold tracking-[0.1em] uppercase text-black font-black mb-1.5">Elite Returns</h4>
                                <p className="text-[12px] text-black font-semibold leading-relaxed">30-day boutique return standard on all sealed selections.</p>
                            </div>
                            
                            {/* Item 4 */}
                            <div className="flex flex-col items-start px-2 group">
                                <div className="mb-3 text-[var(--cl-purple)] transform transition-transform duration-500 group-hover:-translate-y-1">
                                    <Lock size={24} strokeWidth={1.5} />
                                </div>
                                <h4 className="text-[11px] font-bold tracking-[0.1em] uppercase text-black font-black mb-1.5">Secure Payment</h4>
                                <p className="text-[12px] text-black font-semibold leading-relaxed">
                                    Encrypted checkout. Cash on delivery to <span className="font-semibold text-black font-black capitalize">{primaryAddress ? primaryAddress.city : 'your location'}</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
          </div>
        </div>

        {/* ── Product Details: Description, Benefits, Formulation & Brand ── */}
        {(product.long_description || product.description || product.benefits || product.ingredients || product.brand) && (
          <section className="border-t border-gray-100 px-6 lg:px-16 py-16 lg:py-20">
            <div className="max-w-[1200px] mx-auto space-y-14">

              {/* Row 1: Product description — full width */}
              {(product.long_description || product.description) && (
                <div>
                  <h2 className="text-[20px] font-semibold text-black mb-4">Product description</h2>
                  <p className="text-[13px] text-black/60 leading-[1.55]">{product.long_description || product.description}</p>
                </div>
              )}

              {/* Row 2: Benefits | Formulation + Brand — side by side */}
              {(product.benefits || product.ingredients || ingredients.length > 0 || product.brand) && (
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 pt-4 border-t border-gray-100 items-start">

                  {/* Left: Benefits */}
                  {product.benefits && (
                    <div>
                      <h2 className="text-[20px] font-semibold text-black mb-2">Benefits</h2>
                      <div>
                        {product.benefits.split('\n').filter(Boolean).map((b, i) => (
                          <div key={i} className="flex items-start gap-4 py-1.5 border-b border-gray-100">
                            <span className="text-[11px] font-medium tabular-nums mt-0.5 min-w-[22px] flex-shrink-0" style={{ color: 'var(--cl-purple)' }}>{String(i + 1).padStart(2, '0')}</span>
                            <p className="text-[13px] text-black/60 leading-[1.5]">{b.replace(/^[-•]\s*/, '')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Right: Formulation + Brand stacked */}
                  <div className="space-y-10">
                    {(product.ingredients || ingredients.length > 0) && (
                      <div>
                        <h2 className="text-[20px] font-semibold text-black mb-4">Formulation</h2>
                        {product.ingredients ? (
                          <p className="text-[13px] text-black/60 leading-[1.55]">{product.ingredients}</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {ingredients.map((ing, i) => (
                              <span key={i} className="px-3 py-1.5 rounded-full border text-[12px] font-medium text-black/60" style={{ borderColor: 'rgba(216,180,254,0.35)', background: 'rgba(248,240,255,0.5)' }}>
                                {ing}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {product.brand && (
                      <div className="pt-8 border-t border-gray-100">
                        <h2 className="text-[20px] font-semibold text-black mb-4">Brand information</h2>
                        <div className="flex items-start gap-5 mb-4">
                          <div className="w-[84px] h-[84px] rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                            {product.brandImageUrl ? (
                              <Image src={product.brandImageUrl} alt={product.brand} width={84} height={84} className="object-contain p-2.5 w-full h-full" />
                            ) : (
                              <span className="text-3xl font-serif font-bold text-black/15 select-none">{product.brand.charAt(0)}</span>
                            )}
                          </div>
                          <div className="pt-2">
                            <p className="text-[11px] text-black/35 mb-1.5 font-medium">All products of the brand</p>
                            <Link
                              href={`/all-products?brand=${encodeURIComponent(product.brand)}`}
                              className="text-[13px] font-semibold text-black underline underline-offset-2 decoration-black/15 hover:decoration-[var(--cl-purple)] hover:text-[var(--cl-purple)] transition-colors"
                            >
                              {product.brand.toUpperCase()}
                            </Link>
                          </div>
                        </div>
                        <p className="text-[13px] text-black/55 leading-[1.55]">Each creation embodies a commitment to purity, efficacy, and uncompromising beauty standards — formulated for those who demand the very best.</p>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          </section>
        )}

        {/* ── How to Use — cinematic video or product image beside steps ── */}
        {(product.how_to_use || product.how_to_use_video) && (
          <section className="border-t border-gray-100 px-6 lg:px-16 py-16 lg:py-24">
            <div className="max-w-[1200px] mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

                {/* Video or image container */}
                {product.how_to_use_video && (
                  <div className="relative rounded-[2rem] overflow-hidden group bg-black h-[350px] lg:h-[450px]" style={{ border: '1px solid rgba(216,180,254,0.2)' }}>
                    {/* Cinematic letterbox bars */}
                    <div className="absolute top-0 left-0 right-0 z-20 h-0 bg-black transition-all duration-700 ease-in-out group-hover:h-6 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 z-20 h-0 bg-black transition-all duration-700 ease-in-out group-hover:h-6 pointer-events-none" />

                    <video
                      src={product.how_to_use_video}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover block transition-transform duration-[3s] ease-in-out group-hover:scale-[1.03]"
                    />

                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15 pointer-events-none z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10 pointer-events-none z-10" />

                    {/* Caption */}
                    <div className="absolute bottom-6 left-6 z-30 transition-all duration-500 group-hover:bottom-10">
                      <p className="text-[9px] font-semibold text-white/50 uppercase tracking-[0.2em] mb-1">How to use</p>
                      <h4 className="text-sm font-medium text-white/90 leading-snug">{product.name}</h4>
                    </div>

                    {/* Subtle corner accent */}
                    <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--cl-purple)' }} />
                    </div>
                  </div>
                )}

                {/* Steps */}
                {product.how_to_use && (
                  <div>
                    <h2 className="text-[20px] font-semibold text-black mb-4">How to use</h2>
                    <div>
                      {product.how_to_use.split('\n').filter(Boolean).map((step, i) => (
                        <div key={i} className="flex items-start gap-5 py-2.5 border-b border-gray-100">
                          <span className="text-[11px] font-medium tabular-nums mt-0.5 min-w-[22px]" style={{ color: 'var(--cl-purple)' }}>{String(i + 1).padStart(2, '0')}</span>
                          <p className="text-[13px] text-black/60 leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </section>
        )}



        <section className="pt-10 pb-12 px-6 lg:px-20 text-left bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row items-start justify-between gap-6 border-b border-gray-100 pb-8 text-left">
                    <div className="space-y-2 text-left">
                        <Badge className="border-none font-bold text-[9px] tracking-widest px-3 py-1 text-white lavender-glow" style={{ background: 'linear-gradient(135deg, rgb(216,180,254), rgb(167,139,250))' }}>Synergy</Badge>
                        <h2 className="text-3xl lg:text-5xl font-semibold tracking-tight text-black font-black leading-none text-left">Complete the Routine.</h2>
                    </div>
                    <Link href="/all-products" className="hover:underline flex items-center gap-1 text-base font-bold group text-left" style={{ color: 'rgb(126,105,230)' }}>
                        Explore Collections <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
                
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-4">
                    {recommendations.map((rec) => (
                      <CarouselItem key={rec.id} className="pl-4 basis-full md:basis-1/3 lg:basis-1/4">
                        <div className="h-full p-1">
                          <ProductCard {...rec} image={rec.imageUrl} />
                        </div>
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

      </div>

      <div id="reviews" className="pt-10 pb-16 px-6 lg:px-20 border-t" style={{ background: '#fff', borderColor: 'rgba(0,0,0,0.05)' }}>
          <Reviews productId={product.id} />
      </div>
    </div>
  );
}
