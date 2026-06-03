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
import { MadeInFranceBadge } from './MadeInFranceBadge';

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
      {/* ── Editorial Product Card ── */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex flex-col h-full w-full bg-white"
        style={{ border: '1px solid #e8e8e8' }}
      >
        {/* Image area */}
        <div className="relative aspect-square overflow-hidden bg-white">
          <Link href={productUrl} className="block w-full h-full relative z-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={displayImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative w-full h-full"
              >
                {imgError ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <Sparkles size={32} style={{ color: 'rgba(147,51,234,0.2)' }} strokeWidth={1} />
                  </div>
                ) : (
                  <Image
                    src={displayImage}
                    alt={seoAlt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]"
                    onError={() => setImgError(true)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </Link>

          {/* Discount badge — top left, red square */}
          {discount > 0 && (
            <span
              className="absolute top-0 left-0 z-10 text-[11px] font-bold text-white px-2.5 py-1.5 leading-none"
              style={{ background: '#e63939' }}
            >
              -{discount}%
            </span>
          )}

          {/* New Arrival badge — top left if no discount */}
          {isNew && !discount && (
            <span
              className="absolute top-0 left-0 z-10 text-[11px] font-bold text-white px-2.5 py-1.5 leading-none"
              style={{ background: '#7c3aed' }}
            >
              New
            </span>
          )}

          {/* Low stock badge — top left, amber */}
          {isLowStock && !discount && !isNew && (
            <span
              className="absolute top-0 left-0 z-10 text-[11px] font-bold text-white px-2.5 py-1.5 leading-none"
              style={{ background: '#b45309' }}
            >
              {stock_quantity} left
            </span>
          )}

          {/* Top-right: quick action icons — visible on hover */}
          <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleWishlistToggle}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-150 hover:scale-110 active:scale-95"
              style={{ border: '1px solid #e8e8e8' }}
              aria-label="Add to wishlist"
            >
              <Heart
                size={13}
                strokeWidth={isWishlisted ? 0 : 1.75}
                style={{ color: isWishlisted ? '#e63939' : '#555' }}
                className={isWishlisted ? 'fill-[#e63939]' : ''}
              />
            </button>
            <button
              onClick={toggleQuickView}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-150 hover:scale-110 active:scale-95"
              style={{ border: '1px solid #e8e8e8' }}
              aria-label="Quick view"
            >
              <Eye size={13} strokeWidth={1.75} style={{ color: '#555' }} />
            </button>
            <button
              onClick={handleAIGenerate}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-150 hover:scale-110 active:scale-95"
              style={{ border: '1px solid #e8e8e8' }}
              aria-label="AI Insights"
            >
              <Wand2 size={13} strokeWidth={1.75} style={{ color: '#555' }} />
            </button>
          </div>

          {/* ADD TO CART — slides up from bottom of image on hover */}
          <div
            className="absolute bottom-0 left-0 right-0 z-10 flex justify-center pb-3 transition-all duration-300 ease-out"
            style={{
              transform: isHovered ? 'translateY(0)' : 'translateY(110%)',
              opacity: isHovered ? 1 : 0,
            }}
          >
            {stock_quantity > 0 ? (
              <button
                onClick={handleAddToCart}
                className="px-6 py-2.5 text-[10px] font-black text-white uppercase tracking-widest flex items-center justify-center gap-2 rounded-full shadow-lg transition-all duration-150 active:scale-95"
                style={{
                  background: addedToCart ? '#7c3aed' : '#9333ea',
                  minWidth: '160px',
                }}
              >
                {addedToCart ? (
                  <>
                    <BadgeCheck size={13} className="fill-white text-white" />
                    Added
                  </>
                ) : (
                  <>
                    Add to Cart
                  </>
                )}
              </button>
            ) : (
              <button
                className="px-6 py-2.5 text-[10px] font-black text-white uppercase tracking-widest rounded-full"
                style={{ background: '#aaa', minWidth: '160px' }}
              >
                Notify Me
              </button>
            )}
          </div>
        </div>

        {/* Info section */}
        <div className="flex flex-col px-3 pt-3 pb-4 gap-1.5">
          {/* Brand */}
          {brandName && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">
              {brandName}
            </span>
          )}
          {brandName && /gern[eé]t/i.test(brandName) && (
            <MadeInFranceBadge variant="light" />
          )}

          {/* Name */}
          <Link href={productUrl} className="block hover:text-gray-600 transition-colors duration-150">
            <span className="text-[12px] font-semibold uppercase tracking-[0.08em] leading-[1.4] text-gray-900 line-clamp-2 font-sans">
              {name}
            </span>
          </Link>

          {/* Homemade tag — Crystal Bar only */}
          {name && /crystal\s*bar/i.test(name) && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 9px',
                borderRadius: '100px',
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                fontSize: '9px',
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

          {/* Price row */}
          <div className="flex items-center gap-2 mt-0.5">
            {showComparePrice && (
              <span className="text-[12px] text-gray-400 line-through font-normal">
                AED {originalPrice}
              </span>
            )}
            <span
              className="text-[13px] font-semibold"
              style={{ color: showComparePrice ? '#7c3aed' : '#1a1a1a' }}
            >
              AED {price}
            </span>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className={i < Math.floor(averageRating || 4) ? 'fill-[#e0a800] text-[#e0a800]' : 'fill-gray-200 text-gray-200'}
                />
              ))}
            </div>
            {reviewCount > 0 && (
              <span className="text-[10px] text-gray-400">({reviewCount})</span>
            )}
          </div>
        </div>
      </div>

      {/* ── AI Insights Modal ── */}
      <Modal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} title="" size="max-w-2xl" noBodyPadding>
        <div className="relative overflow-hidden min-h-[500px] flex flex-col" style={{ background: '#ffffff' }}>
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
                      style={{ backgroundImage: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
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
            style={{ background: '#ffffff' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative w-full h-full p-6"
            >
              <Image src={image || '/placeholder-image.jpg'} alt={seoAlt} fill className="object-contain" />
            </motion.div>
            <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
              {isNew && <Badge className="text-white px-3 py-1 text-[9px] font-bold border-none rounded-full" style={{ background: 'var(--brand-gradient)' }}>New</Badge>}
              {isBestseller && <Badge className="text-white px-3 py-1 text-[9px] font-bold border-none rounded-full" style={{ background: 'var(--brand-gradient)' }}>Bestseller</Badge>}
            </div>
          </div>

          {/* Right: info */}
          <div className="p-10 md:p-14 flex flex-col justify-center" style={{ background: '#ffffff' }}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <p
                  className="text-[9px] font-bold flex items-center gap-3"
                  style={{ color: 'var(--cl-text-soft)' }}
                >
                  <span className="w-8 h-px" style={{ background: 'linear-gradient(90deg, rgb(196,167,254), rgb(216,180,254))' }} />
                  {brandName || 'Naya Lumière Cosmetics'}
                </p>
                {brandName && /gern[eé]t/i.test(brandName) && (
                  <MadeInFranceBadge variant="light" />
                )}
              </div>
              <h2 className="font-serif text-4xl font-light italic leading-[1.1] mb-6" style={{ color: 'var(--cl-text-deep)' }}>{name}</h2>

              <div className="flex items-baseline gap-4 mb-8 pb-8" style={{ borderBottom: '1px solid var(--cl-glass-border)' }}>
                <span
                  className="text-3xl font-bold"
                  style={{ backgroundImage: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                >AED {price}</span>                {showComparePrice && <span className="text-lg line-through" style={{ color: 'var(--cl-text-muted)' }}>AED {originalPrice}</span>}
                {discount > 0 && (
                  <span className="text-[10px] font-bold text-white px-3 py-1 rounded-full" style={{ background: 'var(--brand-gradient)' }}>
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
