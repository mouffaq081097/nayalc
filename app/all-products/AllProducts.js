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
  searchTerm,
  setSearchTerm
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
      {/* Search Input in Sidebar */}
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cl-purple/50 group-focus-within:text-cl-purple transition-colors">
          <Search size={16} />
        </div>
        <input 
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/60 border border-purple-100 rounded-2xl py-4 pl-12 pr-4 text-[13px] focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all placeholder:text-gray-300"
        />
      </div>

      <div className="flex items-center justify-between pb-6 border-b border-purple-100/50">
        <div>
            <h2 className="text-[12px] font-bold text-gray-900">Selection Filters</h2>
        </div>
        <button 
          onClick={clearFilters}
          className="text-[11px] text-cl-purple hover:underline"
        >
          Reset All
        </button>
      </div>

      <Accordion type="multiple" defaultValue={['category', 'brand', 'price']} className="w-full">
        <AccordionItem value="category" className="border-b border-purple-50 mb-2">
          <AccordionTrigger className="hover:no-underline py-5 text-[12px] font-bold text-gray-900">
            Collections
          </AccordionTrigger>
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
                    <div
                      className="w-5 h-5 rounded-lg border flex items-center justify-center transition-all"
                      style={selectedCategories.includes(category) ? { background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))', borderColor: 'transparent' } : { background: 'white', borderColor: '#f3e8ff' }}
                    >
                        {selectedCategories.includes(category) && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className={`ml-3 text-[13px] transition-colors ${selectedCategories.includes(category) ? 'text-cl-purple font-bold' : 'text-gray-500 group-hover/item:text-gray-900'}`}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-purple-200 group-hover/item:text-cl-purple transition-colors">
                    {categoryCounts[category] || 0}
                  </span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="brand" className="border-b border-purple-50 mb-2">
          <AccordionTrigger className="hover:no-underline py-5 text-[12px] font-bold text-gray-900">
            Designers
          </AccordionTrigger>
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
                    <div
                      className="w-5 h-5 rounded-lg border flex items-center justify-center transition-all"
                      style={selectedBrands.includes(brand) ? { background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))', borderColor: 'transparent' } : { background: 'white', borderColor: '#f3e8ff' }}
                    >
                        {selectedBrands.includes(brand) && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className={`ml-3 text-[13px] transition-colors ${selectedBrands.includes(brand) ? 'text-cl-purple font-bold' : 'text-gray-500 group-hover/item:text-gray-900'}`}>
                        {brand}
                    </span>
                </div>
                <span className="text-[11px] font-medium text-purple-200 group-hover/item:text-cl-purple transition-colors">
                    {brandCounts[brand] || 0}
                </span>
                </div>
              ))}
              
              {brands.length > 8 && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMoreBrands(!showAllBrands);
                    }}
                    className="text-[11px] font-bold text-cl-purple/60 hover:text-cl-purple transition-colors pt-4 flex items-center gap-2"
                >
                    {showAllBrands ? <Minus size={12} /> : <PlusIcon size={12} />}
                    {showAllBrands ? 'Condense' : `View All Designers (${brands.length})`}
                </button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price" className="border-none mb-2">
          <AccordionTrigger className="hover:no-underline py-5 text-[12px] font-bold text-gray-900">
            Investment Range
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
              <div className="flex justify-between items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-purple-100 shadow-sm">
                <div className="flex flex-col">
                    <span className="text-[9px] text-purple-300 font-bold mb-0.5">From</span>
                    <span className="text-[13px] font-bold text-gray-900">AED {localPriceRange[0]}</span>
                </div>
                <div className="h-8 w-px bg-purple-100"></div>
                <div className="flex flex-col items-end">
                    <span className="text-[9px] text-purple-300 font-bold mb-0.5">To</span>
                    <span className="text-[13px] font-bold text-gray-900">AED {localPriceRange[1]}</span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="pt-6 border-t border-purple-100/50">
        <label className="flex items-center justify-between group cursor-pointer bg-white/50 backdrop-blur-sm p-5 rounded-2xl border border-purple-100 shadow-sm transition-all hover:bg-purple-50/50" onClick={() => setShowInStock(!showInStock)}>
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${showInStock ? 'bg-green-500 border-green-500' : 'border-purple-100 bg-white'}`}>
                {showInStock && <Check size={14} strokeWidth={3} className="text-white" />}
            </div>
            <div className="ml-4">
                <span className={`block text-[13px] transition-colors font-bold ${showInStock ? 'text-gray-900' : 'text-gray-500'}`}>
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

  const { scrollY } = useScroll();

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
    if (maxPrice > 0) {
        setPriceRange([0, maxPrice]);
    }
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

  return (
    <div className="bg-transparent min-h-screen font-sans text-gray-900 pb-40 overflow-x-hidden relative">
      
      {/* Global aura orbs are inherited from LayoutContent.js */}

      <StoreHeader title="Store." />
      <StoreCategoryNav />

      {/* ── The Naya Lumière Difference ── */}
      <section className="w-full pt-8 pb-10 bg-transparent border-b border-purple-100/30 relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
          {/* Section header */}
          <div className="px-6 md:px-10 mb-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <span className="w-8 h-px bg-purple-200" />
              <span className="text-[11px] font-bold text-cl-purple">Our Promise</span>
              <span className="w-8 h-px bg-purple-200" />
            </div>
            <h2 className="text-3xl md:text-5xl font-serif italic text-cl-deep leading-tight">
              The Naya Lumière{' '}
              <span className="font-sans not-italic font-bold" style={{ backgroundImage: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>difference.</span>
            </h2>
            <p className="text-[14px] font-medium text-gray-500">Excellence in every formulation.</p>
          </div>

          {/* Elegant Centered Cards */}
          <div className="flex overflow-x-auto md:overflow-visible md:justify-center flex-nowrap gap-6 md:gap-8 px-6 md:px-10 pb-8 no-scrollbar snap-x snap-mandatory">
            {/* Card 1 — Tabby */}
            <motion.div
              initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex-shrink-0 w-[85vw] sm:w-[280px] md:w-1/3 max-w-[320px] rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-2 flex flex-col group relative p-8 snap-center"
              style={{ 
                background: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.7)',
                boxShadow: '0 10px 40px rgba(147,51,234,0.03)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-purple-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Floating Glass Tabby Card */}
              <div className="h-32 w-full flex items-center justify-center mb-6 relative">
                <div className="absolute w-24 h-24 bg-purple-200/40 rounded-full blur-[30px] group-hover:bg-purple-300/50 transition-colors" />
                <div className="relative z-10 w-36 h-24 rounded-2xl shadow-xl border border-white/40 flex flex-col justify-between p-4 overflow-hidden group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-500"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))', backdropFilter: 'blur(10px)' }}>
                  <div className="flex justify-between items-start">
                    <div className="w-7 h-4 rounded bg-[var(--cl-purple)]/20 flex items-center justify-center">
                        <div className="w-3 h-2 rounded-sm bg-[var(--cl-purple)]/40" />
                    </div>
                    <CreditCard size={14} style={{ color: 'var(--cl-purple)' }} />
                  </div>
                  <div>
                    <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tabby Pay Later</div>
                    <div className="text-[11px] font-mono font-bold text-gray-800">•••• 4242</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center relative z-10">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-3" style={{ color: 'var(--cl-purple)' }}>Flexible Payments</p>
                <h3 className="text-[18px] font-serif italic text-gray-900 leading-snug">
                  0% installment plan with Tabby.
                </h3>
              </div>
            </motion.div>

            {/* Card 2 — AI Specialist */}
            <motion.div
              initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex-shrink-0 w-[85vw] sm:w-[280px] md:w-1/3 max-w-[320px] rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-2 flex flex-col group relative p-8 snap-center"
              style={{ 
                background: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.7)',
                boxShadow: '0 10px 40px rgba(147,51,234,0.03)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Glowing Orb */}
              <div className="h-32 w-full flex items-center justify-center mb-6 relative">
                <div className="absolute w-24 h-24 bg-blue-200/40 rounded-full blur-[30px] group-hover:bg-blue-300/50 transition-colors" />
                <div className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center border border-white/50 shadow-lg group-hover:scale-110 transition-transform duration-500"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.4))', backdropFilter: 'blur(10px)' }}>
                    <Sparkles size={28} className="text-blue-500" strokeWidth={1.5} />
                    <div className="absolute top-0 right-0 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-70" />
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center relative z-10">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-blue-500 mb-3">AI Consultant</p>
                <h3 className="text-[18px] font-serif italic text-gray-900 leading-snug">
                  Precision skin diagnosis in seconds.
                </h3>
              </div>
            </motion.div>

            {/* Card 3 — Loyalty */}
            <motion.div
              initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex-shrink-0 w-[85vw] sm:w-[280px] md:w-1/3 max-w-[320px] rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-2 flex flex-col group relative p-8 snap-center"
              style={{ 
                background: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.7)',
                boxShadow: '0 10px 40px rgba(147,51,234,0.03)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-amber-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Floating Star */}
              <div className="h-32 w-full flex items-center justify-center mb-6 relative">
                <div className="absolute w-24 h-24 bg-amber-200/40 rounded-full blur-[30px] group-hover:bg-amber-300/50 transition-colors" />
                <div className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center border border-white/50 shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.4))', backdropFilter: 'blur(10px)' }}>
                    <Star size={32} className="text-amber-500 fill-amber-400 drop-shadow-sm" strokeWidth={1.5} />
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center relative z-10">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-500 mb-3">Naya Rewards</p>
                <h3 className="text-[18px] font-serif italic text-gray-900 leading-snug">
                  Earn points with every selection.
                </h3>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-10 relative z-30 pt-10">
        
        {/* Modern Action Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <h1 className="text-4xl font-serif italic text-cl-deep">Library</h1>
                <span className="h-8 w-px bg-purple-100 hidden md:block" />
                <p className="text-[13px] font-medium text-gray-400 hidden md:block">
                    {filteredAndSortedProducts.length} Results
                </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-200 group-focus-within:text-cl-purple transition-colors" size={16} />
                    <input 
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/80 border border-purple-50 rounded-2xl py-3 pl-11 pr-4 text-[13px] focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all shadow-sm"
                    />
                </div>

                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-36 h-[46px] bg-white/80 border-purple-50 rounded-2xl text-[12px] font-bold focus:ring-purple-100">
                        <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-purple-50">
                        <SelectItem value="featured" className="text-[12px] font-medium">Featured</SelectItem>
                        <SelectItem value="newest" className="text-[12px] font-medium">Newest</SelectItem>
                        <SelectItem value="price-low" className="text-[12px] font-medium">Price: Low to High</SelectItem>
                        <SelectItem value="price-high" className="text-[12px] font-medium">Price: High to Low</SelectItem>
                        <SelectItem value="rating" className="text-[12px] font-medium">Highest Rated</SelectItem>
                    </SelectContent>
                </Select>

                <button 
                    onClick={() => setIsFilterOpen(true)}
                    className="flex items-center gap-2 px-6 h-[46px] text-white rounded-2xl text-[12px] font-bold active:scale-95 group transition-all duration-500 shadow-md"
                    style={{ background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))' }}
                >
                    <Filter size={14} className="group-hover:rotate-12 transition-transform" />
                    <span>Filter</span>
                    {selectedCategories.length + selectedBrands.length > 0 && (
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                            {selectedCategories.length + selectedBrands.length}
                        </span>
                    )}
                </button>
            </div>
        </div>

        <main className="w-full">
            {isLoading ? (
              <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-${gridCols} gap-2 md:gap-4`}>
                {Array.from({ length: 12 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-40 bg-white/60 backdrop-blur-md rounded-[3rem] border border-purple-100 shadow-sm relative overflow-hidden"
              >
                <div className="w-20 h-20 bg-purple-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8">
                  <Search size={28} className="text-purple-200" />
                </div>
                <h3 className="font-serif text-4xl text-gray-900 mb-4 italic">No matches found</h3>
                <p className="text-gray-400 mb-8 max-w-xs mx-auto text-[14px]">Try adjusting your filters or search terms to find what you're looking for.</p>
                <button 
                  onClick={clearFilters}
                  className="px-10 py-4 text-white rounded-2xl text-[11px] font-bold transition-all active:scale-95 shadow-lg shadow-purple-200"
                  style={{ background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))' }}
                >
                  Clear All Filters
                </button>
              </motion.div>
            ) : (
              <div className="space-y-16">
                <motion.div 
                    layout
                    className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${gridCols} gap-x-4 md:gap-x-3 gap-y-10 md:gap-y-14`}
                >
                    <AnimatePresence mode='popLayout'>
                        {displayedProducts.map((product, index) => (
                        <motion.div 
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.5, delay: (index % 12) * 0.03 }}
                            key={product.id} 
                            className="h-full flex flex-col"
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
                    <div className="flex flex-col items-center gap-6 pt-12 pb-6 border-t border-purple-50">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-56 h-1.5 bg-purple-50 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(displayedProducts.length / filteredAndSortedProducts.length) * 100}%` }}
                                    className="h-full rounded-full"
                                    style={{ background: 'linear-gradient(90deg, rgb(196,167,254), rgb(126,105,230))' }}
                                />
                            </div>
                            <span className="text-[11px] text-gray-400 font-bold">
                                Viewed {displayedProducts.length} of {filteredAndSortedProducts.length}
                            </span>
                        </div>
                        <button
                            onClick={loadMore}
                            className="group flex items-center gap-2 px-8 py-4 text-white rounded-2xl text-[12px] font-bold active:scale-95 transition-all duration-500 shadow-md hover:shadow-xl shadow-purple-100"
                            style={{ background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))' }}
                        >
                            View More Products
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
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
                className="absolute inset-0 bg-cl-deep/20 backdrop-blur-sm" 
                onClick={() => setIsFilterOpen(false)}
            ></motion.div>
            <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="absolute right-0 top-0 bottom-0 w-[90%] max-w-sm bg-white shadow-2xl overflow-hidden rounded-l-[2.5rem] border-l border-purple-50 flex flex-col"
            >
                {/* Drawer Header */}
                <div className="p-8 border-b border-purple-50 bg-white/80 backdrop-blur-md flex-shrink-0 z-20">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-serif italic text-cl-deep">Refine</h2>
                            <p className="text-[11px] font-bold text-gray-400 mt-1">Filters</p>
                        </div>
                        <button onClick={() => setIsFilterOpen(false)} className="w-10 h-10 bg-purple-50 text-cl-deep rounded-xl flex items-center justify-center hover:bg-purple-100 transition-all">
                            <X size={18} />
                        </button>
                    </div>
                </div>
                
                <div className="p-8 flex-1 overflow-y-auto z-10 relative custom-scrollbar">
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
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                    />
                </div>
                
                <div className="p-8 pt-4 pb-10 bg-white/90 backdrop-blur-md border-t border-purple-50 flex-shrink-0 z-20">
                    <button 
                        onClick={() => setIsFilterOpen(false)}
                        className="w-full py-5 rounded-2xl text-[12px] font-bold text-white shadow-lg active:scale-95 transition-all"
                        style={{ background: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))' }}
                    >
                        Apply Filters ({filteredAndSortedProducts.length})
                    </button>
                </div>
            </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}