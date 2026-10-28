import React, { useState, useContext, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CartContext } from '../context/CartContext';
import { Heart, ShoppingBag, Star, Plus, Check, Minus, Truck, ShieldCheck, ArrowRight, X, Sparkles, Wand2, Loader2, Eye, Share2, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Modal from './Modal';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';
import { MadeInFranceBadge, FranceFlag } from './MadeInFranceBadge';
import { MadeInUAEBadge, UAEFlag } from './MadeInUAEBadge';
import { getDeliveryInfo, getPreorderInfo, FREE_SHIPPING_FROM } from '../../lib/shipping';
import { isPreorderOnly, leadDays } from '../../lib/backorderRules';
import { formatAED, viewCountLabel } from '../lib/utils';
import { shortBrand } from '@/lib/seo';
import { cardName } from './home/HomeProductCard';
import { useSignIn } from '@/app/context/SignInContext';

// Cloud Luxe accent for card badges (rank, best seller, saving)
const LAVENDER = 'rgb(147,104,236)';

// Live, UAE-cutoff-accurate delivery estimate — the exact same calculation the
// product detail page uses (lib/shipping.getDeliveryInfo), so the two never disagree.
function useDeliveryEstimate() {
  const [info, setInfo] = useState(() => getDeliveryInfo());
  useEffect(() => {
    const id = setInterval(() => setInfo(getDeliveryInfo()), 60_000);
    return () => clearInterval(id);
  }, []);
  return info;
}

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

const ProductCard = ({ id, slug, name, price, originalPrice, image, imageUrls = [], altText, averageRating, reviewCount, viewCount, isNew, isBestseller, rank, category, brandName, stock_quantity, backorderable = 0, backorder_lead_days, description, size, variant = 'light', concerns = [], initialWishlisted = false, onWishlistChange }) => {
  const { openSignIn } = useSignIn();
  const { addToCart } = useContext(CartContext);
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
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
  const delivery = useDeliveryEstimate();

  const showComparePrice = originalPrice && originalPrice > price;
  const productUrl = `/product/${slug || id}`;
  const seoAlt = altText || `${name} - ${brandName || 'Luxury Beauty'} | nayalc.com`;
  const isLowStock = stock_quantity > 0 && stock_quantity < 5;
  // Sold out, but it takes pre-orders (lib/backorderRules.js)
  const preorderOnly = isPreorderOnly({ stock_quantity, backorderable });
  const canBuy = stock_quantity > 0 || preorderOnly;
  const preorderShipBy = preorderOnly ? getPreorderInfo(leadDays({ backorder_lead_days })).shipByLabel : '';
  // Stars only for products customers have actually rated — five empty stars read as "rated zero"
  const rating = Number(averageRating) || 0;
  const hasReviews = Number(reviewCount) > 0 && rating > 0;
  const isFrench = !!brandName && /gern[eé]t/i.test(brandName);
  const isEmirati = !!brandName && /naya\s*lumi[eè]?re?\s*perfumes?/i.test(brandName);
  const displayImage = (isHovered && imageUrls.length > 1) ? imageUrls[1] : (image || (imageUrls.length > 0 ? imageUrls[0] : '/placeholder-image.jpg'));
  const secondImage = imageUrls.length > 1 ? imageUrls[1] : null;

  // One tag, top-right: sold out › pre-order › rank › best seller › new (no discount badge — the old price shows it)
  const tag = !canBuy ? { label: 'Sold out', muted: true }
    : preorderOnly ? { label: 'Pre-order' }
    : rank ? { label: `No. ${rank}` }
    : isBestseller ? { label: 'Best seller', soft: true }
    : isNew ? { label: 'New' }
    : null;
  const roundBtn = 'relative after:absolute after:-inset-1 w-8 h-8 shrink-0 rounded-full border-[1.2px] border-[#111114] bg-[#f6f5f2] text-[#111114] flex items-center justify-center transition-colors hover:bg-[#111114] hover:text-white';

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
    if (!isAuthenticated) { openSignIn(); return; }
    try {
      const method = isWishlisted ? 'DELETE' : 'POST';
      const response = await fetch('/api/wishlist', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId: id })
      });
      if (response.ok) {
        setIsWishlisted(!isWishlisted);
        onWishlistChange?.(id, !isWishlisted);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const handleAddToCart = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    addToCart({ id, slug, name, price, originalPrice, imageUrl: image, categoryName: category, brand: brandName, stock_quantity, backorderable, backorder_lead_days, size }, quantity);
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
      {/* ── Product panel (same design as the homepage's HomeProductCard) ── */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex flex-col h-full w-full min-w-0"
      >
        <div className="relative aspect-[2/3] md:aspect-[3/4] bg-[#f6f5f2] flex flex-col p-3 md:p-[18px]">
          {/* The whole panel opens the product; the buttons sit above this link */}
          <Link href={productUrl} aria-label={name} className="absolute inset-0 z-0" />

          <p className="relative pr-14 text-[13.5px] md:text-[15px] font-semibold leading-[1.25] text-[#111114] line-clamp-2 pointer-events-none">
            {cardName(name)}
          </p>
          {brandName && (
            <p className="relative mt-[3px] flex items-center gap-1.5 text-[11.5px] md:text-[12px] text-[#6b6b73] min-w-0 pointer-events-none">
              <span className="truncate">{shortBrand(brandName)}</span>
              {isFrench && <FranceFlag title="Made in France" />}
              {isEmirati && <UAEFlag title="Made in the UAE" />}
            </p>
          )}
          {/* The Crystal Bar is made by hand */}
          {name && /crystal\s*bar/i.test(name) && (
            <p className="relative mt-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] pointer-events-none" style={{ color: LAVENDER }}>
              Homemade
            </p>
          )}
          {tag && (
            <span
              className={`absolute z-10 top-3 right-3 md:top-4 md:right-4 rounded-full px-2 py-[3px] text-[10.5px] font-semibold ${tag.muted ? 'bg-gray-500 text-white' : tag.soft ? 'text-[#5b3fc4]' : 'text-white'}`}
              style={tag.muted ? undefined : { background: tag.soft ? 'rgba(147,104,236,0.14)' : LAVENDER }}
            >
              {tag.label}
            </span>
          )}

          <div className="relative flex-1 min-h-0 -mx-1 md:-mx-2 mt-2 mb-2 pointer-events-none">
            {imgError ? (
              <div className="w-full h-full flex items-center justify-center">
                <Sparkles size={30} className="text-gray-300" strokeWidth={1} />
              </div>
            ) : (
              <Image
                key={displayImage}
                src={displayImage}
                alt={seoAlt}
                fill
                sizes="(max-width: 768px) 45vw, (max-width: 1280px) 25vw, 300px"
                className={`object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.04] ${canBuy ? '' : 'opacity-55'}`}
                onError={() => setImgError(true)}
              />
            )}
          </div>

          <div className="relative z-10 flex items-end justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {canBuy && (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  aria-label={preorderOnly ? `Pre-order ${name}` : `Add ${name} to bag`}
                  className={`${roundBtn} group-hover:bg-[#111114] group-hover:text-white`}
                >
                  {addedToCart ? <Check size={15} strokeWidth={2} /> : <ShoppingBag size={14} strokeWidth={1.75} />}
                </button>
              )}
              <button
                type="button"
                onClick={handleWishlistToggle}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={isWishlisted}
                className={roundBtn}
              >
                <Heart size={14} strokeWidth={isWishlisted ? 0 : 1.75} className={isWishlisted ? 'fill-[#e63939]' : ''} />
              </button>
              {/* Desktop extras on hover */}
              <button type="button" onClick={toggleQuickView} aria-label="Quick view" className={`${roundBtn} hidden md:flex opacity-0 group-hover:opacity-100 focus-visible:opacity-100`}>
                <Eye size={14} strokeWidth={1.75} />
              </button>
              <button type="button" onClick={handleAIGenerate} aria-label="AI insights" className={`${roundBtn} hidden md:flex opacity-0 group-hover:opacity-100 focus-visible:opacity-100`}>
                <Wand2 size={14} strokeWidth={1.75} />
              </button>
            </div>
            <p className="text-right text-[14px] font-semibold text-[#111114] leading-tight pointer-events-none">
              {formatAED(price)}
              {showComparePrice && <span className="block text-[11.5px] font-normal text-[#6b6b73] line-through">{formatAED(originalPrice)}</span>}
            </p>
          </div>
        </div>

        {/* Live facts, the same as the homepage cards */}
        <div className="pt-2.5 px-0.5 grid gap-0.5 text-[12px] text-[#6b6b73]">
          {hasReviews && (
            <span className="flex items-center gap-1">
              <Star size={12} className="fill-[#f5b301] text-[#f5b301]" />
              {rating.toFixed(1)} <span className="opacity-70">({reviewCount})</span>
            </span>
          )}
          {viewCount >= 5 && <span className="font-medium text-[#15803d]">{viewCountLabel(viewCount)} viewed this month</span>}
          {stock_quantity > 0 ? (
            <span>Arrives <b className="font-semibold text-[#111114]">{delivery.rangeLabel}</b></span>
          ) : preorderOnly ? (
            <span>Ships by <b className="font-semibold text-[#111114]">{preorderShipBy}</b></span>
          ) : (
            <span className="font-semibold text-gray-500">Out of stock</span>
          )}
          {isLowStock && <span className="font-semibold text-[#b45309]">Only {stock_quantity} left</span>}
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
                {brandName && /naya\s*lumi[eè]?re?\s*perfumes?/i.test(brandName) && (
                  <MadeInUAEBadge variant="light" />
                )}
              </div>
              <h2 className="font-serif text-4xl font-light italic leading-[1.1] mb-6" style={{ color: 'var(--cl-text-deep)' }}>{name}</h2>

              <div className="flex items-baseline gap-4 mb-8 pb-8" style={{ borderBottom: '1px solid var(--cl-glass-border)' }}>
                <span
                  className="text-3xl font-bold"
                  style={{ backgroundImage: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                >{formatAED(price)}</span>
                {showComparePrice && <span className="text-lg line-through" style={{ color: 'var(--cl-text-muted)' }}>{formatAED(originalPrice)}</span>}
              </div>

              <p className="text-sm leading-[1.8] italic mb-8" style={{ color: 'var(--cl-text-light)' }}>
                "{description || 'Experience the essence of transformative luxury beauty, formulated for radiance.'}"
              </p>

              <div className="flex gap-8 mb-8">
                <div className="flex items-center gap-2.5 text-[9px] font-semibold" style={{ color: 'var(--cl-text-muted)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--cl-glass)', border: '1px solid var(--cl-glass-border)' }}>
                    <Truck size={14} style={{ color: 'var(--cl-purple)' }} />
                  </div>
                  Free shipping on {FREE_SHIPPING_FROM}+ items
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
                  disabled={!canBuy}
                  className="cl-gradient-btn flex-1 h-14 text-[11px] font-semibold"
                >
                  {addedToCart ? (
                    <span className="flex items-center justify-center gap-2"><Check size={16} /> Added</span>
                  ) : (
                    `${preorderOnly ? 'Pre-order' : 'Add to Cart'} — ${formatAED(Math.round(price * quantity * 100) / 100)}`
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
