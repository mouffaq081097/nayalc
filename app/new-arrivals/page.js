'use client';

import React, { useState, useEffect, useMemo } from 'react';
import StoreHeader from '../components/StoreHeader';
import StoreCategoryNav from '../components/StoreCategoryNav';
import { useAppContext } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, X, Filter, Sparkles, Hash, ArrowRight, ShoppingBag, Star, Wind, Award, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function NewArrivalsPage() {
  const { products: allProducts, fetchProducts } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [gridCols, setGridCols] = useState(4);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        await fetchProducts();
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [fetchProducts]);

  const newProducts = useMemo(() => {
    let filtered = allProducts.filter(p => p.isNew);
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) || 
        (p.brand && p.brand.toLowerCase().includes(term))
      );
    }

    switch (sortBy) {
      case 'price-low': filtered.sort((a, b) => a.price - b.price); break;
      case 'price-high': filtered.sort((a, b) => b.price - a.price); break;
      case 'rating': filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)); break;
      default: filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return filtered;
  }, [allProducts, searchTerm, sortBy]);

  return (
    <div className="bg-[#FAF9F6] min-h-screen font-sans text-gray-900 pb-40 overflow-x-hidden relative">
      {/* Background Aura */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-pink/[0.03] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-blue/[0.02] rounded-full blur-[120px]"></div>
      </div>

      {/* Tactile Paper Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply"></div>

      <StoreHeader title="Latest." />
      <StoreCategoryNav />

      <div className="container mx-auto px-4 md:px-10 relative z-30 pt-16">
        {/* Apple Style Command Strip */}
        <div className="bg-white/80 backdrop-blur-2xl border border-gray-200 shadow-sm rounded-[1.5rem] flex flex-col md:flex-row items-center gap-4 py-3 px-6 mb-16">
            <div className="relative group flex-grow w-full md:w-auto">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isSearchFocused ? 'text-brand-pink' : 'text-gray-300'}`} size={16} />
                <input 
                    placeholder="Search arrivals..."
                    value={searchTerm}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-11 pr-10 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white transition-all"
                />
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto justify-between border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-6">
                <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Sort</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="border border-gray-100 bg-gray-50 rounded-xl px-4 py-2 h-10 text-[10px] font-bold uppercase tracking-widest text-gray-900 focus:ring-0 w-[140px]">
                            <SelectValue placeholder="Newest" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-200 shadow-2xl">
                            <SelectItem value="newest" className="text-[10px] uppercase font-bold py-3 rounded-lg">Newest</SelectItem>
                            <SelectItem value="price-low" className="text-[10px] uppercase font-bold py-3 rounded-lg">Price Low</SelectItem>
                            <SelectItem value="price-high" className="text-[10px] uppercase font-bold py-3 rounded-lg">Price High</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100">
                    {[3, 4].map((num) => (
                        <button 
                            key={num}
                            onClick={() => setGridCols(num)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${gridCols === num ? 'bg-white shadow-sm text-brand-pink' : 'text-gray-300'}`}
                        >
                            <Hash size={14} />
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <main id="new-inventory" className="w-full">
            {isLoading ? (
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${gridCols} gap-x-4 lg:gap-x-6 gap-y-12 lg:gap-y-16`}>
                {Array.from({ length: 8 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            ) : newProducts.length === 0 ? (
              <div className="py-40 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
                <Clock size={40} className="mx-auto text-gray-200 mb-6" />
                <h3 className="font-serif text-3xl italic text-gray-900">Synchronizing Collection...</h3>
                <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">Our latest Curations are undergoing final certification. Please return shortly.</p>
              </div>
            ) : (
              <div className="space-y-32">
                {/* Highlight Cards - Apple Feature Style */}
                {newProducts.length >= 2 && !searchTerm && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {newProducts.slice(0, 2).map((product, i) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                key={`highlight-${product.id}`}
                                onClick={() => router.push(`/product/${product.id}`)}
                                className="group relative aspect-[4/3] rounded-[3rem] overflow-hidden bg-white border border-gray-100 shadow-xl cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-[#f5f5f7] p-12 lg:p-20">
                                    <img src={product.imageUrl} alt="" className="w-full h-full object-contain mix-blend-multiply transition-transform duration-1000 group-hover:scale-105" />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 to-transparent flex flex-col justify-end p-10 lg:p-12 space-y-4">
                                    <div className="space-y-1">
                                        <Badge className="bg-brand-pink/10 text-brand-pink border-none font-bold uppercase text-[9px] tracking-widest mb-2 px-3">Editor's Choice</Badge>
                                        <h3 className="text-3xl font-serif italic text-gray-900 leading-tight">{product.name}</h3>
                                        <p className="text-gray-500 text-sm line-clamp-2 max-w-xs italic">"{product.description}"</p>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-xl font-bold tracking-tighter">AED {product.price.toFixed(2)}</span>
                                        <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-lg group-hover:bg-brand-pink transition-all">
                                            <ArrowRight size={20} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Main Grid */}
                <div className="space-y-12">
                    <div className="flex items-center gap-6">
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-[0.5em] whitespace-nowrap">Full Inventory</span>
                        <div className="h-px w-full bg-gray-100"></div>
                    </div>
                    
                    <div className={`grid grid-cols-2 lg:grid-cols-${gridCols} gap-x-4 lg:gap-x-6 gap-y-8 lg:gap-y-16`}>
                        <AnimatePresence mode='popLayout'>
                            {newProducts.map((product, index) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: (index % 12) * 0.05 }}
                                key={product.id} 
                            >
                                <ProductCard {...product} image={product.imageUrl} />
                            </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Editorial Callout - Apple Style */}
                {!searchTerm && (
                    <section className="py-32 bg-white rounded-[4rem] px-12 lg:px-24 border border-gray-100 shadow-2xl relative overflow-hidden text-center space-y-10">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-pink/5 rounded-full blur-[120px]"></div>
                        <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
                            <Star size={32} className="text-brand-pink mx-auto" strokeWidth={1.5} />
                            <h2 className="text-4xl md:text-6xl font-serif italic text-gray-900 leading-tight">Be the first to reveal <br/> our next Curations.</h2>
                            <p className="text-gray-400 text-[15px] font-medium tracking-tight leading-relaxed italic px-4">Join our exclusive journal for early access to limited seasonal previews, laboratory reveals, and private boutique events.</p>
                            <button className="px-12 py-5 bg-gray-900 text-white rounded-full text-[11px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-brand-pink transition-all active:scale-95">
                                Join the VIP list
                            </button>
                        </div>
                    </section>
                )}
              </div>
            )}
        </main>
      </div>
    </div>
  );
}