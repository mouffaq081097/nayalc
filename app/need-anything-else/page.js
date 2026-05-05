'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Check, ChevronLeft, ChevronRight,
  Sparkles, RefreshCw, ArrowRight, Star,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import Image from 'next/image';

const ITEMS_PER_PAGE = 6;

/* ─────────────── helpers ─────────────── */

function SectionHeader({ icon, title, subtitle, page, totalPages, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-between mb-7">
      <div className="flex items-center gap-4">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(196,167,254,0.18)', color: 'rgb(126,105,230)' }}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-[22px] font-bold tracking-tight" style={{ color: '#3b0764' }}>{title}</h2>
          <p className="text-[11px] font-medium mt-0.5" style={{ color: 'rgba(59,7,100,0.45)' }}>{subtitle}</p>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold hidden sm:block" style={{ color: 'rgba(107,33,168,0.42)' }}>
            {page + 1} / {totalPages}
          </span>
          <div className="flex gap-1.5">
            {[{ fn: onPrev, disabled: page === 0, icon: <ChevronLeft size={15} /> },
              { fn: onNext, disabled: page === totalPages - 1, icon: <ChevronRight size={15} /> }].map((btn, i) => (
              <button
                key={i}
                onClick={btn.fn}
                disabled={btn.disabled}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-25"
                style={{
                  border: '1px solid rgba(216,180,254,0.5)',
                  color: 'rgb(126,105,230)',
                  background: btn.disabled ? 'transparent' : 'rgba(196,167,254,0.1)',
                }}
              >
                {btn.icon}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, imageUrl, added, onAdd }) {
  const price = parseFloat(product.price || 0);

  return (
    <motion.div
      layout
      className="group flex flex-col rounded-[22px] overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.75)',
        border: '1px solid rgba(216,180,254,0.28)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 2px 16px rgba(147,51,234,0.05)',
      }}
    >
      {/* Image */}
      <div
        className="relative aspect-square overflow-hidden p-4 flex-shrink-0 cursor-pointer"
        style={{ background: 'rgba(248,240,255,0.85)', borderBottom: '1px solid rgba(216,180,254,0.18)' }}
      >
        <ImageWithFallback
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
        />
        {/* Quick-add overlay on hover */}
        <motion.button
          onClick={onAdd}
          whileTap={{ scale: 0.94 }}
          className="absolute inset-x-3 bottom-3 py-2 rounded-xl text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300"
          style={{
            background: added
              ? 'linear-gradient(135deg,rgb(134,239,172),rgb(52,211,153))'
              : 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))',
            boxShadow: '0 4px 14px rgba(147,51,234,0.3)',
          }}
        >
          {added ? <><Check size={11} strokeWidth={3} /> Added</> : <><ShoppingBag size={11} /> Quick add</>}
        </motion.button>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 gap-1.5">
        <p className="text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: 'rgb(126,105,230)' }}>
          {product.brandName || product.brand || 'Naya Lumière'}
        </p>
        <h3 className="text-[13px] font-bold leading-snug line-clamp-2 flex-1" style={{ color: '#3b0764' }}>
          {product.name}
        </h3>
        <p className="text-[14px] font-black tabular-nums" style={{ color: '#3b0764' }}>
          AED {price.toFixed(2)}
        </p>

        {/* Always-visible add button */}
        <motion.button
          onClick={onAdd}
          whileTap={{ scale: 0.96 }}
          className="mt-2 w-full py-2.5 rounded-xl text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors duration-300"
          style={{
            background: added
              ? 'linear-gradient(135deg,rgb(134,239,172),rgb(52,211,153))'
              : 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))',
            boxShadow: added ? '0 4px 14px rgba(52,211,153,0.25)' : '0 4px 14px rgba(147,51,234,0.18)',
          }}
        >
          {added ? <><Check size={11} strokeWidth={3} /> Added!</> : <><ShoppingBag size={11} /> Add to cart</>}
        </motion.button>
      </div>
    </motion.div>
  );
}

function ProductGrid({ products, addedIds, onAdd, isBuyAgain, pageKey }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <AnimatePresence mode="wait">
        {products.map((product, i) => (
          <motion.div
            key={`${pageKey}-${product.id}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: i * 0.045, duration: 0.3 }}
          >
            <ProductCard
              product={product}
              imageUrl={isBuyAgain ? product.imageUrl : product.image}
              added={addedIds.has(product.id)}
              onAdd={() => onAdd(product, isBuyAgain)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────── page ─────────────── */

export default function NeedAnythingElsePage() {
  const router = useRouter();
  const { cartItems, addToCart, subtotal } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { products } = useAppContext();

  const [buyAgainProducts, setBuyAgainProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyAgainPage, setBuyAgainPage] = useState(0);
  const [suggestPage, setSuggestPage] = useState(0);
  const [addedIds, setAddedIds] = useState(new Set());

  // Redirect if cart is empty
  useEffect(() => {
    if (!loading && cartItems.length === 0) router.replace('/cart');
  }, [cartItems, loading, router]);

  // Fetch buy-again
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetch(`/api/users/${user.id}/buy-again`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setBuyAgainProducts(data.filter(p => !cartItems.some(c => c.id === p.id)));
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = (product, isBuyAgain) => {
    const normalized = isBuyAgain
      ? {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          image: product.imageUrl,
          brand: product.brandName || 'Naya Lumière',
          stock_quantity: product.stockQuantity ?? product.stock_quantity ?? 99,
        }
      : { ...product, stock_quantity: product.stock_quantity ?? product.stockQuantity ?? 99 };

    addToCart(normalized, 1);
    setAddedIds(prev => new Set([...prev, product.id]));
    setTimeout(() => setAddedIds(prev => {
      const n = new Set(prev); n.delete(product.id); return n;
    }), 2500);
  };

  // Suggested: products not in cart, not already in buy-again
  const suggestions = (products || [])
    .filter(p =>
      !cartItems.some(c => c.id === p.id) &&
      !buyAgainProducts.some(b => b.id === p.id)
    )
    .slice(0, 30);

  const cartCount   = cartItems.reduce((t, i) => t + i.quantity, 0);
  const hasBuyAgain = buyAgainProducts.length > 0;
  const hasSuggest  = suggestions.length > 0;

  const buyAgainPages = Math.ceil(buyAgainProducts.length / ITEMS_PER_PAGE);
  const suggestPages  = Math.ceil(suggestions.length / ITEMS_PER_PAGE);

  const visibleBuyAgain = buyAgainProducts.slice(buyAgainPage * ITEMS_PER_PAGE, (buyAgainPage + 1) * ITEMS_PER_PAGE);
  const visibleSuggest  = suggestions.slice(suggestPage * ITEMS_PER_PAGE, (suggestPage + 1) * ITEMS_PER_PAGE);
  const handleContinueToCheckout = () => {
    if (!isAuthenticated) {
      router.push('/auth?callbackUrl=/checkout');
      return;
    }

    router.push('/checkout');
  };

  return (
    <div className="min-h-screen" style={{ background: '#fdf8ff', paddingBottom: '120px' }}>

      {/* Background auras */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-15%] right-[-8%] w-[55%] h-[55%] rounded-full blur-[140px]" style={{ background: 'rgba(196,167,254,0.16)' }} />
        <div className="absolute bottom-[-10%] left-[-6%] w-[45%] h-[45%] rounded-full blur-[120px]" style={{ background: 'rgba(249,168,212,0.10)' }} />
      </div>

      {/* ── Sticky top bar (Amazon-style) ── */}
      <div
        className="sticky top-0 z-50"
        style={{ background: 'rgba(253,248,255,0.92)', backdropFilter: 'blur(28px)', borderBottom: '1px solid rgba(216,180,254,0.28)' }}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between gap-6">

          {/* Left: heading + cart summary */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Image
                src="/Adobe Express - file (5).png"
                alt="Naya Lumière"
                width={80}
                height={28}
                className="h-7 w-auto object-contain hidden sm:block"
              />
            </div>
            <h1 className="text-[18px] md:text-[24px] font-bold tracking-tight leading-tight" style={{ color: '#3b0764' }}>
              Need anything else?
            </h1>
            <p className="text-[11px] font-medium mt-0.5" style={{ color: 'rgba(59,7,100,0.42)' }}>
              {cartCount} {cartCount === 1 ? 'item' : 'items'} · AED {subtotal.toFixed(2)}
            </p>
          </div>

          {/* Right: CTAs stacked like Amazon */}
          <div className="flex flex-col gap-2 shrink-0 items-end">
            <motion.button
              onClick={handleContinueToCheckout}
              whileTap={{ scale: 0.97 }}
              className="cl-gradient-btn flex items-center gap-2 px-6 md:px-8 py-3 rounded-full text-[13px] font-semibold"
            >
              Continue
              <ArrowRight size={13} />
            </motion.button>
            <button
              onClick={() => router.push('/cart')}
              className="text-[12px] font-medium transition-all hover:opacity-60"
              style={{ color: 'rgba(107,33,168,0.45)' }}
            >
              ← Back to Cart
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-10 pb-6 relative z-10 space-y-14">

        {/* Buy it again */}
        {hasBuyAgain && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SectionHeader
              icon={<RefreshCw size={17} strokeWidth={1.75} />}
              title="Buy it again"
              subtitle="Items from your previous orders"
              page={buyAgainPage}
              totalPages={buyAgainPages}
              onPrev={() => setBuyAgainPage(p => Math.max(0, p - 1))}
              onNext={() => setBuyAgainPage(p => Math.min(buyAgainPages - 1, p + 1))}
            />
            <ProductGrid
              products={visibleBuyAgain}
              addedIds={addedIds}
              onAdd={handleAdd}
              isBuyAgain
              pageKey={buyAgainPage}
            />
          </motion.section>
        )}

        {/* You might also like */}
        {hasSuggest && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: hasBuyAgain ? 0.1 : 0 }}
          >
            <SectionHeader
              icon={<Sparkles size={17} strokeWidth={1.75} />}
              title="You might also like"
              subtitle="Curated from our full collection"
              page={suggestPage}
              totalPages={suggestPages}
              onPrev={() => setSuggestPage(p => Math.max(0, p - 1))}
              onNext={() => setSuggestPage(p => Math.min(suggestPages - 1, p + 1))}
            />
            <ProductGrid
              products={visibleSuggest}
              addedIds={addedIds}
              onAdd={handleAdd}
              isBuyAgain={false}
              pageKey={suggestPage}
            />
          </motion.section>
        )}

        {/* Edge case: no products to show */}
        {!loading && !hasBuyAgain && !hasSuggest && (
          <div className="py-24 text-center">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(196,167,254,0.18)', border: '1px solid rgba(216,180,254,0.35)' }}>
              <Star size={22} strokeWidth={1.25} style={{ color: 'rgba(196,167,254,0.6)' }} />
            </div>
            <h3 className="text-[18px] font-bold mb-2" style={{ color: '#3b0764' }}>You're all set</h3>
            <p className="text-[13px] mb-8" style={{ color: 'rgba(59,7,100,0.45)' }}>No suggestions right now — head to checkout whenever you're ready.</p>
          </div>
        )}
      </div>

      {/* ── Fixed bottom CTA bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-7 pt-4"
        style={{ background: 'rgba(253,248,255,0.94)', backdropFilter: 'blur(28px)', borderTop: '1px solid rgba(216,180,254,0.25)' }}
      >
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={() => router.push('/cart')}
            className="px-6 py-3.5 rounded-full text-[13px] font-medium transition-all active:scale-[0.97]"
            style={{
              border: '1px solid rgba(216,180,254,0.5)',
              color: 'rgb(126,105,230)',
              background: 'rgba(248,240,255,0.8)',
            }}
          >
            ← Cart
          </button>
          <motion.button
            onClick={handleContinueToCheckout}
            whileTap={{ scale: 0.97 }}
            className="cl-gradient-btn flex-1 py-3.5 rounded-full text-[14px] font-semibold flex items-center justify-center gap-2"
          >
            Continue to Checkout
            <ArrowRight size={13} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
