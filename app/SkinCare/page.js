'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import StoreHeader from '../components/StoreHeader';
import StoreCategoryNav from '../components/StoreCategoryNav';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Droplets, Leaf, Award, Sparkles, Filter, ArrowRight, X, Search, Hash, Check, Minus, Plus as PlusIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '../components/ui/slider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';

const SidebarFilters = ({
  brands,
  selectedBrands,
  setSelectedBrands,
  concerns,
  selectedConcerns,
  setSelectedConcerns,
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
      if (p.brandName || p.brand) {
        const b = p.brandName || p.brand;
        counts[b] = (counts[b] || 0) + 1;
      }
    });
    return counts;
  }, [allProducts]);

  const concernCounts = useMemo(() => {
    const counts = {};
    allProducts.forEach(p => {
      if (p.concern_ids && Array.isArray(p.concern_ids)) {
        p.concern_ids.forEach(cid => {
            counts[cid] = (counts[cid] || 0) + 1;
        });
      }
    });
    return counts;
  }, [allProducts]);

  const displayedBrands = showAllBrands ? brands : brands.slice(0, 8);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between pb-6 border-b border-gray-100">
        <h2 className="text-[11px] tracking-[0.4em] font-black text-gray-900">Selection</h2>
        <button onClick={clearFilters} className="text-[9px] tracking-widest text-brand-pink hover:text-gray-900 transition-all font-black border-b border-brand-pink/20">Reset</button>
      </div>

      <Accordion type="multiple" defaultValue={['brand', 'price', 'concern']} className="w-full">
        {concerns && concerns.length > 0 && (
          <AccordionItem value="concern" className="border-b border-gray-50 mb-2">
            <AccordionTrigger className="hover:no-underline py-5 text-[10px] tracking-[0.3em] font-black text-gray-900 flex-1 text-left">Ritual Focus</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-1 pb-4 pr-2">
                {concerns.map((con) => (
                  <div key={con.id} className="flex items-center justify-between group/item cursor-pointer" onClick={() => {
                      const next = selectedConcerns.includes(con.id) ? selectedConcerns.filter((id) => id !== con.id) : [...selectedConcerns, con.id];
                      setSelectedConcerns(next);
                  }}>
                    <div className="flex items-center">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedConcerns.includes(con.id) ? 'bg-brand-pink border-brand-pink' : 'border-gray-200 bg-white'}`}>
                            {selectedConcerns.includes(con.id) && <Check size={10} className="text-white" strokeWidth={4} />}
                        </div>
                        <span className={`ml-3 text-[12px] tracking-widest transition-colors ${selectedConcerns.includes(con.id) ? 'text-gray-900 font-bold' : 'text-gray-500 group-hover/item:text-gray-900'}`}>{con.name}</span>
                    </div>
                    <span className="text-[9px] font-black text-gray-200 group-hover/item:text-brand-pink">{concernCounts[con.id] || 0}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="brand" className="border-b border-gray-50 mb-2">
          <AccordionTrigger className="hover:no-underline py-5 text-[10px] tracking-[0.3em] font-black text-gray-900 flex-1 text-left">Designers</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-1 pb-4 pr-2">
              {displayedBrands.map((brand) => (
                <div key={brand} className="flex items-center justify-between group/item cursor-pointer" onClick={() => {
                    const next = selectedBrands.includes(brand) ? selectedBrands.filter((b) => b !== brand) : [...selectedBrands, brand];
                    setSelectedBrands(next);
                }}>
                  <div className="flex items-center">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedBrands.includes(brand) ? 'bg-gray-900 border-gray-900' : 'border-gray-200 bg-white'}`}>
                          {selectedBrands.includes(brand) && <Check size={10} className="text-white" strokeWidth={4} />}
                      </div>
                      <span className={`ml-3 text-[12px] tracking-widest transition-colors ${selectedBrands.includes(brand) ? 'text-gray-900 font-bold' : 'text-gray-500 group-hover/item:text-gray-900'}`}>{brand}</span>
                  </div>
                  <span className="text-[9px] font-black text-gray-200 group-hover/item:text-brand-pink">{brandCounts[brand] || 0}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price" className="border-none mb-2">
          <AccordionTrigger className="hover:no-underline py-5 text-[10px] tracking-[0.3em] font-black text-gray-900">Investment</AccordionTrigger>
          <AccordionContent>
            <div className="pt-6 px-2 pb-4">
              <Slider defaultValue={priceRange} max={maxPrice} step={10} onValueChange={setLocalPriceRange} className="mb-8" />
              <div className="flex justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col"><span className="text-[7px] text-gray-400 font-black tracking-[0.2em]">Min</span><span className="text-[11px] font-black">AED {localPriceRange[0]}</span></div>
                <div className="flex flex-col items-end"><span className="text-[7px] text-gray-400 font-black tracking-[0.2em]">Max</span><span className="text-[11px] font-black">AED {localPriceRange[1]}</span></div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

const skincareBenefits = [
  { icon: Droplets, title: 'Deep Hydration', description: 'Advanced formulas that penetrate deep for lasting moisture.', color: 'text-blue-400' },
  { icon: Leaf, title: 'Natural Integrity', description: 'Sustainably sourced botanicals and organic extracts.', color: 'text-green-400' },
  { icon: Award, title: 'Clinically Proven', description: 'Dermatologist-tested and scientifically validated results.', color: 'text-amber-400' },
  { icon: Sparkles, title: 'Visible Radiance', description: 'Noticeable improvements in texture, tone, and luminosity.', color: 'text-brand-pink' }
];

export default function SkincarePage() {
  const { products: allProducts, concerns, categories, fetchProducts } = useAppContext();
  const [gridCols, setGridCols] = useState(4);
  const [sortBy, setSortBy] = useState('featured');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedConcerns, setSelectedConcerns] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [showInStock, setShowInStock] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchProducts();
      setIsLoading(false);
    };
    load();
  }, [fetchProducts]);

  const skincareProducts = useMemo(() => {
    return allProducts.filter(p => 
      p.categoryNames && (
        p.categoryNames.toLowerCase().includes('skincare') ||
        p.categoryNames.toLowerCase().includes('face') ||
        p.categoryNames.toLowerCase().includes('serum') ||
        p.categoryNames.toLowerCase().includes('moisturizer') ||
        p.categoryNames.toLowerCase().includes('cleanser') ||
        p.categoryNames.toLowerCase().includes('mask')
      )
    );
  }, [allProducts]);

  const brands = useMemo(() => {
    const unique = new Set(skincareProducts.map(p => p.brandName || p.brand).filter(Boolean));
    return Array.from(unique).sort();
  }, [skincareProducts]);

  const maxPrice = useMemo(() => skincareProducts.length > 0 ? Math.ceil(Math.max(...skincareProducts.map(p => p.price))) : 2000, [skincareProducts]);

  const filteredProducts = useMemo(() => {
    let filtered = [...skincareProducts];
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(term) || (p.brandName && p.brandName.toLowerCase().includes(term)));
    }
    if (selectedBrands.length > 0) filtered = filtered.filter(p => selectedBrands.includes(p.brandName || p.brand));
    if (selectedConcerns.length > 0) filtered = filtered.filter(p => p.concern_ids && p.concern_ids.some(cid => selectedConcerns.includes(cid)));
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (showInStock) filtered = filtered.filter(p => p.stock_quantity > 0);

    switch (sortBy) {
        case 'price-low': filtered.sort((a, b) => a.price - b.price); break;
        case 'price-high': filtered.sort((a, b) => b.price - a.price); break;
        case 'rating': filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)); break;
        default: filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }
    return filtered;
  }, [skincareProducts, selectedBrands, selectedConcerns, priceRange, showInStock, sortBy, searchTerm]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedBrands([]);
    setSelectedConcerns([]);
    setPriceRange([0, maxPrice]);
    setShowInStock(false);
  };

  return (
    <div className="bg-[#FAF9F6] min-h-screen font-sans text-gray-900 pb-40 overflow-x-hidden relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply"></div>

      <StoreHeader title="Skincare." />
      <StoreCategoryNav />

      <section className="py-24 px-6 relative z-20 -mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {skincareBenefits.map((benefit, index) => (
              <motion.div key={index} className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-gray-100 shadow-xl flex flex-col items-center text-center space-y-5">
                <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 flex items-center justify-center"><benefit.icon className={`${benefit.color}`} size={28} /></div>
                <div className="space-y-2">
                  <h3 className="text-[16px] font-bold text-gray-900">{benefit.title}</h3>
                  <p className="text-[13px] text-gray-400 italic leading-relaxed">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="skincare-vault" className="py-16 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12 border-b border-gray-100 pb-10">
            <div className="space-y-3">
                <div className="flex items-center gap-3"><span className="w-10 h-px bg-brand-pink"></span><span className="text-[10px] font-black tracking-[0.4em] text-brand-pink">The Collection</span></div>
                <h2 className="text-4xl font-serif italic text-gray-900">Skincare Inventory</h2>
            </div>
            
            <div className="flex items-center gap-4">
                <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2 px-6 py-2 bg-white rounded-full text-[12px] font-bold border border-gray-200 hover:border-brand-pink transition-all">
                    <span>Refine</span> <Filter size={14} />
                </button>
                <div className="flex items-center bg-gray-50 p-1 rounded-xl">
                    {[3, 4].map((num) => (
                        <button key={num} onClick={() => setGridCols(num)} className={`w-8 h-8 flex items-center justify-center rounded-lg ${gridCols === num ? 'bg-white shadow-sm text-brand-pink' : 'text-gray-300'}`}><Hash size={14} /></button>
                    ))}
                </div>
            </div>
          </div>
          
          <div className={`grid grid-cols-2 lg:grid-cols-${gridCols} gap-x-6 gap-y-16`}>
            {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : filteredProducts.length === 0 ? (
                <div className="col-span-full py-40 text-center bg-white rounded-[3rem] border border-dashed border-gray-200"><p className="text-gray-400 font-serif italic text-2xl">Selection Empty...</p></div>
            ) : (
                filteredProducts.map((product) => <ProductCard key={product.id} {...product} image={product.imageUrl} imageUrls={product.additionalImagesData?.map(img => img.url) || []} />)
            )}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isFilterOpen && (
            <div className="fixed inset-0 z-[1000]">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsFilterOpen(false)} />
                <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-[#FAF9F6] shadow-2xl flex flex-col rounded-l-[3rem]">
                    <div className="p-10 border-b flex items-center justify-between">
                        <h2 className="text-4xl font-serif italic">Refine</h2>
                        <button onClick={() => setIsFilterOpen(false)} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center"><X size={20} /></button>
                    </div>
                    <div className="p-10 flex-grow overflow-y-auto">
                        <SidebarFilters 
                            brands={brands} selectedBrands={selectedBrands} setSelectedBrands={setSelectedBrands}
                            concerns={concerns} selectedConcerns={selectedConcerns} setSelectedConcerns={setSelectedConcerns}
                            priceRange={priceRange} setPriceRange={setPriceRange}
                            showInStock={showInStock} setShowInStock={setShowInStock}
                            maxPrice={maxPrice} clearFilters={clearFilters} allProducts={skincareProducts}
                        />
                    </div>
                    <div className="p-10 bg-white border-t">
                        <button onClick={() => setIsFilterOpen(false)} className="w-full bg-gray-900 text-white py-6 rounded-2xl font-black tracking-widest hover:bg-brand-pink transition-all">Reveal Selection ({filteredProducts.length})</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
