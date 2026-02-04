'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import StoreHeader from '../components/StoreHeader';
import StoreCategoryNav from '../components/StoreCategoryNav';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Droplets, Leaf, Award, Sparkles, Filter, ArrowRight, X, Search, Hash } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const skincareBenefits = [
  {
    icon: Droplets,
    title: 'Deep Hydration',
    description: 'Advanced formulas that penetrate deep for lasting moisture.',
    color: 'text-blue-400'
  },
  {
    icon: Leaf,
    title: 'Natural Integrity',
    description: 'Sustainably sourced botanicals and organic extracts.',
    color: 'text-green-400'
  },
  {
    icon: Award,
    title: 'Clinically Proven',
    description: 'Dermatologist-tested and scientifically validated results.',
    color: 'text-amber-400'
  },
  {
    icon: Sparkles,
    title: 'Visible Radiance',
    description: 'Noticeable improvements in texture, tone, and luminosity.',
    color: 'text-brand-pink'
  }
];

export default function SkincarePage() {
  const { fetchProductsByCategory, products: allProducts } = useAppContext();
  const [skincareProducts, setSkincareProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');
  const [gridCols, setGridCols] = useState(4);
  const router = useRouter();

  useEffect(() => {
    const getProducts = async () => {
      try {
        setIsLoading(true);
        // Assuming categories [1, 3, 5, 6, 7, 8] are skincare related
        const products = await fetchProductsByCategory([1, 3, 5, 6, 7, 8]);
        setSkincareProducts(products);
      } finally {
        setIsLoading(false);
      }
    };
    getProducts();
  }, [fetchProductsByCategory]);

  const sortedProducts = useMemo(() => {
    let products = [...skincareProducts];
    switch (sortBy) {
      case 'price-low': products.sort((a, b) => a.price - b.price); break;
      case 'price-high': products.sort((a, b) => b.price - a.price); break;
      case 'rating': products.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)); break;
      default: products.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }
    return products;
  }, [skincareProducts, sortBy]);

  return (
    <div className="bg-[#FAF9F6] min-h-screen font-sans text-gray-900 pb-40 overflow-x-hidden relative">
      {/* Background Aura */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-pink/[0.03] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-blue/[0.02] rounded-full blur-[120px]"></div>
      </div>

      {/* Tactile Paper Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply"></div>

      <StoreHeader title="Skincare." />
      <StoreCategoryNav />

      {/* Skincare Benefits - Dense Boutique Cards */}
      <section className="py-24 px-6 relative z-20 -mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {skincareBenefits.map((benefit, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-gray-100 shadow-xl group hover:shadow-2xl transition-all duration-700 flex flex-col items-center text-center space-y-5"
              >
                <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 border border-gray-100 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:bg-white group-hover:shadow-lg">
                  <benefit.icon className={`${benefit.color}`} size={28} strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-[16px] font-bold tracking-tight text-gray-900 uppercase">{benefit.title}</h3>
                  <p className="text-[13px] text-gray-400 font-medium tracking-tight leading-relaxed italic">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Skincare Vault Section */}
      <section id="skincare-vault" className="py-16 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12 border-b border-gray-100 pb-10">
            <div className="space-y-3 items-start flex flex-col text-left">
                <div className="flex items-center gap-3">
                    <span className="w-10 h-px bg-brand-pink"></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-pink">The Collection</span>
                </div>
                <h2 className="text-4xl font-serif italic text-gray-900 leading-none">Skincare Inventory</h2>
            </div>
            
            {/* Command Strip */}
            <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 px-4 border-r border-gray-100 mr-2">
                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Sort</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="border-none bg-transparent h-8 text-[10px] font-bold uppercase tracking-widest text-gray-900 focus:ring-0 w-[120px] p-0">
                            <SelectValue placeholder="Featured" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-200 shadow-2xl">
                            <SelectItem value="featured" className="text-[10px] uppercase font-bold">Featured</SelectItem>
                            <SelectItem value="price-low" className="text-[10px] uppercase font-bold">Price: low</SelectItem>
                            <SelectItem value="price-high" className="text-[10px] uppercase font-bold">Price: high</SelectItem>
                            <SelectItem value="rating" className="text-[10px] uppercase font-bold">Rating</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="flex items-center bg-gray-50 p-1 rounded-xl">
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
          
          <div className={`grid grid-cols-2 lg:grid-cols-${gridCols} gap-x-4 lg:gap-x-6 gap-y-8 lg:gap-y-16`}>
            {isLoading ? (
                Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : sortedProducts.length === 0 ? (
                <div className="col-span-full py-40 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
                    <p className="text-gray-400 font-serif italic text-2xl">Inventory Synchronization In Progress...</p>
                </div>
            ) : (
                sortedProducts.map((product, index) => (
                    <motion.div 
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: (index % 4) * 0.1, duration: 0.8 }}
                    >
                        <ProductCard {...product} image={product.imageUrl} />
                    </motion.div>
                ))
            )}
          </div>
        </div>
      </section>

      {/* Routine Guide - Apple-style Feature Cards */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.3]"></div>
        <div className="container mx-auto px-6 relative z-10 text-left">
          <div className="flex flex-col md:flex-row items-center justify-between mb-24 gap-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="h-px w-10 bg-brand-pink/30"></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-pink">Rituals</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-serif italic text-gray-900 leading-tight">Master Your <br/> Skincare Protocol</h2>
            </div>
            <p className="text-gray-400 text-[15px] font-medium tracking-tight max-w-md italic leading-relaxed">
              "Biological beauty is achieved through precise synchronization of daily rituals. Our experts curate the sequence for your skin's unique frequency."
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
                { time: "01", title: "Morning Awakening", desc: "Gentle cleansing followed by vitamin-rich serums and biological protection against environmental stressors.", icon: "🌅" },
                { time: "02", title: "Evening Restoration", desc: "Deep purification and targeted treatments that synchronize with your skin's nocturnal repair cycle.", icon: "🌙" },
                { time: "03", title: "Weekly Resurfacing", desc: "Intensive masks and professional-grade exfoliants to accelerate cellular turnover and reveal new light.", icon: "✨" }
            ].map((routine, i) => (
                <div key={i} className="bg-gray-50/50 p-10 rounded-[3rem] border border-gray-100 flex flex-col justify-between min-h-[320px] hover:bg-white hover:shadow-2xl hover:shadow-gray-200/40 transition-all duration-700 group border-b-[4px] border-b-transparent hover:border-b-brand-pink/20">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-brand-pink/40 group-hover:text-brand-pink transition-colors">{routine.time}</span>
                            <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{routine.icon}</span>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-serif italic text-gray-900">{routine.title}</h3>
                            <p className="text-sm text-gray-500 font-medium tracking-tight leading-relaxed italic">{routine.desc}</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-900 mt-10 group-hover:text-brand-pink transition-colors">
                        Learn Protocol <ArrowRight size={14} />
                    </button>
                </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skincare CTA */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6 text-center space-y-12 relative z-10">
          <div className="space-y-4">
            <h3 className="text-4xl md:text-6xl font-serif italic text-gray-900 leading-tight">
                Unlock your skin's <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-pink to-brand-blue not-italic font-black uppercase tracking-tighter">Perfect Frequency</span>
            </h3>
            <p className="text-gray-400 text-[15px] font-medium tracking-tight max-w-xl mx-auto leading-relaxed italic">
                Our AI-powered Skin Quiz analyzes your unique biological markers to curate a bespoke selection of masterpieces.
            </p>
          </div>
          <div className="max-w-md mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-pink/20 to-brand-blue/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <button 
                onClick={() => router.push('/skin-quiz')}
                className="relative w-full bg-gray-900 text-white py-6 rounded-full text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-brand-pink transition-all active:scale-[0.98]"
            >
                Start Diagnostic Journey
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}