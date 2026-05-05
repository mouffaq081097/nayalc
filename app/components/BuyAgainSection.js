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

  const handleAddToCart = (product) => {
    const normalized = { ...product, stock_quantity: product.stockQuantity || product.stock_quantity };
    addToCart(normalized, 1);
    setAddedIds(prev => new Set([...prev, product.id]));
    setTimeout(() => {
      setAddedIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2200);
  };

  const prevPage = () => setPage(p => Math.max(0, p - 1));
  const nextPage = () => setPage(p => Math.min(totalPages - 1, p + 1));

  return (
    <div
      className="rounded-[2.5rem] overflow-hidden relative"
      style={{
        background: 'rgba(255,255,255,0.72)',
        border: '1px solid rgba(216,180,254,0.35)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 2px 24px rgba(147,51,234,0.07)',
      }}
    >
      {/* Background aura */}
      <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-[70px] pointer-events-none" style={{ background: 'rgba(196,167,254,0.18)' }} />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full blur-[50px] pointer-events-none" style={{ background: 'rgba(249,168,212,0.12)' }} />

      <div className="p-7 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(196,167,254,0.18)', color: 'rgb(126,105,230)' }}>
              <RefreshCw size={16} strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-[18px] font-bold tracking-tight" style={{ color: '#3b0764' }}>Buy Again</h2>
              <p className="text-[11px]" style={{ color: 'rgba(59,7,100,0.45)' }}>Items you've loved before</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Page indicator */}
            {totalPages > 1 && (
              <span className="text-[11px] font-semibold hidden sm:block" style={{ color: 'rgba(107,33,168,0.45)' }}>
                Page {page + 1} of {totalPages}
              </span>
            )}

            {/* Navigation arrows */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={prevPage}
                  disabled={page === 0}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-25"
                  style={{
                    border: '1px solid rgba(216,180,254,0.5)',
                    color: 'rgb(126,105,230)',
                    background: page === 0 ? 'transparent' : 'rgba(196,167,254,0.1)',
                  }}
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={nextPage}
                  disabled={page === totalPages - 1}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-25"
                  style={{
                    border: '1px solid rgba(216,180,254,0.5)',
                    color: 'rgb(126,105,230)',
                    background: page === totalPages - 1 ? 'transparent' : 'rgba(196,167,254,0.1)',
                  }}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}

            <button
              onClick={() => router.push('/account/orders')}
              className="text-[10px] font-bold uppercase tracking-[0.1em] transition-all hover:opacity-60 hidden sm:block"
              style={{ color: 'rgb(126,105,230)' }}
            >
              View all &amp; manage
            </button>
          </div>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <AnimatePresence mode="wait">
            {visible.map((product, i) => {
              const added = addedIds.has(product.id);
              return (
                <motion.div
                  key={`${page}-${product.id}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className="group flex flex-col rounded-[20px] overflow-hidden"
                  style={{
                    background: 'rgba(248,240,255,0.65)',
                    border: '1px solid rgba(216,180,254,0.28)',
                  }}
                >
                  {/* Image */}
                  <div
                    className="relative aspect-square overflow-hidden p-4 cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(216,180,254,0.2)' }}
                    onClick={() => router.push(`/product/${product.id}`)}
                  >
                    <ImageWithFallback
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex flex-col flex-1 p-3.5 gap-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.12em]" style={{ color: 'rgb(126,105,230)' }}>
                      {product.brandName || 'Naya Lumière'}
                    </p>
                    <h3
                      className="text-[12px] font-bold leading-snug line-clamp-2 flex-1 cursor-pointer"
                      style={{ color: '#3b0764' }}
                      onClick={() => router.push(`/product/${product.id}`)}
                    >
                      {product.name}
                    </h3>
                    <p className="text-[13px] font-black tabular-nums mt-1" style={{ color: '#3b0764' }}>
                      AED {parseFloat(product.price).toFixed(2)}
                    </p>

                    {/* Add to cart */}
                    <motion.button
                      onClick={() => handleAddToCart(product)}
                      whileTap={{ scale: 0.96 }}
                      className="mt-2.5 w-full py-2.5 rounded-xl text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
                      style={{
                        background: added
                          ? 'linear-gradient(135deg,rgb(134,239,172),rgb(52,211,153))'
                          : 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))',
                        boxShadow: added
                          ? '0 4px 14px rgba(52,211,153,0.3)'
                          : '0 4px 14px rgba(147,51,234,0.2)',
                      }}
                    >
                      {added ? (
                        <>
                          <Check size={11} strokeWidth={3} />
                          Added
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={11} />
                          Add to cart
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Mobile pagination dots */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5 sm:hidden">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className="transition-all rounded-full"
                style={{
                  width: i === page ? '20px' : '6px',
                  height: '6px',
                  background: i === page
                    ? 'linear-gradient(90deg,rgb(196,167,254),rgb(126,105,230))'
                    : 'rgba(216,180,254,0.4)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
