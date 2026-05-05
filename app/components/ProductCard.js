import React, { useState, useContext, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CartContext } from '../context/CartContext';
import { Heart, ShoppingBag, Star, Plus, Check, Minus, Truck, ShieldCheck, ArrowRight, X, Sparkles, Wand2, Loader2, Eye, BadgeCheck, Share2, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Modal from './Modal';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const TypewriterText = ({ text, speed = 10 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [index, text, speed]);

  return <div className="whitespace-pre-wrap">{displayedText}</div>;
};

const ProductCard = ({ id, slug, name, price, originalPrice, image, imageUrls = [], altText, averageRating, reviewCount, isNew, isBestseller, category, brandName, stock_quantity, description, size, variant = 'light', concerns = [] }) => {
  const { addToCart } = useContext(CartContext);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const showComparePrice = originalPrice && originalPrice > price;
  const discount = showComparePrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const productUrl = `/product/${slug || id}`;
  const seoAlt = altText || `${name} - ${brandName || 'Luxury Beauty'} | nayalc.com`;
  const isLowStock = stock_quantity > 0 && stock_quantity < 5;
  const displayImage = (isHovered && imageUrls.length > 1) ? imageUrls[1] : (image || (imageUrls.length > 0 ? imageUrls[0] : '/placeholder-image.jpg'));
  const secondImage = imageUrls.length > 1 ? imageUrls[1] : null;

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: name,
        text: `Check out this luxury beauty product: ${name}`,
        url: window.location.origin + productUrl,
      });
    }
  };

  const handleAIGenerate = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAIModalOpen(true);
    if (aiResult) return;
    try {
      setIsGeneratingAI(true);
      const response = await fetch('/api/ai/product-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: name, brandName: brandName || 'Naya Lumière', description, price, category })
      });
      if (response.ok) {
        const data = await response.json();
        setAiResult(data.response);
      } else {
        setAiResult("Our AI specialist is currently unavailable. Please try again later.");
      }
    } catch {
      setAiResult("An error occurred while curating your product insights.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { router.push('/auth'); return; }
    try {
      const method = isWishlisted ? 'DELETE' : 'POST';
      const response = await fetch('/api/wishlist', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId: id })
      });
      if (response.ok) setIsWishlisted(!isWishlisted);
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const handleAddToCart = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    addToCart({ id, name, price, imageUrl: image, categoryName: category, brand: brandName, stock_quantity, size }, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const toggleQuickView = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setQuantity(1);
    setIsQuickViewOpen(!isQuickViewOpen);
  };

  return (
    <>
      {/* ── Glass Product Card ── */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex flex-col h-full w-full transition-all duration-500 overflow-hidden"
        style={{
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(216,180,254,0.6)',
          boxShadow: '0 10px 30px rgba(167,139,250,0.05)',
        }}
      >
        {/* Image area */}
        <div className="relative aspect-square overflow-hidden rounded-t-[24px]">
          <Link href={productUrl} className="block w-full h-full relative z-0">
            <motion.div className="w-full h-full p-0.5 relative" whileTap={{ scale: 0.98 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={displayImage}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className="relative w-full h-full"
                >
                  {imgError ? (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, rgba(216,180,254,0.18), rgba(249,168,212,0.12))' }}
                    >
                      <Sparkles size={32} style={{ color: 'rgba(147,51,234,0.25)' }} strokeWidth={1} />
                    </div>
                  ) : (
                    <Image
                      src={displayImage}
                      alt={seoAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                      className="object-contain"
                      onError={() => setImgError(true)}
                    />
                  )}
                  {/* Subtle Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </Link>

          {/* Top-left badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
            {discount > 0 && (
              <span
                className="text-[9px] font-bold text-white px-2.5 py-1 rounded-full shadow-sm"
                style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)' }}
              >
                -{discount}%
              </span>
            )}
            {isNew && (
              <span className="text-[9px] font-bold text-white px-2.5 py-1 rounded-full bg-violet-500/90 backdrop-blur-sm shadow-sm">
                New Arrival
              </span>
            )}
            {isLowStock && (
              <motion.span 
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-[9px] font-bold text-rose-600 px-2.5 py-1 rounded-full bg-rose-50/90 border border-rose-100 backdrop-blur-sm flex items-center gap-1"
              >
                <Flame size={10} className="fill-current" />
                Only {stock_quantity} Left
              </motion.span>
            )}
          </div>

          {/* Top-right: wishlist + AI wand */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-100 translate-x-0 md:opacity-0 md:group-hover:opacity-100 md:translate-x-4 md:group-hover:translate-x-0 transition-all duration-300">
            <button
              onClick={handleWishlistToggle}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-md"
              style={{
                background: isWishlisted ? 'linear-gradient(135deg, #FF7EB3, #FF758C)' : 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(255,255,255,0.4)',
                backdropFilter: 'blur(8px)',
              }}
              aria-label="Add to wishlist"
            >
              <Heart
                size={14}
                strokeWidth={isWishlisted ? 0 : 1.75}
                style={{ color: isWishlisted ? 'white' : '#6366f1' }}
                className={isWishlisted ? 'fill-white' : ''}
              />
            </button>
            <button
              onClick={handleAIGenerate}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 relative group/ai shadow-md"
              style={{ background: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)' }}
              aria-label="AI Insights"
            >
              <Wand2 size={14} strokeWidth={1.75} className="text-indigo-600" />
            </button>
            <button
              onClick={toggleQuickView}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-md"
              style={{ background: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)' }}
              aria-label="Quick view"
            >
              <Eye size={14} strokeWidth={1.75} className="text-indigo-600" />
            </button>
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-md md:flex hidden"
              style={{ background: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)' }}
              aria-label="Share product"
            >
              <Share2 size={14} strokeWidth={1.75} className="text-indigo-600" />
            </button>
          </div>
        </div>

        {/* Info section */}
        <div className="flex flex-col flex-1 px-4 pt-3 pb-4 gap-2.5">
          {/* Brand */}
          <div className="flex items-center justify-between">
            <span
              className="text-[13px] md:text-[14px] font-semibold tracking-tight"
              style={{ color: 'var(--cl-purple)', opacity: 0.95 }}
            >
              {brandName || 'Naya Lumière'}
            </span>
            {concerns.length > 0 && (
              <div className="flex gap-1">
                {concerns.slice(0, 1).map((concern, idx) => (
                  <span key={idx} className="text-[8px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">
                    {concern}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Name */}
          <Link href={productUrl} className="block transition-colors duration-200" style={{ color: 'var(--cl-text-deep)' }}>
            <span className="font-serif text-lg italic leading-snug">
              {name}
            </span>
          </Link>

          {/* Stars */}
          {reviewCount > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={9} className={i < Math.floor(averageRating || 5) ? 'fill-indigo-400 text-indigo-400' : 'text-gray-200'} />
                  ))}
                </div>
                <p className="text-[10px] font-medium opacity-50">{reviewCount}</p>
              </div>
              {size && <span className="text-[10px] text-gray-400 font-medium italic">{size}</span>}
            </div>
          )}
          {(!reviewCount || reviewCount === 0) && size && (
             <div className="flex items-center justify-end">
               <span className="text-[10px] text-gray-400 font-medium italic">{size}</span>
             </div>
          )}

          {/* Price row */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-purple-100/30">
            {/* Price Block */}
            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] font-bold" style={{ color: 'var(--cl-purple)', opacity: 0.5 }}>AED</span>
                <span className="text-[24px] font-bold tracking-tight" style={{
                  backgroundImage: 'linear-gradient(135deg, #7E57C2, #B39DDB)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {Math.floor(price)}
                </span>
                {Number(price) % 1 !== 0 && (
                  <span className="text-[14px] font-bold opacity-60" style={{ color: '#7E57C2' }}>
                    .{ (Number(price) % 1).toFixed(2).split('.')[1] }
                  </span>
                )}
              </div>

              {/* Original Price */}
              {showComparePrice && (
                <span className="text-[11px] line-through text-gray-300 font-medium translate-y-[2px]">
                  AED {originalPrice}
                </span>
              )}
            </div>

            {/* Discount Badge */}
            {discount > 0 && (
              <span className="text-[10px] font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(216,180,254,0.15)', color: 'rgb(126,105,230)' }}>
                −{discount}%
              </span>
            )}
          </div>

          {/* Add to cart */}
          {stock_quantity > 0 ? (
            <motion.button
              onClick={handleAddToCart}
              whileTap={{ scale: 0.97 }}
              className={`w-full mt-2 h-11 text-[11px] font-bold flex items-center justify-center gap-2 rounded-xl transition-all duration-500 ${
                addedToCart
                  ? 'bg-green-50 text-green-600 border border-green-100 cursor-default shadow-sm'
                  : 'cl-gradient-btn'
              }`}
            >
              {addedToCart ? (
                <>
                  <BadgeCheck size={14} className="fill-green-600 text-white" />
                  <span>Added to Bag</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={13} strokeWidth={2} />
                  <span>Add to Bag</span>
                </>
              )}
            </motion.button>
          ) : (
            <div className="w-full mt-2 h-11 flex items-center justify-center text-[11px] font-bold text-gray-400 rounded-xl border border-gray-100 bg-gray-50/50">
              Notify Me
            </div>
          )}
        </div>
      </div>

      {/* ── AI Insights Modal ── */}
      <Modal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} title="" size="max-w-2xl" noBodyPadding>
        <div className="relative overflow-hidden min-h-[500px] flex flex-col" style={{ background: 'var(--cl-bg)' }}>
          {/* Aura bg */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="cl-aura cl-aura-purple" style={{ width: 300, height: 300, top: '-10%', left: '-10%', opacity: 0.5 }} />
            <div className="cl-aura cl-aura-rose" style={{ width: 250, height: 250, bottom: '-10%', right: '-10%', opacity: 0.4 }} />
          </div>

          {/* Header */}
          <div className="relative z-10 px-8 pt-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--cl-glass)', border: '1px solid var(--cl-glass-border)' }}
              >
                <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                  <Sparkles size={22} style={{ color: 'var(--cl-purple)' }} strokeWidth={1.5} />
                </motion.div>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold" style={{ color: 'var(--cl-text-deep)' }}>AI Insights</h3>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-medium" style={{ color: 'var(--cl-text-muted)' }}>AI Concierge · Powered by Gemini</p>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: 'var(--cl-purple)' }} />
                    <div className="w-1 h-1 rounded-full animate-pulse [animation-delay:0.2s]" style={{ background: 'var(--cl-pink)' }} />
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsAIModalOpen(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'var(--cl-glass)', border: '1px solid var(--cl-glass-border)' }}
            >
              <X size={18} style={{ color: 'var(--cl-text-light)' }} />
            </button>
          </div>

          <div className="relative z-10 flex-grow px-8 py-8">
            {isGeneratingAI ? (
              <div className="flex flex-col items-center justify-center py-20 gap-8">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360, opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 rounded-full"
                    style={{ border: '1px solid', borderColor: 'var(--cl-purple)', borderTopColor: 'transparent' }}
                  />
                  <motion.div
                    animate={{ rotate: -360, opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-4 rounded-full"
                    style={{ border: '1px solid', borderColor: 'var(--cl-pink)', borderBottomColor: 'transparent' }}
                  />
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-14 h-14 rounded-full"
                    style={{ background: 'var(--cl-gradient)', filter: 'blur(8px)' }}
                  />
                  <Sparkles size={22} className="absolute text-white" />
                </div>
                <p className="text-lg font-semibold" style={{ color: 'var(--cl-text-deep)' }}>Curating your insights…</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full">
                {/* Product micro-header */}
                <div
                  className="flex items-center gap-4 mb-6 p-4 rounded-2xl"
                  style={{ background: 'var(--cl-glass)', border: '1px solid var(--cl-glass-border)' }}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden relative bg-white/60 p-1.5">
                    <Image src={image} alt={name} fill className="object-contain" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-semibold leading-tight" style={{ color: 'var(--cl-text-deep)' }}>{name}</h4>
                    <p
                      className="text-[11px] font-medium mt-0.5"
                      style={{ backgroundImage: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                    >{brandName || 'Naya Lumière Cosmetics'}</p>
                  </div>
                </div>

                {/* Content */}
                <div
                  className="rounded-2xl p-6 flex-grow"
                  style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid var(--cl-glass-border)' }}
                >
                  <div className="font-sans text-[14px] leading-[1.8]" style={{ color: 'var(--cl-text-light)' }}>
                    <TypewriterText text={aiResult} speed={15} />
                  </div>
                </div>

                <div className="mt-6 flex flex-col items-center gap-4 pb-2">
                  <button
                    onClick={() => setIsAIModalOpen(false)}
                    className="cl-gradient-btn px-12 py-3 text-[11px] font-semibold"
                  >
                    Close Consultation
                  </button>
                  <p className="text-[10px]" style={{ color: 'var(--cl-text-muted)' }}>Powered by Gemini Intelligence</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </Modal>

      {/* ── Quick View Modal ── */}
      <Modal isOpen={isQuickViewOpen} onClose={() => setIsQuickViewOpen(false)} title="" size="max-w-5xl" noBodyPadding>
        <div className="grid md:grid-cols-2 gap-0 relative overflow-hidden">
          {/* Left: image */}
          <div
            className="aspect-square relative flex items-center justify-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, var(--cl-bg-lavender), var(--cl-bg-rose))' }}
          >
            <div className="cl-aura cl-aura-purple pointer-events-none" style={{ width: 300, height: 300, top: '-20%', left: '-20%', opacity: 0.5 }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative w-full h-full p-6"
            >
              <Image src={image || '/placeholder-image.jpg'} alt={seoAlt} fill className="object-contain" />
            </motion.div>
            <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
              {isNew && <Badge className="text-white px-3 py-1 text-[9px] font-bold border-none rounded-full" style={{ background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))' }}>New</Badge>}
              {isBestseller && <Badge className="text-white px-3 py-1 text-[9px] font-bold border-none rounded-full" style={{ background: 'linear-gradient(135deg, rgb(216,180,254), rgb(167,139,250))' }}>Bestseller</Badge>}
            </div>
          </div>

          {/* Right: info */}
          <div className="p-10 md:p-14 flex flex-col justify-center" style={{ background: 'var(--cl-bg)' }}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
              <p
                className="text-[9px] font-bold mb-4 flex items-center gap-3"
                style={{ color: 'var(--cl-text-soft)' }}
              >
                <span className="w-8 h-px" style={{ background: 'linear-gradient(90deg, rgb(196,167,254), rgb(216,180,254))' }} />
                {brandName || 'Naya Lumière Cosmetics'}
              </p>
              <h2 className="font-serif text-4xl font-light italic leading-[1.1] mb-6" style={{ color: 'var(--cl-text-deep)' }}>{name}</h2>

              <div className="flex items-baseline gap-4 mb-8 pb-8" style={{ borderBottom: '1px solid var(--cl-glass-border)' }}>
                <span
                  className="text-3xl font-bold"
                  style={{ backgroundImage: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                >AED {price}</span>                {showComparePrice && <span className="text-lg line-through" style={{ color: 'var(--cl-text-muted)' }}>AED {originalPrice}</span>}
                {discount > 0 && (
                  <span className="text-[10px] font-bold text-white px-3 py-1 rounded-full" style={{ background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))' }}>
                    -{discount}%
                  </span>
                )}
              </div>

              <p className="text-sm leading-[1.8] italic mb-8" style={{ color: 'var(--cl-text-light)' }}>
                "{description || 'Experience the essence of transformative luxury beauty, formulated for radiance.'}"
              </p>

              <div className="flex gap-8 mb-8">
                <div className="flex items-center gap-2.5 text-[9px] font-semibold" style={{ color: 'var(--cl-text-muted)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--cl-glass)', border: '1px solid var(--cl-glass-border)' }}>
                    <Truck size={14} style={{ color: 'var(--cl-purple)' }} />
                  </div>
                  Complimentary Shipping
                </div>
                <div className="flex items-center gap-2.5 text-[9px] font-semibold" style={{ color: 'var(--cl-text-muted)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--cl-glass)', border: '1px solid var(--cl-glass-border)' }}>
                    <ShieldCheck size={14} style={{ color: 'var(--cl-purple)' }} />
                  </div>
                  Authentic Selection
                </div>
              </div>

              <div className="flex items-center gap-4 mb-5">
                <div
                  className="flex items-center rounded-xl p-1"
                  style={{ background: 'var(--cl-glass)', border: '1px solid var(--cl-glass-border)' }}
                >
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-11 h-11 flex items-center justify-center transition-colors" style={{ color: 'var(--cl-text-light)' }}><Minus size={15} /></button>
                  <span className="w-10 text-center text-sm font-bold" style={{ color: 'var(--cl-text-deep)' }}>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-11 h-11 flex items-center justify-center transition-colors" style={{ color: 'var(--cl-text-light)' }}><Plus size={15} /></button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={!stock_quantity || stock_quantity <= 0}
                  className="cl-gradient-btn flex-1 h-14 text-[11px] font-semibold"
                >
                  {addedToCart ? (
                    <span className="flex items-center justify-center gap-2"><Check size={16} /> Added</span>
                  ) : (
                    `Add to Cart — AED ${(price * quantity).toFixed(0)}`
                  )}
                </button>
              </div>

              <Link
                href={productUrl}
                onClick={() => setIsQuickViewOpen(false)}
                className="cl-gradient-btn flex items-center justify-center gap-2 py-3 text-[10px] font-semibold group"
              >
                View Full Details
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProductCard;
