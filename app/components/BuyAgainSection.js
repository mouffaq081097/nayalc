'use client';

import React from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';
import { ShoppingBag, ChevronRight, RefreshCw } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function BuyAgainSection({ products }) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (!products || products.length === 0) {
    return null;
  }

  const handleAddToCart = (product) => {
    addToCart({ product, quantity: 1 });
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 overflow-hidden relative">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-2xl">
            <RefreshCw className="h-5 w-5 text-[var(--brand-blue)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Purchase Again</h2>
            <p className="text-xs text-gray-500">Items you've loved before</p>
          </div>
        </div>
        <button 
          onClick={() => router.push('/account?tab=orders')}
          className="text-sm font-bold text-[var(--brand-pink)] hover:opacity-80 transition-opacity flex items-center gap-1 group"
        >
          View All Orders
          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
        {products.map((product, index) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 w-44 group"
          >
            <div className="relative aspect-square rounded-[2rem] bg-[#F8F9FA] p-4 mb-4 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-blue-500/5 group-hover:-translate-y-1">
              <ImageWithFallback
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
              />
              
              <button
                onClick={() => handleAddToCart(product)}
                className="absolute bottom-3 right-3 h-10 w-10 bg-white shadow-lg rounded-2xl flex items-center justify-center text-gray-900 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-[var(--brand-pink)] hover:text-white"
              >
                <ShoppingBag className="h-5 w-5" />
              </button>
            </div>

            <div className="px-1">
              <p className="text-[10px] font-bold text-[var(--brand-blue)] uppercase tracking-wider mb-1 opacity-60">
                {product.brandName || 'Naya Lumière'}
              </p>
              <h3 className="text-sm font-bold text-gray-900 truncate mb-1.5 group-hover:text-[var(--brand-pink)] transition-colors">
                {product.name}
              </h3>
              <p className="text-sm font-black text-gray-900">
                AED {parseFloat(product.price).toFixed(2)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Subtle decorative background element */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50/50 blur-3xl rounded-full pointer-events-none"></div>
    </div>
  );
}
