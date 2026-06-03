"use client";

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import ProductCard from '../components/ProductCard';
import Link from 'next/link';
import { Search, X, Filter, Check, ArrowRight, Minus, Plus as PlusIcon, Grid2X2, List } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import { Slider } from '../components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';

/* ─── Sidebar Filters ─────────────────────────────────────────── */
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
  const [showAllBrands, setShowAllBrands] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => setPriceRange(localPriceRange), 500);
    return () => clearTimeout(handler);
  }, [localPriceRange, setPriceRange]);

  const categoryCounts = useMemo(() => {
    const c = {};
    allProducts.forEach(p => {
      if (p.categoryNames)
        p.categoryNames.split(',').forEach(cat => {
          const k = cat.trim().toLowerCase();
          c[k] = (c[k] || 0) + 1;
        });
    });
    return c;
  }, [allProducts]);

  const brandCounts = useMemo(() => {
    const c = {};
    allProducts.forEach(p => { if (p.brand) c[p.brand] = (c[p.brand] || 0) + 1; });
    return c;
  }, [allProducts]);

  const displayedBrands = showAllBrands ? brands : brands.slice(0, 8);

  const itemRow = "flex items-center justify-between py-[7px] cursor-pointer group/item";
  const checkBox = (active) =>
    `w-[15px] h-[15px] rounded-[3px] border flex items-center justify-center transition-all flex-shrink-0 ${
      active ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white'
    }`;
  const itemText = (active) =>
    `ml-2.5 text-[12px] tracking-wide transition-colors ${
      active ? 'text-gray-900 font-semibold' : 'text-gray-500 group-hover/item:text-gray-900'
    }`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between pb-5 mb-5 border-b border-gray-100">
        <span className="text-[11px] uppercase tracking-[0.25em] font-bold text-gray-900">Filters</span>
        <button
          onClick={clearFilters}
          className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors font-medium"
        >
          Clear all
        </button>
      </div>

      <Accordion type="multiple" defaultValue={['category', 'brand', 'price']} className="w-full">

        {/* Collections */}
        <AccordionItem value="category" className="border-b border-gray-100">
          <AccordionTrigger className="hover:no-underline py-4 text-[10px] uppercase tracking-[0.25em] font-bold text-gray-900 flex-1 text-left">
            Collections
          </AccordionTrigger>
          <AccordionContent>
            <div className="pb-5">
              {categories.map(category => (
                <div
                  key={category}
                  className={itemRow}
                  onClick={() => {
                    const next = selectedCategories.includes(category)
                      ? selectedCategories.filter(c => c !== category)
                      : [...selectedCategories, category];
                    setSelectedCategories(next);
                  }}
                >
                  <div className="flex items-center">
                    <div className={checkBox(selectedCategories.includes(category))}>
                      {selectedCategories.includes(category) && <Check size={9} className="text-white" strokeWidth={3.5} />}
                    </div>
                    <span className={itemText(selectedCategories.includes(category))}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-300 group-hover/item:text-gray-500 transition-colors font-medium">
                    {categoryCounts[category] || 0}
                  </span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Brand */}
        <AccordionItem value="brand" className="border-b border-gray-100">
          <AccordionTrigger className="hover:no-underline py-4 text-[10px] uppercase tracking-[0.25em] font-bold text-gray-900 flex-1 text-left">
            Brand
          </AccordionTrigger>
          <AccordionContent>
            <div className="pb-5">
              {displayedBrands.map(brand => (
                <div
                  key={brand}
                  className={itemRow}
                  onClick={() => {
                    const next = selectedBrands.includes(brand)
                      ? selectedBrands.filter(b => b !== brand)
                      : [...selectedBrands, brand];
                    setSelectedBrands(next);
                  }}
                >
                  <div className="flex items-center">
                    <div className={checkBox(selectedBrands.includes(brand))}>
                      {selectedBrands.includes(brand) && <Check size={9} className="text-white" strokeWidth={3.5} />}
                    </div>
                    <span className={itemText(selectedBrands.includes(brand))}>{brand}</span>
                  </div>
                  <span className="text-[10px] text-gray-300 group-hover/item:text-gray-500 transition-colors font-medium">
                    {brandCounts[brand] || 0}
                  </span>
                </div>
              ))}
              {brands.length > 8 && (
                <button
                  onClick={() => setShowAllBrands(!showAllBrands)}
                  className="mt-2 text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors font-medium flex items-center gap-1.5"
                >
                  {showAllBrands ? <Minus size={10} /> : <PlusIcon size={10} />}
                  {showAllBrands ? 'Show less' : `View all (${brands.length})`}
                </button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price */}
        <AccordionItem value="price" className="border-b border-gray-100">
          <AccordionTrigger className="hover:no-underline py-4 text-[10px] uppercase tracking-[0.25em] font-bold text-gray-900">
            Price (AED)
          </AccordionTrigger>
          <AccordionContent>
            <div className="pb-5 pt-2 px-1">
              <Slider
                defaultValue={priceRange}
                max={maxPrice}
                step={10}
                onValueChange={setLocalPriceRange}
                className="mb-5"
              />
              <div className="flex items-center gap-2">
                <div className="flex-1 border border-gray-200 rounded-[8px] px-3 py-2">
                  <div className="text-[8px] uppercase tracking-widest text-gray-400 font-semibold mb-0.5">Min</div>
                  <div className="text-[12px] font-semibold text-gray-900">AED {localPriceRange[0]}</div>
                </div>
                <span className="text-gray-300 text-sm">—</span>
                <div className="flex-1 border border-gray-200 rounded-[8px] px-3 py-2">
                  <div className="text-[8px] uppercase tracking-widest text-gray-400 font-semibold mb-0.5">Max</div>
                  <div className="text-[12px] font-semibold text-gray-900">AED {localPriceRange[1]}</div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Availability */}
        <AccordionItem value="stock" className="border-none">
          <AccordionTrigger className="hover:no-underline py-4 text-[10px] uppercase tracking-[0.25em] font-bold text-gray-900">
            Availability
          </AccordionTrigger>
          <AccordionContent>
            <div className="pb-5">
              <div className={itemRow} onClick={() => setShowInStock(!showInStock)}>
                <div className="flex items-center">
                  <div className={checkBox(showInStock)}>
                    {showInStock && <Check size={9} className="text-white" strokeWidth={3.5} />}
                  </div>
                  <span className={itemText(showInStock)}>In stock only</span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
};

/* ─── Main Page ───────────────────────────────────────────────── */
export default function AllProductsPage() {
  const { products: allProducts, categories: appCategories, fetchProducts } = useAppContext();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showInStock, setShowInStock] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(18);

  useEffect(() => {
    const category = searchParams.get('category');
    if (category) setSelectedCategories([category]);
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      try { await fetchProducts(); } finally { setIsLoading(false); }
    };
    load();
  }, [fetchProducts]);

  const categories = useMemo(() => {
    const s = new Set(appCategories.map(cat => cat.name.toLowerCase()));
    return Array.from(s).sort();
  }, [appCategories]);

  const brands = useMemo(() => {
    const s = new Set(allProducts.map(p => p.brand).filter(Boolean));
    return Array.from(s).sort();
  }, [allProducts]);

  const maxPrice = useMemo(() => {
    if (!allProducts.length) return 1000;
    return Math.ceil(Math.max(...allProducts.map(p => p.price)));
  }, [allProducts]);

  useEffect(() => { if (maxPrice > 0) setPriceRange([0, maxPrice]); }, [maxPrice]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceRange([0, maxPrice]);
    setShowInStock(false);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let f = [...allProducts];
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      f = f.filter(p => p.name.toLowerCase().includes(t) || (p.brand && p.brand.toLowerCase().includes(t)));
    }
    if (selectedCategories.length)
      f = f.filter(p => p.categoryNames && selectedCategories.some(cat => p.categoryNames.toLowerCase().includes(cat.toLowerCase())));
    if (selectedBrands.length)
      f = f.filter(p => selectedBrands.includes(p.brand));
    f = f.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (showInStock) f = f.filter(p => p.stock_quantity > 0);
    switch (sortBy) {
      case 'price-low': f.sort((a, b) => a.price - b.price); break;
      case 'price-high': f.sort((a, b) => b.price - a.price); break;
      case 'rating': f.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)); break;
      case 'newest': f.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
      default: f.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }
    return f;
  }, [searchTerm, selectedCategories, selectedBrands, priceRange, showInStock, sortBy, allProducts]);

  const displayedProducts = filteredAndSortedProducts.slice(0, visibleCount);

  /* Active filter chips */
  const activeChips = [
    ...selectedCategories.map(c => ({
      label: c.charAt(0).toUpperCase() + c.slice(1),
      remove: () => setSelectedCategories(prev => prev.filter(x => x !== c)),
    })),
    ...selectedBrands.map(b => ({
      label: b,
      remove: () => setSelectedBrands(prev => prev.filter(x => x !== b)),
    })),
    ...(showInStock ? [{ label: 'In stock', remove: () => setShowInStock(false) }] : []),
  ];

  const hasActiveFilters = activeChips.length > 0 || searchTerm;

  return (
    <div className="bg-white min-h-screen text-gray-900 overflow-x-hidden">

      {/* ── Hero Banner ── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: '240px', background: 'linear-gradient(100deg, #fdf8f3 0%, #f7ede2 45%, #f0e2d5 100%)' }}
      >
        {/* Warm decorative lines — left half only */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="wlAlpha" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="white" stopOpacity="1"/>
              <stop offset="48%" stopColor="white" stopOpacity="1"/>
              <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </linearGradient>
            <mask id="wlMask"><rect width="100%" height="100%" fill="url(#wlAlpha)"/></mask>
          </defs>
          <g mask="url(#wlMask)" opacity="0.22">
            <path d="M-40 55 Q90 55 90 27 Q90 0 180 0 Q270 0 270 27 Q270 55 360 55" fill="none" stroke="#b07850" strokeWidth="1.1"/>
            <path d="M-40 95 Q90 95 90 67 Q90 40 180 40 Q270 40 270 67 Q270 95 360 95" fill="none" stroke="#b07850" strokeWidth="0.9"/>
            <path d="M-40 135 Q90 135 90 107 Q90 80 180 80 Q270 80 270 107 Q270 135 360 135" fill="none" stroke="#b07850" strokeWidth="0.9"/>
            <path d="M-40 175 Q90 175 90 147 Q90 120 180 120 Q270 120 270 147 Q270 175 360 175" fill="none" stroke="#b07850" strokeWidth="0.7"/>
            <path d="M-40 215 Q90 215 90 187 Q90 160 180 160 Q270 160 270 187 Q270 215 360 215" fill="none" stroke="#b07850" strokeWidth="0.7"/>
          </g>
        </svg>

        {/* ── Mobile: full-bleed bg, text stays readable ── */}
        <div className="md:hidden absolute inset-0 pointer-events-none overflow-hidden">
          <Image
            src="/Untitled design.png"
            alt="All Products"
            fill
            className="object-cover"
            style={{
              objectPosition: '65% center',
              maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 20%, rgba(0,0,0,0.55) 50%, black 70%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 20%, rgba(0,0,0,0.55) 50%, black 70%)',
            }}
            priority
          />
          {/* Warm tint so text on left is crisp */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to right, rgba(253,248,243,0.97) 0%, rgba(253,248,243,0.7) 35%, transparent 65%)',
          }} />
        </div>

        {/* ── Desktop: image masked at every edge, no overlays needed ── */}
        <div
          className="hidden md:block absolute top-0 bottom-0 right-0 pointer-events-none overflow-hidden"
          style={{ width: '68%' }}
        >
          <Image
            src="/Untitled design.png"
            alt="All Products"
            fill
            className="object-cover"
            style={{
              objectPosition: '40% center',
              /* mask fades: left edge heavy, top/bottom light, right clip */
              maskImage: [
                'linear-gradient(to right,  transparent 0%, rgba(0,0,0,0.25) 10%, rgba(0,0,0,0.7) 22%, black 38%, black 88%, rgba(0,0,0,0.4) 100%)',
                'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)',
              ].join(', '),
              WebkitMaskImage: [
                'linear-gradient(to right,  transparent 0%, rgba(0,0,0,0.25) 10%, rgba(0,0,0,0.7) 22%, black 38%, black 88%, rgba(0,0,0,0.4) 100%)',
                'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)',
              ].join(', '),
              maskComposite: 'intersect',
              WebkitMaskComposite: 'destination-in',
            }}
            priority
          />
        </div>

        {/* Foreground left anchor — pulls the bg colour across the seam zone */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to right, #fdf8f3 0%, rgba(253,248,243,0.92) 16%, rgba(253,248,243,0.38) 30%, transparent 44%)',
        }} />

        {/* Copy */}
        <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-14" style={{ maxWidth: '56%' }}>
          <nav className="text-[11px] font-medium mb-4 flex items-center gap-1.5" style={{ color: 'rgba(140,90,50,0.6)' }}>
            <Link href="/" className="hover:opacity-100 transition-opacity">Home</Link>
            <span style={{ color: 'rgba(140,90,50,0.3)' }}>›</span>
            <span style={{ color: 'rgba(140,90,50,0.85)' }}>Shop Catalog</span>
          </nav>
          <h1
            className="font-bold leading-none tracking-tight"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)', color: '#2a1408' }}
          >
            All Products
          </h1>
          <p className="mt-2.5 text-[13px] leading-relaxed" style={{ color: 'rgba(100,60,20,0.55)' }}>
            {allProducts.length > 0 ? `${allProducts.length} products curated for you` : 'Curated luxury beauty'}
          </p>
        </div>
      </div>

      {/* ── Category pills bar ── */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-20">
        <div className="max-w-[1320px] mx-auto px-5 md:px-8 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {/* Search pill */}
          <div className="relative flex-shrink-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-[34px] pl-8 pr-4 rounded-full border border-gray-200 text-[11px] focus:outline-none focus:border-gray-700 transition-colors bg-white w-36"
            />
          </div>

          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

          <button
            onClick={clearFilters}
            className={`flex-shrink-0 h-[34px] px-4 rounded-full border text-[11px] font-semibold tracking-[0.04em] transition-all ${
              !hasActiveFilters
                ? 'bg-gray-900 border-gray-900 text-white'
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-700'
            }`}
          >
            All
          </button>

          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategories(prev =>
                prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
              )}
              className={`flex-shrink-0 h-[34px] px-4 rounded-full border text-[11px] font-semibold tracking-[0.04em] transition-all ${
                selectedCategories.includes(cat)
                  ? 'bg-gray-900 border-gray-900 text-white'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-700'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Shell: sidebar + content ── */}
      <div className="max-w-[1320px] mx-auto px-5 md:px-8 py-6 md:py-8 flex gap-10 md:gap-12 items-start">

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-[230px] flex-shrink-0 sticky top-[105px]">
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
        </aside>

        {/* Main Content */}
        <section className="flex-1 min-w-0">

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-gray-100 flex-wrap">
            <div className="text-[12px] text-gray-500">
              <span className="font-semibold text-gray-900">{filteredAndSortedProducts.length} products</span>
              <span> · curated this season</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Mobile filter button */}
              <button
                onClick={() => setIsFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 h-9 px-4 bg-white border border-gray-200 rounded-full text-[11px] font-semibold text-gray-700 hover:border-gray-700 transition-all"
              >
                <Filter size={12} />
                Filters
                {activeChips.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-gray-900 text-white text-[9px] flex items-center justify-center font-bold">
                    {activeChips.length}
                  </span>
                )}
              </button>
              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="h-9 pl-3 pr-8 border border-gray-200 rounded-full text-[11px] font-medium text-gray-700 bg-white appearance-none cursor-pointer focus:outline-none focus:border-gray-700 transition-colors"
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235a5a64' stroke-width='2'><path d='m6 9 6 6 6-6'/></svg>")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px center',
                }}
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest first</option>
                <option value="rating">Best rated</option>
                <option value="price-low">Price · low to high</option>
                <option value="price-high">Price · high to low</option>
              </select>
              {/* View toggle */}
              <div className="hidden sm:flex items-center gap-1 bg-gray-100 p-1 rounded-full">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`w-8 h-7 flex items-center justify-center rounded-full transition-all ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                  aria-label="Grid view"
                >
                  <Grid2X2 size={13} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`w-8 h-7 flex items-center justify-center rounded-full transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                  aria-label="List view"
                >
                  <List size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-5">
              {activeChips.map((chip, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 h-7 px-3 border border-gray-200 rounded-full text-[11px] font-medium text-gray-700"
                >
                  {chip.label}
                  <button
                    onClick={chip.remove}
                    className="text-gray-400 hover:text-gray-900 transition-colors leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={clearFilters}
                className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Products */}
          {isLoading ? (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5">
              {Array.from({ length: 9 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-32 bg-gray-50 rounded-2xl border border-gray-100"
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-100 shadow-sm">
                <Search size={22} strokeWidth={1.5} className="text-gray-300" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-sm text-gray-500 mb-6">Try adjusting your filters or search</p>
              <button
                onClick={clearFilters}
                className="px-8 py-3 bg-gray-900 text-white rounded-full text-[12px] font-semibold hover:bg-purple-700 transition-all"
              >
                Clear filters
              </button>
            </motion.div>
          ) : (
            <div className="space-y-12">
              <motion.div
                layout
                className={
                  viewMode === 'list'
                    ? 'flex flex-col gap-4'
                    : 'grid grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5'
                }
              >
                <AnimatePresence mode="popLayout">
                  {displayedProducts.map((product, index) => (
                    <motion.div
                      layout
                      key={product.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, delay: (index % 18) * 0.025, ease: 'easeOut' }}
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
                        imageUrls={product.additionalImagesData?.map(img => img.url) || []}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Load more */}
              {visibleCount < filteredAndSortedProducts.length && (
                <div className="flex flex-col items-center gap-5 pt-10 border-t border-gray-100">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-40 h-0.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(displayedProducts.length / filteredAndSortedProducts.length) * 100}%` }}
                        className="h-full bg-gray-400 rounded-full"
                      />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-medium">
                      {displayedProducts.length} of {filteredAndSortedProducts.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setVisibleCount(prev => prev + 12)}
                    className="group flex items-center gap-2 px-7 py-3 bg-gray-900 text-white rounded-full text-[12px] font-semibold hover:bg-purple-700 transition-all shadow-sm active:scale-95"
                  >
                    Show more
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* ── Mobile Filter Drawer ── */}
      <AnimatePresence>
        {isFilterOpen && (
          <div className="fixed inset-0 z-[100]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsFilterOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 35, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-[88%] max-w-sm bg-white shadow-2xl overflow-y-auto rounded-l-3xl flex flex-col"
            >
              <div className="px-7 py-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-purple-500 font-semibold mt-1">
                      {filteredAndSortedProducts.length} products
                    </p>
                  </div>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="w-10 h-10 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center"
                  >
                    <X size={18} strokeWidth={2} />
                  </button>
                </div>
              </div>

              <div className="px-7 py-6 flex-grow">
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

              <div className="px-7 py-5 sticky bottom-0 bg-white border-t border-gray-100">
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl text-[13px] font-semibold hover:bg-purple-700 transition-all active:scale-95"
                >
                  Show {filteredAndSortedProducts.length} products
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
