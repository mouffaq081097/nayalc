"use client";

import { useSearchParams, useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import ProductCard from '../../components/ProductCard';
import StoreHeader from '../../components/StoreHeader';
import StoreCategoryNav from '../../components/StoreCategoryNav';
import { Filter, Search, X, Check, ArrowRight, Minus, Plus as PlusIcon } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import ProductCardSkeleton from '../../components/ProductCardSkeleton';
import { Slider } from '../../components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion';

const SidebarFilters = ({
  brands,
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
            <h2 className="text-[11px] uppercase tracking-[0.4em] font-black text-gray-900">Selection</h2>
        </div>
        <button 
          onClick={clearFilters}
          className="text-[9px] uppercase tracking-widest text-brand-pink hover:text-gray-900 transition-all font-black border-b border-brand-pink/20 pb-0.5"
        >
          Reset
        </button>
      </div>

      <Accordion type="multiple" defaultValue={['brand', 'price']} className="w-full">
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

export default function CollectionClient() {
  const { categoryId } = useParams();
  const { products: allProducts, categories: appCategories, fetchProducts } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [isLoading, setIsLoading] = useState(true);
  const [gridCols, setGridCols] = useState(4);

  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showInStock, setShowInStock] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(16);

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

  const currentCategory = useMemo(() => {
    return appCategories.find(cat => cat.id.toString() === categoryId || cat.slug === categoryId);
  }, [appCategories, categoryId]);

  const categoryProducts = useMemo(() => {
    if (!currentCategory) return [];
    return allProducts.filter(product => 
      product.categoryNames && product.categoryNames.toLowerCase().includes(currentCategory.name.toLowerCase())
    );
  }, [allProducts, currentCategory]);

  const brands = useMemo(() => {
    const uniqueBrands = new Set(categoryProducts.map(prod => prod.brand).filter(Boolean));
    return Array.from(uniqueBrands).sort();
  }, [categoryProducts]);

  const maxPrice = useMemo(() => {
    if (categoryProducts.length === 0) return 1000;
    return Math.ceil(Math.max(...categoryProducts.map(p => p.price)));
  }, [categoryProducts]);
  
  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedBrands([]);
    setPriceRange([0, maxPrice]);
    setShowInStock(false);
  }

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...categoryProducts];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        (product.brand && product.brand.toLowerCase().includes(term))
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
  }, [searchTerm, selectedBrands, priceRange, showInStock, sortBy, categoryProducts]);

  const displayedProducts = filteredAndSortedProducts.slice(0, visibleCount);
  const loadMore = () => setVisibleCount(prev => prev + 12);

  return (
    <div className="bg-[#FAF9F6] min-h-screen font-sans text-gray-900 pb-40 overflow-x-hidden relative">
      {/* Subtle Boutique Aura */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-brand-pink/[0.02] to-transparent"></div>
      </div>

      {/* Tactile Paper Grain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply"></div>

      <StoreHeader title={currentCategory?.name || "Collection"} />
      <StoreCategoryNav />

      <div className="container mx-auto px-4 md:px-10 relative z-30 pt-4">
        <div className="flex justify-end mb-6">
            <button 
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-2 px-6 py-2 bg-transparent text-[#1d1d1f] rounded-full text-[12px] font-medium border border-gray-200 hover:border-brand-pink hover:text-brand-pink transition-all duration-300 active:scale-95 group"
            >
                <span>Refine</span>
                <Filter size={14} className="group-hover:rotate-12 transition-transform text-gray-400 group-hover:text-brand-pink" />
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
                    <div className="flex flex-col items-center gap-12 py-20 border-t border-gray-200">
                        <div className="flex flex-col items-center gap-5">
                            <span className="text-[9px] uppercase tracking-[0.5em] text-gray-400 font-black">Collection Progress</span>
                            <div className="w-72 h-1 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(displayedProducts.length / filteredAndSortedProducts.length) * 100}%` }}
                                    className="h-full bg-gradient-to-r from-brand-pink to-brand-blue shadow-[0_0_10px_rgba(255,105,180,0.5)]"
                                ></motion.div>
                            </div>
                        </div>
                        <button 
                            onClick={loadMore}
                            className="group flex items-center gap-8 px-16 py-6 bg-white border border-gray-300 text-gray-900 rounded-2xl shadow-xl hover:bg-gray-900 hover:text-white transition-all active:scale-95 duration-500"
                        >
                            <span className="text-[13px] font-black uppercase tracking-[0.4em]">Reveal Further</span>
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white/10 group-hover:text-white transition-all duration-500">
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </div>
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
                className="absolute right-0 top-0 bottom-0 w-[90%] max-w-sm bg-[#FAF9F6] shadow-2xl overflow-y-auto rounded-l-[3.5rem] border-l border-gray-300 flex flex-col"
            >
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
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
                    
                    <div className="relative z-10">
                        <SidebarFilters 
                        brands={brands}
                        selectedBrands={selectedBrands}
                        setSelectedBrands={setSelectedBrands}
                        priceRange={priceRange}
                        setPriceRange={setPriceRange}
                        showInStock={showInStock}
                        setShowInStock={setShowInStock}
                        maxPrice={maxPrice}
                        clearFilters={clearFilters}
                        allProducts={categoryProducts}
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
