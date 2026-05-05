'use client';

import React, { useState, useEffect } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';

export default function PairItWithSection({ currentCartItems }) {
  const { addToCart } = useCart();
  const [suggestedProducts, setSuggestedProducts] = useState([]);

  useEffect(() => {
    fetch('/api/products/suggestions?limit=4')
      .then(res => res.ok ? res.json() : [])
      .then(data => setSuggestedProducts(data))
      .catch(() => setSuggestedProducts([]));
  }, []);

  const filteredSuggestions = suggestedProducts.filter(p =>
    !currentCartItems.some(c => c.id === p.id)
  );

  if (filteredSuggestions.length === 0) return null;

  const handleAddToCart = (product) => {
    // Normalize: API returns stockQuantity (camelCase), CartContext expects stock_quantity
    const normalized = { ...product, stock_quantity: product.stockQuantity || product.stock_quantity };
    addToCart(normalized, 1);
  };

  return (
    <div className="rounded-[2.5rem] overflow-hidden relative" style={{
      background: 'rgba(255,255,255,0.72)',
      border: '1px solid rgba(216,180,254,0.35)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 2px 24px rgba(147,51,234,0.07)',
    }}>
      <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full blur-[60px] pointer-events-none" style={{ background: 'rgba(196,167,254,0.15)' }} />

      <div className="p-7 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(196,167,254,0.18)', color: 'rgb(126,105,230)' }}>
            <Sparkles size={15} strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-[15px] font-bold tracking-tight" style={{ color: '#3b0764' }}>Pair It With</h2>
            <p className="text-[11px]" style={{ color: 'rgba(59,7,100,0.45)' }}>Complete your ritual</p>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
          {filteredSuggestions.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex-shrink-0 w-40 group"
            >
              <div
                className="relative aspect-square rounded-2xl p-3 mb-3 transition-all duration-500 group-hover:-translate-y-1"
                style={{ background: 'rgba(248,240,255,0.8)', border: '1px solid rgba(216,180,254,0.25)' }}
              >
                <ImageWithFallback
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  onClick={() => handleAddToCart(product)}
                  className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-xl flex items-center justify-center text-white opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg"
                  style={{ background: 'var(--cl-gradient)' }}
                >
                  <ShoppingBag size={14} />
                </button>
              </div>
              <div className="px-0.5">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] mb-1" style={{ color: 'rgb(126,105,230)' }}>
                  {product.brandName || product.brand || 'Naya Lumière'}
                </p>
                <h3 className="text-[12px] font-bold truncate leading-snug mb-1.5" style={{ color: '#3b0764' }}>{product.name}</h3>
                <p className="text-[12px] font-black mb-2.5" style={{ color: '#3b0764' }}>AED {parseFloat(product.price).toFixed(2)}</p>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full py-2.5 rounded-full text-[12px] font-semibold transition-all active:scale-[0.97]"
                  style={{
                    background: 'rgba(196,167,254,0.18)',
                    border: '1px solid rgba(196,167,254,0.35)',
                    color: 'rgb(126,105,230)',
                  }}
                >
                  Add to Cart
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
