'use client';

import React, { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ShoppingBag, ChevronLeft, ChevronRight, Check, RefreshCw } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS_PER_PAGE = 4;

export default function BuyAgainSection({ products }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [addedIds, setAddedIds] = useState(new Set());

  if (!products || products.length === 0) return null;

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const visible = products.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const handleAdd = (product) => {
    const normalized = { ...product, stock_quantity: product.stockQuantity || product.stock_quantity };
    addToCart(normalized, 1);
    setAddedIds(prev => new Set([...prev, product.id]));
    setTimeout(() => setAddedIds(prev => { const n = new Set(prev); n.delete(product.id); return n; }), 2200);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <RefreshCw size={13} strokeWidth={2} className="text-[#8a8a93]" />
          <div>
            <p className="text-[11px] font-semibold text-[#8a8a93] uppercase tracking-[0.18em]">Buy It Again</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {totalPages > 1 && (
            <>
              <span className="text-[11px] text-[#8a8a93] hidden sm:block">{page + 1} / {totalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-7 h-7 rounded-lg border border-[#e5e5ea] flex items-center justify-center text-[#5a5a64] hover:bg-[#f3f3f5] transition-colors disabled:opacity-30"
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="w-7 h-7 rounded-lg border border-[#e5e5ea] flex items-center justify-center text-[#5a5a64] hover:bg-[#f3f3f5] transition-colors disabled:opacity-30"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </>
          )}
          <button
            onClick={() => router.push('/account/orders')}
            className="text-[12px] font-medium text-[#9869f7] hover:underline underline-offset-2 transition-colors hidden sm:block"
          >
            View orders
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AnimatePresence mode="wait">
          {visible.map((product, i) => {
            const added = addedIds.has(product.id);
            return (
              <motion.div
                key={`${page}-${product.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ delay: i * 0.05, duration: 0.22 }}
                className="border border-[#e5e5ea] rounded-xl overflow-hidden bg-white hover:border-[#c8c8cf] hover:shadow-sm transition-all duration-200 group flex flex-col"
              >
                {/* Image with hover quick-add */}
                <div className="aspect-square bg-[#f9f9fb] border-b border-[#e5e5ea] p-3 overflow-hidden relative cursor-pointer"
                  onClick={() => router.push(`/product/${product.id}`)}>
                  <ImageWithFallback
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-400"
                  />
                  {/* Hover quick-add */}
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={e => { e.stopPropagation(); handleAdd(product); }}
                      className="flex items-center gap-1.5 text-[11px] font-semibold px-3 h-7 rounded-full shadow-md transition-all"
                      style={added
                        ? { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }
                        : { background: 'linear-gradient(90deg,#c087fc,#9869f7)', color: '#fff' }
                      }
                    >
                      {added ? <><Check size={10} strokeWidth={3} /> Added</> : <><ShoppingBag size={10} /> Add</>}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col flex-1">
                  <p className="text-[10px] font-semibold text-[#8a8a93] uppercase tracking-[0.1em] mb-0.5 truncate">
                    {product.brandName || 'Naya Lumière'}
                  </p>
                  <p
                    className="text-[13px] font-semibold text-[#111114] leading-snug line-clamp-2 flex-1 cursor-pointer hover:underline underline-offset-2 mb-1.5"
                    onClick={() => router.push(`/product/${product.id}`)}
                  >
                    {product.name}
                  </p>
                  <p className="text-[13px] font-bold text-[#111114] tabular-nums">
                    AED {parseFloat(product.price).toFixed(0)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Mobile pagination dots */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-4 sm:hidden">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className="rounded-full transition-all"
              style={{
                width: i === page ? 18 : 6,
                height: 6,
                background: i === page ? '#9869f7' : '#e5e5ea',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
