"use client";

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import ProductCard from '../components/ProductCard';
import StoreHeader from '../components/StoreHeader';
import StoreCategoryNav from '../components/StoreCategoryNav';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, X, Filter, Sparkles, Check, Hash, ArrowRight, Minus, Plus as PlusIcon, Star, Gift, Droplets, CreditCard, Zap, Heart } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import { Slider } from '../components/ui/slider';
import Link from 'next/link';
import { Badge } from '../components/ui/badge';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';

const SidebarFilters = ({
  categories,
  brands,
  selectedCategories,
  setSelectedCategories,
  selectedBrands,
  setSelectedBrands,
  priceRange,
  setPriceRange,
  showInStock,
  setShowInStock,
  maxPrice,
  clearFilters,
  allProducts,
}) => {
  const [localPriceRange, setLocalPriceRange] = useState(priceRange);
  const [showAllBrands, setShowMoreBrands] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setPriceRange(localPriceRange);
    }, 500);
    return () => clearTimeout(handler);
  }, [localPriceRange, setPriceRange]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    allProducts.forEach(p => {
      if (p.categoryNames) {
        p.categoryNames.split(',').forEach(cat => {
          const c = cat.trim().toLowerCase();
          counts[c] = (counts[c] || 0) + 1;
        });
      }
    });
    return counts;
  }, [allProducts]);

  const brandCounts = useMemo(() => {
    const counts = {};
    allProducts.forEach(p => {
      if (p.brand) {
        const b = p.brand;
        counts[b] = (counts[b] || 0) + 1;
      }
    });
    return counts;
  }, [allProducts]);

  const displayedBrands = showAllBrands ? brands : brands.slice(0, 8);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between pb-6 border-b border-gray-100">
        <div>
            <h2 className="text-[11px] tracking-[0.4em] font-black text-gray-900">Selection</h2>
        </div>
        <button 
          onClick={clearFilters}
          className="text-[9px] tracking-widest text-brand-pink hover:text-gray-900 transition-all font-black border-b border-brand-pink/20 pb-0.5"
        >
          Reset
        </button>
      </div>

      <Accordion type="multiple" defaultValue={['category', 'brand', 'price']} className="w-full">
        <AccordionItem value="category" className="border-b border-gray-50 mb-2">
          <div className="flex items-center justify-between">
            <AccordionTrigger className="hover:no-underline py-5 text-[10px] uppercase tracking-[0.3em] font-black text-gray-900 flex-1">
              Collections
            </AccordionTrigger>
          </div>
          <AccordionContent>
            <div className="space-y-3 pt-1 pb-4">
              {categories.map((category) => (
                <div 
                    key={category} 
                    className="flex items-center justify-between group/item cursor-pointer" 
                    onClick={() => {
                        const next = selectedCategories.includes(category)
                          ? selectedCategories.filter((c) => c !== category)
                          : [...selectedCategories, category];
                        setSelectedCategories(next);
                    }}
                >
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedCategories.includes(category) ? 'bg-gray-900 border-gray-900' : 'border-gray-200 bg-white'}`}>
                        {selectedCategories.includes(category) && <Check size={10} className="text-white" strokeWidth={4} />}
                    </div>
                    <span className={`ml-3 text-[12px] tracking-widest transition-colors ${selectedCategories.includes(category) ? 'text-gray-900 font-bold' : 'text-gray-500 group-hover/item:text-gray-900'}`}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                  </div>
                  <span className="text-[9px] font-black text-gray-200 group-hover/item:text-brand-pink transition-colors">
                    {categoryCounts[category] || 0}
                  </span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="brand" className="border-b border-gray-50 mb-2">
          <div className="flex items-center justify-between">
            <AccordionTrigger className="hover:no-underline py-5 text-[10px] uppercase tracking-[0.3em] font-black text-gray-900 flex-1">
              Designers
            </AccordionTrigger>
          </div>
          <AccordionContent>
            <div className="space-y-3 pt-1 pb-4 pr-2">
              {displayedBrands.map((brand) => (
                <div 
                    key={brand} 
                    className="flex items-center justify-between group/item cursor-pointer"
                    onClick={() => {
                        const next = selectedBrands.includes(brand)
                        ? selectedBrands.filter((b) => b !== brand)
                        : [...selectedBrands, brand];
                        setSelectedBrands(next);
                    }}
                >
                <div className="flex items-center">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedBrands.includes(brand) ? 'bg-gray-900 border-gray-900' : 'border-gray-200 bg-white'}`}>
                        {selectedBrands.includes(brand) && <Check size={10} className="text-white" strokeWidth={4} />}
                    </div>
                    <span className={`ml-3 text-[12px] tracking-widest transition-colors ${selectedBrands.includes(brand) ? 'text-gray-900 font-bold' : 'text-gray-500 group-hover/item:text-gray-900'}`}>
                        {brand}
                    </span>
                </div>
                <span className="text-[9px] font-black text-gray-200 group-hover/item:text-brand-pink transition-colors">
                    {brandCounts[brand] || 0}
                </span>
                </div>
              ))}
              
              {brands.length > 8 && (
                <button 
                    onClick={() => setShowMoreBrands(!showAllBrands)}
                    className="text-[9px] font-black text-gray-400 hover:text-brand-pink transition-colors pt-2 uppercase tracking-widest flex items-center gap-2"
                >
                    {showAllBrands ? <Minus size={10} /> : <PlusIcon size={10} />}
                    {showAllBrands ? 'Condense' : `View All (${brands.length})`}
                </button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price" className="border-none mb-2">
          <AccordionTrigger className="hover:no-underline py-5 text-[10px] uppercase tracking-[0.3em] font-black text-gray-900">
            Investment
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-6 px-2 pb-4">
              <Slider
                defaultValue={priceRange}
                max={maxPrice}
                step={10}
                onValueChange={setLocalPriceRange}
                className="mb-8"
              />
              <div className="flex justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col">
                    <span className="text-[7px] uppercase text-gray-400 font-black tracking-[0.2em] mb-1">Min</span>
                    <span className="text-[11px] font-black text-gray-900">AED {localPriceRange[0]}</span>
                </div>
                <div className="h-6 w-[1px] bg-gray-100"></div>
                <div className="flex flex-col items-end">
                    <span className="text-[7px] uppercase text-gray-400 font-black tracking-[0.2em] mb-1">Max</span>
                    <span className="text-[11px] font-black text-gray-900">AED {localPriceRange[1]}</span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="pt-6 border-t border-gray-100">
        <label className="flex items-center justify-between group cursor-pointer bg-white p-4 rounded-2xl border border-gray-50 shadow-sm" onClick={() => setShowInStock(!showInStock)}>
          <div className="flex items-center">
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${showInStock ? 'bg-green-500 border-green-500' : 'border-gray-200 bg-white'}`}>
                {showInStock && <Check size={12} strokeWidth={4} className="text-white" />}
            </div>
            <div className="ml-4">
                <span className={`block text-[10px] uppercase tracking-[0.2em] transition-colors font-black ${showInStock ? 'text-gray-900' : 'text-gray-400'}`}>
                    Available Now
                </span>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};

export default function AllProductsPage() {
  const { products: allProducts, categories: appCategories, fetchProducts } = useAppContext();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [isLoading, setIsLoading] = useState(true);
  const [gridCols, setGridCols] = useState(4);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showInStock, setShowInStock] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(16);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const { scrollY } = useScroll();
  const springScroll = useSpring(scrollY, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const category = searchParams.get('category');
    if (category) setSelectedCategories([category]);
  }, [searchParams]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        await fetchProducts();
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [fetchProducts]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(appCategories.map(cat => cat.name.toLowerCase()));
    return Array.from(uniqueCategories).sort();
  }, [appCategories]);

  const brands = useMemo(() => {
    const uniqueBrands = new Set(allProducts.map(prod => prod.brand).filter(Boolean));
    return Array.from(uniqueBrands).sort();
  }, [allProducts]);

  const maxPrice = useMemo(() => {
    if (allProducts.length === 0) return 1000;
    return Math.ceil(Math.max(...allProducts.map(p => p.price)));
  }, [allProducts]);
  
  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceRange([0, maxPrice]);
    setShowInStock(false);
  }

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...allProducts];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        (product.brand && product.brand.toLowerCase().includes(term))
      );
    }
    
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product =>
        product.categoryNames && selectedCategories.some(cat => product.categoryNames.toLowerCase().includes(cat.toLowerCase()))
      );
    }

    if (selectedBrands.length > 0) {
      filtered = filtered.filter(product => selectedBrands.includes(product.brand));
    }

    filtered = filtered.filter(product => product.price >= priceRange[0] && product.price <= priceRange[1]);

    if (showInStock) {
      filtered = filtered.filter(product => product.stock_quantity > 0);
    }

    switch (sortBy) {
      case 'price-low': filtered.sort((a, b) => a.price - b.price); break;
      case 'price-high': filtered.sort((a, b) => b.price - a.price); break;
      case 'rating': filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)); break;
      case 'newest': filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      default: filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }
    return filtered;
  }, [searchTerm, selectedCategories, selectedBrands, priceRange, showInStock, sortBy, allProducts]);

  const displayedProducts = filteredAndSortedProducts.slice(0, visibleCount);
  const loadMore = () => setVisibleCount(prev => prev + 12);

  const activeFiltersCount = selectedCategories.length + selectedBrands.length + (showInStock ? 1 : 0);

  return (
    <div className="bg-[#fff0f8] min-h-screen font-sans text-gray-900 pb-40 overflow-x-hidden relative">
      
      {/* Subtle Boutique Aura */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-brand-pink/[0.02] to-transparent"></div>
      </div>

      {/* Tactile Paper Grain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply"></div>

      <StoreHeader title="Store." />
      <StoreCategoryNav />

      {/* ── The Naya Lumière Difference ── */}
      <section className="w-full pt-8 pb-10 bg-transparent border-b border-gray-100/60 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply" />
        <div className="max-w-[1400px] mx-auto">
          {/* Section header — matches "Curated Universes" style */}
          <div className="px-6 md:px-10 mb-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <span className="w-8 h-px bg-brand-pink/30" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink">Our Promise</span>
              <span className="w-8 h-px bg-brand-pink/30" />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif italic text-gray-900">
              The Naya Lumière{' '}
              <span className="font-sans not-italic font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500">difference.</span>
            </h2>
            <p className="text-[13px] text-gray-400 font-medium">Even more reasons to shop with us.</p>
          </div>

          {/* Horizontally scrollable card rail */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar pl-6 md:pl-10 pr-6 md:pr-10 pb-3" style={{ scrollSnapType: 'x mandatory' }}>

            {/* Card 1 — Seasonal Offer */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0, duration: 0.45 }}
              className="flex-shrink-0 w-[260px] md:w-[280px] h-[350px] rounded-[2rem] overflow-hidden bg-white border border-gray-100 transition-all duration-500 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] hover:border-brand-pink/20 flex flex-col group"
              style={{ scrollSnapAlign: 'start' }}
            >
              {/* Inner image zone — 75% */}
              <div className="relative mx-4 mt-4 rounded-[1.5rem] overflow-hidden flex-[3] flex items-center justify-center"
                style={{ background: 'radial-gradient(ellipse at 60% 30%, #7c3aed 0%, #4c1d95 40%, #1c0050 90%)' }}>
                {[...Array(16)].map((_, i) => (
                  <div key={i} className="absolute rounded-full bg-white"
                    style={{ width: i%3===0?'2px':'1px', height: i%3===0?'2px':'1px', top:`${8+(i*19)%80}%`, left:`${4+(i*27)%90}%`, opacity: 0.35+(i%4)*0.15 }} />
                ))}
                <div className="relative z-10 w-36 h-[84px] rounded-[14px] shadow-2xl flex flex-col justify-between p-3.5 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #5b21b6 100%)' }}>
                  <div className="absolute inset-0 opacity-15" style={{ background: 'radial-gradient(circle at 70% 15%, #fff 0%, transparent 55%)' }} />
                  <div className="flex justify-between items-start">
                    <div className="w-6 h-4 rounded bg-yellow-300/80 shadow-sm" />
                    <CreditCard size={13} className="text-white/50" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-[7px] font-bold text-white/50 tracking-widest uppercase mb-0.5">Tabby</div>
                    <div className="text-[10px] font-bold text-white tracking-wider">•••• •••• •••• 4242</div>
                  </div>
                </div>
              </div>
              {/* Text zone — 25% */}
              <div className="flex flex-col items-center justify-center flex-1 px-5 py-3 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-pink mb-1">Seasonal Offer</p>
                <h3 className="text-[14px] font-serif italic text-gray-900 leading-snug group-hover:text-brand-pink transition-colors duration-300">
                  0% installment plan with Tabby.
                </h3>
                <div className="flex items-center gap-1.5 mt-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Great ways to pay</span>
                  <ArrowRight size={11} className="text-brand-pink" />
                </div>
              </div>
            </motion.div>

            {/* Card 2 — Curated For You */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.06, duration: 0.45 }}
              className="flex-shrink-0 w-[260px] md:w-[280px] h-[350px] rounded-[2rem] overflow-hidden bg-white border border-gray-100 transition-all duration-500 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] hover:border-brand-pink/20 flex flex-col group"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="relative mx-4 mt-4 rounded-[1.5rem] overflow-hidden flex-[3] flex items-end justify-center"
                style={{ background: 'linear-gradient(160deg, #9d174d 0%, #be185d 40%, #831843 100%)' }}>
                <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 30% 0%, #fff 0%, transparent 50%)' }} />
                <div className="relative z-10 mb-0 flex gap-2 items-end px-6">
                  {[
                    { bg: '#db2777', h: 'h-20', icon: <Droplets size={18} className="text-white/70" strokeWidth={1.5} /> },
                    { bg: '#be185d', h: 'h-28', icon: <Sparkles size={18} className="text-white/80" strokeWidth={1.5} /> },
                    { bg: '#9d174d', h: 'h-16', icon: <Heart size={18} className="text-white/70" strokeWidth={1.5} /> },
                  ].map((b, i) => (
                    <div key={i} className={`flex-1 ${b.h} rounded-t-2xl flex items-center justify-center shadow-lg`} style={{ backgroundColor: b.bg }}>
                      {b.icon}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 px-5 py-3 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-pink mb-1">Curated For You</p>
                <h3 className="text-[14px] font-serif italic text-gray-900 leading-snug group-hover:text-brand-pink transition-colors duration-300">
                  Customize your daily skincare routine.
                </h3>
                <div className="flex items-center gap-1.5 mt-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Explore</span>
                  <ArrowRight size={11} className="text-brand-pink" />
                </div>
              </div>
            </motion.div>

            {/* Card 3 — AI Specialist */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.12, duration: 0.45 }}
              className="flex-shrink-0 w-[260px] md:w-[280px] h-[350px] rounded-[2rem] overflow-hidden bg-white border border-gray-100 transition-all duration-500 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] hover:border-brand-pink/20 flex flex-col group"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="relative mx-4 mt-4 rounded-[1.5rem] overflow-hidden flex-[3] flex items-center justify-center"
                style={{ background: 'linear-gradient(160deg, #003566 0%, #001d3d 70%)' }}>
                <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 50% 40%, #0096c7 0%, transparent 60%)' }} />
                <div className="relative z-10 flex items-center justify-center">
                  <div className="absolute w-28 h-28 rounded-full border border-blue-400/20 animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="absolute w-18 h-18 rounded-full border border-blue-400/25" style={{ width: '4.5rem', height: '4.5rem' }} />
                  <div className="w-14 h-14 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center">
                    <Sparkles size={28} className="text-blue-300" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 px-5 py-3 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-pink mb-1">AI Specialist</p>
                <h3 className="text-[14px] font-serif italic text-gray-900 leading-snug group-hover:text-brand-pink transition-colors duration-300">
                  Skin diagnosis in seconds.
                </h3>
                <div className="flex items-center gap-1.5 mt-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Try AI Consultant</span>
                  <ArrowRight size={11} className="text-brand-pink" />
                </div>
              </div>
            </motion.div>

            {/* Card 4 — Loyalty Rewards */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.18, duration: 0.45 }}
              className="flex-shrink-0 w-[260px] md:w-[280px] h-[350px] rounded-[2rem] overflow-hidden bg-white border border-gray-100 transition-all duration-500 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] hover:border-brand-pink/20 flex flex-col group"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="relative mx-4 mt-4 rounded-[1.5rem] overflow-hidden flex-[3] flex items-center justify-center"
                style={{ background: 'linear-gradient(155deg, #92400e 0%, #b45309 50%, #78350f 100%)' }}>
                <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 20% 10%, #fde68a 0%, transparent 50%)' }} />
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <Star size={56} className="text-yellow-300 fill-yellow-300 drop-shadow-lg" strokeWidth={1} />
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className="text-yellow-300/80 fill-yellow-300/80" strokeWidth={1} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 px-5 py-3 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-pink mb-1">Loyalty Rewards</p>
                <h3 className="text-[14px] font-serif italic text-gray-900 leading-snug group-hover:text-brand-pink transition-colors duration-300">
                  Earn Naya Points with every purchase.
                </h3>
                <div className="flex items-center gap-1.5 mt-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Redeem for rewards</span>
                  <ArrowRight size={11} className="text-brand-pink" />
                </div>
              </div>
            </motion.div>

            {/* Card 5 — Art of Gifting */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.24, duration: 0.45 }}
              className="flex-shrink-0 w-[260px] md:w-[280px] h-[350px] rounded-[2rem] overflow-hidden bg-white border border-gray-100 transition-all duration-500 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] hover:border-brand-pink/20 flex flex-col group"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="relative mx-4 mt-4 rounded-[1.5rem] overflow-hidden flex-[3] flex items-center justify-center"
                style={{ background: 'linear-gradient(150deg, #064e3b 0%, #065f46 50%, #047857 100%)' }}>
                <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 80% 10%, #6ee7b7 0%, transparent 50%)' }} />
                <div className="relative z-10">
                  <div className="relative w-24 h-20 rounded-xl bg-emerald-400 shadow-2xl flex items-center justify-center">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-4 rounded-lg bg-emerald-300" />
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[3px] bg-emerald-300" />
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex gap-1">
                      <div className="w-5 h-5 rounded-full border-[2.5px] border-emerald-300 -rotate-12" />
                      <div className="w-5 h-5 rounded-full border-[2.5px] border-emerald-300 rotate-12" />
                    </div>
                    <Gift size={24} className="text-white mt-2" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 px-5 py-3 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-pink mb-1">The Art of Gifting</p>
                <h3 className="text-[14px] font-serif italic text-gray-900 leading-snug group-hover:text-brand-pink transition-colors duration-300">
                  Luxury gifts are in the cards.
                </h3>
                <div className="flex items-center gap-1.5 mt-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Shop gift sets</span>
                  <ArrowRight size={11} className="text-brand-pink" />
                </div>
              </div>
            </motion.div>

            {/* Card 6 — Your Ritual */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.30, duration: 0.45 }}
              className="flex-shrink-0 w-[260px] md:w-[280px] h-[350px] rounded-[2rem] overflow-hidden bg-white border border-gray-100 transition-all duration-500 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] hover:border-brand-pink/20 flex flex-col group"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="relative mx-4 mt-4 rounded-[1.5rem] overflow-hidden flex-[3] flex items-center justify-center"
                style={{ background: 'linear-gradient(150deg, #4c1d95 0%, #5b21b6 50%, #3b0764 100%)' }}>
                <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 20% 80%, #c4b5fd 0%, transparent 50%)' }} />
                <div className="relative z-10 flex items-end gap-3">
                  <div className="w-9 h-20 rounded-full bg-violet-400/80 shadow-lg flex items-center justify-center">
                    <Droplets size={16} className="text-white/80" strokeWidth={1.5} />
                  </div>
                  <div className="w-11 h-28 rounded-[1.5rem] bg-violet-500/90 shadow-xl flex items-center justify-center">
                    <Droplets size={20} className="text-white/90" strokeWidth={1.5} />
                  </div>
                  <div className="w-9 h-16 rounded-full bg-violet-300/80 shadow-lg flex items-center justify-center">
                    <Droplets size={14} className="text-white/80" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 px-5 py-3 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-pink mb-1">Your Ritual</p>
                <h3 className="text-[14px] font-serif italic text-gray-900 leading-snug group-hover:text-brand-pink transition-colors duration-300">
                  Master your new skincare ritual.
                </h3>
                <div className="flex items-center gap-1.5 mt-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Discover the routine</span>
                  <ArrowRight size={11} className="text-brand-pink" />
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
      {/* ── End Difference Section ── */}

      <div className="container mx-auto px-4 md:px-10 relative z-30 pt-4">
        <div className="flex justify-end mb-6">
            <button 
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-full text-[12px] font-bold tracking-tight hover:bg-brand-pink transition-all duration-500 shadow-sm active:scale-95 group"
            >
                <span>Refine</span>
                <Filter size={14} className="group-hover:rotate-12 transition-transform text-white" />
            </button>
        </div>
        <main className="w-full">
            {isLoading ? (
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${gridCols} gap-4 md:gap-6`}>
                {Array.from({ length: 12 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-40 bg-white rounded-[2.5rem] border border-gray-200 shadow-sm relative overflow-hidden"
              >
                <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-gray-100 shadow-inner">
                  <Search size={28} strokeWidth={1.5} className="text-gray-300" />
                </div>
                <h3 className="font-serif text-4xl text-gray-900 mb-6 italic">Selection Not Found</h3>
                <button 
                  onClick={clearFilters} 
                  className="px-12 py-4 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-pink transition-all active:scale-95 shadow-lg"
                >
                  Reset Parameters
                </button>
              </motion.div>
            ) : (
              <div className="space-y-16">
                <motion.div 
                    layout
                    className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${gridCols} gap-x-3 md:gap-x-4 gap-y-6 md:gap-y-10`}
                >
                    <AnimatePresence mode='popLayout'>
                        {displayedProducts.map((product, index) => (
                        <motion.div 
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.5, delay: (index % 12) * 0.03, ease: "easeOut" }}
                            key={product.id} 
                        >
                            <ProductCard
                            id={product.id}
                            name={product.name}
                            price={product.price}
                            originalPrice={product.comparedprice}
                            image={product.imageUrl}
                            averageRating={product.averageRating}
                            reviewCount={product.reviewCount}
                            isNew={product.isNew}
                            isBestseller={product.isBestseller}
                            brandName={product.brand}
                            stock_quantity={product.stock_quantity}
                            />
                        </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {/* Load More */}
                {visibleCount < filteredAndSortedProducts.length && (
                    <div className="flex flex-col items-center gap-5 pt-10 pb-6 border-t border-gray-100">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-48 h-0.5 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(displayedProducts.length / filteredAndSortedProducts.length) * 100}%` }}
                                    className="h-full bg-brand-pink/40 rounded-full"
                                />
                            </div>
                            <span className="text-[9px] uppercase tracking-[0.3em] text-gray-400 font-medium">
                                {displayedProducts.length} of {filteredAndSortedProducts.length}
                            </span>
                        </div>
                        <button
                            onClick={loadMore}
                            className="group flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-full text-[11px] font-bold tracking-tight hover:bg-brand-pink transition-all duration-500 shadow-sm active:scale-95"
                        >
                            Show more
                            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                )}
              </div>
            )}
        </main>
      </div>

      {/* Advanced Filter Drawer */}
      <AnimatePresence>
        {isFilterOpen && (
            <div className="fixed inset-0 z-[100]">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md" 
                onClick={() => setIsFilterOpen(false)}
            ></motion.div>
            <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: "spring", damping: 35, stiffness: 300 }}
                className="absolute right-0 top-0 bottom-0 w-[90%] max-w-sm bg-[#fff0f8] shadow-2xl overflow-y-auto rounded-l-[3.5rem] border-l border-gray-300 flex flex-col"
            >
                {/* Drawer Header */}
                <div className="p-10 border-b border-gray-200 bg-white/50 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-4xl font-serif italic text-gray-900 tracking-tighter leading-none">Refine</h2>
                            <p className="text-[9px] uppercase tracking-[0.4em] text-brand-pink font-black mt-3">Selection Criteria</p>
                        </div>
                        <button onClick={() => setIsFilterOpen(false)} className="w-12 h-12 bg-white text-gray-900 rounded-2xl shadow-lg hover:rotate-90 transition-all border border-gray-200 flex items-center justify-center">
                            <X size={20} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>
                
                <div className="p-10 flex-grow relative">
                     {/* Sidebar Texture */}
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
                    
                    <div className="relative z-10">
                        <SidebarFilters 
                        categories={categories}
                        brands={brands}
                        selectedCategories={selectedCategories}
                        setSelectedCategories={setSelectedCategories}
                        selectedBrands={selectedBrands}
                        setSelectedBrands={setSelectedBrands}
                        priceRange={priceRange}
                        setPriceRange={setPriceRange}
                        showInStock={showInStock}
                        setShowInStock={setShowInStock}
                        maxPrice={maxPrice}
                        clearFilters={clearFilters}
                        allProducts={allProducts}
                        />
                    </div>
                </div>
                
                <div className="p-10 pt-6 pb-12 sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-gray-100">
                    <button 
                        onClick={() => setIsFilterOpen(false)}
                        className="w-full bg-gray-900 text-white py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-brand-pink transition-all active:scale-95 duration-300"
                    >
                        Reveal Selection ({filteredAndSortedProducts.length})
                    </button>
                </div>
            </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}