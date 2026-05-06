'use client';

import React, { useState, useEffect } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ShoppingBag, Check, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';

export default function PairItWithSection({ currentCartItems }) {
  const { addToCart } = useCart();
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [addedIds, setAddedIds] = useState(new Set());

  useEffect(() => {
    fetch('/api/products/suggestions?limit=4')
      .then(res => res.ok ? res.json() : [])
      .then(data => setSuggestedProducts(data))
      .catch(() => setSuggestedProducts([]));
  }, []);

  const filtered = suggestedProducts.filter(p => !currentCartItems.some(c => c.id === p.id));
  if (filtered.length === 0) return null;

  const handleAdd = (product) => {
    const normalized = { ...product, stock_quantity: product.stockQuantity || product.stock_quantity };
    addToCart(normalized, 1);
    setAddedIds(prev => new Set([...prev, product.id]));
    setTimeout(() => setAddedIds(prev => { const n = new Set(prev); n.delete(product.id); return n; }), 2200);
  };

  return (
    <div>
      {/* Section label */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] font-semibold text-[#8a8a93] uppercase tracking-[0.18em] mb-0.5">
            Frequently Bought Together
          </p>
        </div>
        <button
          onClick={() => handleAdd(filtered[0])}
          className="hidden sm:flex items-center gap-1.5 text-[12px] font-medium text-[#9869f7] hover:underline underline-offset-2 transition-colors"
        >
          <Sparkles size={11} strokeWidth={2} />
          Add all
        </button>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {filtered.map((product, i) => {
          const added = addedIds.has(product.id);
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: 0.25 }}
              className="flex-shrink-0 w-[168px] border border-[#e5e5ea] rounded-xl overflow-hidden bg-white hover:border-[#c8c8cf] hover:shadow-sm transition-all duration-200 group"
            >
              {/* Image */}
              <div className="aspect-square bg-[#f9f9fb] border-b border-[#e5e5ea] p-3 overflow-hidden">
                <ImageWithFallback
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-400"
                />
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-[10px] font-semibold text-[#8a8a93] uppercase tracking-[0.1em] mb-0.5 truncate">
                  {product.brandName || product.brand || 'Naya Lumière'}
                </p>
                <p className="text-[13px] font-semibold text-[#111114] leading-snug line-clamp-2 mb-1">
                  {product.name}
                </p>
                <p className="text-[13px] font-semibold text-[#111114] tabular-nums mb-2.5">
                  AED {parseFloat(product.price).toFixed(0)}
                  {product.size && <span className="text-[11px] font-normal text-[#8a8a93] ml-1">· {product.size}</span>}
                </p>
                <button
                  onClick={() => handleAdd(product)}
                  className="w-full h-8 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
                  style={added
                    ? { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }
                    : { background: 'linear-gradient(90deg,#c087fc,#9869f7)', color: '#fff' }
                  }
                >
                  {added
                    ? <><Check size={11} strokeWidth={3} /> Added</>
                    : <><ShoppingBag size={11} /> Add to cart</>
                  }
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
