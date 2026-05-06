'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Check, ChevronLeft, ChevronRight, Sparkles, RefreshCw, ArrowRight, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import Image from 'next/image';

const ITEMS_PER_PAGE = 6;

/* ── Section header ── */
function SectionHeader({ icon, title, subtitle, page, totalPages, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#f3f3f5] border border-[#e5e5ea] flex items-center justify-center text-[#5a5a64]">
          {icon}
        </div>
        <div>
          <h2 className="text-[18px] font-semibold text-[#111114]">{title}</h2>
          <p className="text-[11px] text-[#8a8a93] mt-0.5">{subtitle}</p>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#8a8a93] hidden sm:block">{page + 1} / {totalPages}</span>
          <div className="flex gap-1.5">
            {[
              { fn: onPrev, disabled: page === 0,             icon: <ChevronLeft size={14} />  },
              { fn: onNext, disabled: page === totalPages - 1, icon: <ChevronRight size={14} /> },
            ].map((btn, i) => (
              <button
                key={i}
                onClick={btn.fn}
                disabled={btn.disabled}
                className="w-8 h-8 rounded-lg border border-[#e5e5ea] flex items-center justify-center text-[#5a5a64] hover:bg-[#f3f3f5] transition-colors disabled:opacity-30"
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

/* ── Product card ── */
function ProductCard({ product, imageUrl, added, onAdd }) {
  const price = parseFloat(product.price || 0);
  return (
    <div className="group flex flex-col bg-white border border-[#e5e5ea] rounded-xl overflow-hidden hover:border-[#c8c8cf] hover:shadow-sm transition-all duration-200">
      {/* Image */}
      <div className="aspect-square bg-[#f9f9fb] relative overflow-hidden p-4 border-b border-[#e5e5ea]">
        <ImageWithFallback
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
        />
        {/* Hover quick-add */}
        <motion.button
          onClick={onAdd}
          whileTap={{ scale: 0.94 }}
          className="absolute inset-x-3 bottom-3 py-2 rounded-lg text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200"
          style={{
            background: added
              ? 'linear-gradient(135deg,#86efac,#34d399)'
              : 'linear-gradient(90deg,#c087fc,#9869f7)',
          }}
        >
          {added ? <><Check size={11} strokeWidth={3} /> Added</> : <><ShoppingBag size={11} /> Quick add</>}
        </motion.button>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3.5 gap-1.5">
        <p className="text-[10px] font-semibold text-[#8a8a93] uppercase tracking-widest">
          {product.brandName || product.brand || 'Naya Lumière'}
        </p>
        <h3 className="text-[13px] font-semibold text-[#111114] leading-snug line-clamp-2 flex-1">{product.name}</h3>
        <p className="text-[14px] font-bold text-[#111114] tabular-nums">AED {price.toFixed(2)}</p>

        <button
          onClick={onAdd}
          className="mt-1.5 w-full py-2 rounded-lg text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
          style={{
            background: added
              ? 'linear-gradient(135deg,#86efac,#34d399)'
              : 'linear-gradient(90deg,#c087fc,#9869f7)',
          }}
        >
          {added ? <><Check size={11} strokeWidth={3} /> Added!</> : <><ShoppingBag size={11} /> Add to cart</>}
        </button>
      </div>
    </div>
  );
}

/* ── Product grid ── */
function ProductGrid({ products, addedIds, onAdd, isBuyAgain, pageKey }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <AnimatePresence mode="wait">
        {products.map((product, i) => (
          <motion.div
            key={`${pageKey}-${product.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
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

/* ── Page ── */
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

  useEffect(() => {
    if (!loading && cartItems.length === 0) router.replace('/cart');
  }, [cartItems, loading, router]);

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
      ? { id: product.id, name: product.name, price: parseFloat(product.price), image: product.imageUrl, brand: product.brandName || 'Naya Lumière', stock_quantity: product.stockQuantity ?? product.stock_quantity ?? 99 }
      : { ...product, stock_quantity: product.stock_quantity ?? product.stockQuantity ?? 99 };
    addToCart(normalized, 1);
    setAddedIds(prev => new Set([...prev, product.id]));
    setTimeout(() => setAddedIds(prev => { const n = new Set(prev); n.delete(product.id); return n; }), 2500);
  };

  const handleContinueToCheckout = () => {
    if (!isAuthenticated) { router.push('/auth?callbackUrl=/checkout'); return; }
    router.push('/checkout');
  };

  const suggestions = (products || [])
    .filter(p => !cartItems.some(c => c.id === p.id) && !buyAgainProducts.some(b => b.id === p.id))
    .slice(0, 30);

  const cartCount      = cartItems.reduce((t, i) => t + i.quantity, 0);
  const hasBuyAgain    = buyAgainProducts.length > 0;
  const hasSuggest     = suggestions.length > 0;
  const buyAgainPages  = Math.ceil(buyAgainProducts.length / ITEMS_PER_PAGE);
  const suggestPages   = Math.ceil(suggestions.length / ITEMS_PER_PAGE);
  const visibleBuyAgain = buyAgainProducts.slice(buyAgainPage * ITEMS_PER_PAGE, (buyAgainPage + 1) * ITEMS_PER_PAGE);
  const visibleSuggest  = suggestions.slice(suggestPage * ITEMS_PER_PAGE, (suggestPage + 1) * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-white" style={{ paddingBottom: '100px' }}>

      {/* Sticky top bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#e5e5ea]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between gap-6">

          {/* Left */}
          <div className="min-w-0">
            <Image
              src="/Adobe Express - file (5).png"
              alt="Naya Lumière"
              width={28}
              height={28}
              className="h-7 w-auto object-contain mb-1 hidden sm:block"
            />
            <h1 className="text-[18px] md:text-[22px] font-semibold text-[#111114] leading-tight">
              Need anything else?
            </h1>
            <p className="text-[12px] text-[#8a8a93] mt-0.5">
              {cartCount} {cartCount === 1 ? 'item' : 'items'} · AED {subtotal.toFixed(2)}
            </p>
          </div>

          {/* Right */}
          <div className="flex flex-col gap-2 shrink-0 items-end">
            <button
              onClick={handleContinueToCheckout}
              className="h-10 px-6 md:px-8 rounded-full flex items-center gap-2 text-[13px] font-semibold tracking-[0.08em] uppercase text-white"
              style={{ background: 'linear-gradient(90deg,#c087fc,#9869f7)' }}
            >
              Continue
              <ArrowRight size={13} />
            </button>
            <button
              onClick={() => router.push('/cart')}
              className="text-[12px] font-medium text-[#8a8a93] hover:text-[#5a5a64] transition-colors"
            >
              ← Back to cart
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-8 pb-6 space-y-12">

        {/* Buy it again */}
        {hasBuyAgain && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <SectionHeader
              icon={<RefreshCw size={15} strokeWidth={1.75} />}
              title="Buy it again"
              subtitle="From your previous orders"
              page={buyAgainPage}
              totalPages={buyAgainPages}
              onPrev={() => setBuyAgainPage(p => Math.max(0, p - 1))}
              onNext={() => setBuyAgainPage(p => Math.min(buyAgainPages - 1, p + 1))}
            />
            <ProductGrid products={visibleBuyAgain} addedIds={addedIds} onAdd={handleAdd} isBuyAgain pageKey={buyAgainPage} />
          </motion.section>
        )}

        {/* You might also like */}
        {hasSuggest && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: hasBuyAgain ? 0.1 : 0 }}
          >
            <SectionHeader
              icon={<Sparkles size={15} strokeWidth={1.75} />}
              title="You might also like"
              subtitle="Curated from our full collection"
              page={suggestPage}
              totalPages={suggestPages}
              onPrev={() => setSuggestPage(p => Math.max(0, p - 1))}
              onNext={() => setSuggestPage(p => Math.min(suggestPages - 1, p + 1))}
            />
            <ProductGrid products={visibleSuggest} addedIds={addedIds} onAdd={handleAdd} isBuyAgain={false} pageKey={suggestPage} />
          </motion.section>
        )}

        {/* Edge case */}
        {!loading && !hasBuyAgain && !hasSuggest && (
          <div className="py-24 text-center">
            <div className="w-14 h-14 rounded-xl bg-[#f3f3f5] border border-[#e5e5ea] flex items-center justify-center mx-auto mb-4">
              <Star size={20} strokeWidth={1.25} className="text-[#c8c8cf]" />
            </div>
            <h3 className="text-[17px] font-semibold text-[#111114] mb-2">You're all set</h3>
            <p className="text-[13px] text-[#5a5a64] mb-8">No suggestions right now — head to checkout whenever you're ready.</p>
          </div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#e5e5ea] px-5 py-4">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={() => router.push('/cart')}
            className="h-12 px-6 rounded-full text-[13px] font-medium border border-[#e5e5ea] text-[#5a5a64] hover:bg-[#f3f3f5] transition-colors"
          >
            ← Cart
          </button>
          <button
            onClick={handleContinueToCheckout}
            className="flex-1 h-12 rounded-full text-[13px] font-semibold tracking-[0.1em] uppercase text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(90deg,#c087fc,#9869f7)' }}
          >
            Continue to Checkout
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
