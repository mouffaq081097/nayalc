"use client";

import Link from 'next/link';
import { useSearchParams, useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import ProductCard from '../../components/ProductCard';
import StoreCategoryNav from '../../components/StoreCategoryNav';
import { Filter, Search, X, Check, ArrowRight, Minus, Plus as PlusIcon, Grid2X2, List, ChevronDown } from 'lucide-react';
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

/* ─── Sidebar Filters ─────────────────────────────────────────── */
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
  compact = false,
}) => {
  const [localPriceRange, setLocalPriceRange] = useState(priceRange);
  const [showAllBrands, setShowAllBrands] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => setPriceRange(localPriceRange), 500);
    return () => clearTimeout(handler);
  }, [localPriceRange, setPriceRange]);

  const brandCounts = useMemo(() => {
    const c = {};
    allProducts.forEach(p => { if (p.brand) c[p.brand] = (c[p.brand] || 0) + 1; });
    return c;
  }, [allProducts]);

  const concernCounts = useMemo(() => {
    const c = {};
    allProducts.forEach(p => {
      if (p.concern_ids && Array.isArray(p.concern_ids))
        p.concern_ids.forEach(cid => { c[cid] = (c[cid] || 0) + 1; });
    });
    return c;
  }, [allProducts]);

  const displayedBrands = showAllBrands ? brands : brands.slice(0, 8);

  const filterLabel = "text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 mb-3 block";
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
    <div className={compact ? "space-y-0" : "space-y-0"}>
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

      <Accordion type="multiple" defaultValue={['concern', 'brand', 'price']} className="w-full space-y-0">

        {/* Skin Concern */}
        {concerns && concerns.length > 0 && (
          <AccordionItem value="concern" className="border-b border-gray-100">
            <AccordionTrigger className="hover:no-underline py-4 text-[10px] uppercase tracking-[0.25em] font-bold text-gray-900 flex-1 text-left">
              Skin concern
            </AccordionTrigger>
            <AccordionContent>
              <div className="pb-5 space-y-0">
                {concerns.map(con => (
                  <div
                    key={con.id}
                    className={itemRow}
                    onClick={() => {
                      const next = selectedConcerns.includes(con.id)
                        ? selectedConcerns.filter(id => id !== con.id)
                        : [...selectedConcerns, con.id];
                      setSelectedConcerns(next);
                    }}
                  >
                    <div className="flex items-center">
                      <div className={checkBox(selectedConcerns.includes(con.id))}>
                        {selectedConcerns.includes(con.id) && <Check size={9} className="text-white" strokeWidth={3.5} />}
                      </div>
                      <span className={itemText(selectedConcerns.includes(con.id))}>{con.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-300 group-hover/item:text-gray-500 transition-colors font-medium">
                      {concernCounts[con.id] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Brand */}
        <AccordionItem value="brand" className="border-b border-gray-100">
          <AccordionTrigger className="hover:no-underline py-4 text-[10px] uppercase tracking-[0.25em] font-bold text-gray-900 flex-1 text-left">
            Brand
          </AccordionTrigger>
          <AccordionContent>
            <div className="pb-5 space-y-0">
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

        {/* In Stock */}
        <AccordionItem value="stock" className="border-none">
          <AccordionTrigger className="hover:no-underline py-4 text-[10px] uppercase tracking-[0.25em] font-bold text-gray-900">
            Availability
          </AccordionTrigger>
          <AccordionContent>
            <div className="pb-5">
              <div
                className={`${itemRow}`}
                onClick={() => setShowInStock(!showInStock)}
              >
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

/* ─── Hero Banner ─────────────────────────────────────────────── */
const CategoryHero = ({ category }) => {
  if (!category) return null;

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '220px', background: 'linear-gradient(90deg, #faf6ff 0%, #f1e8ff 55%, #e9dcff 100%)' }}>
      {/* Decorative SVG lines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180' fill='none' stroke='%239869f7' stroke-width='1.2' opacity='0.15'><path d='M0 90 Q45 90 45 45 Q45 0 90 0 Q135 0 135 45 Q135 90 180 90'/><path d='M0 130 Q45 130 45 85 Q45 40 90 40 Q135 40 135 85 Q135 130 180 130'/><path d='M0 50 Q45 50 45 5 Q45 -40 90 -40 Q135 -40 135 5 Q135 50 180 50'/></svg>")`,
        backgroundRepeat: 'repeat',
        maskImage: 'linear-gradient(90deg, #000 0%, #000 60%, transparent 80%)',
        WebkitMaskImage: 'linear-gradient(90deg, #000 0%, #000 60%, transparent 80%)',
      }} />

      {/* Circular art on right */}
      <div className="absolute top-0 right-0 h-full pointer-events-none" style={{ width: '46%' }}>
        <div className="absolute rounded-full" style={{
          top: '50%', transform: 'translateY(-50%)',
          right: '-22%', width: '140%', aspectRatio: '1/1',
          background: '#ecdcff',
        }} />
        <div className="absolute rounded-full" style={{
          top: '50%', transform: 'translateY(-50%)',
          right: '-26%', width: '128%', aspectRatio: '1/1',
          background: '#f6ecff',
        }} />
        <div className="absolute rounded-full overflow-hidden" style={{
          top: '50%', transform: 'translateY(-50%)',
          right: '-34%', width: '118%', aspectRatio: '1/1',
          background: 'radial-gradient(circle at 30% 30%, #faf3ff 0%, #e6d2fb 60%, #c9a9f3 100%)',
        }}>
          {category.imageUrl && (
            <img
              src={category.imageUrl}
              alt={category.name}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
              style={{ mixBlendMode: 'multiply' }}
            />
          )}
        </div>
      </div>

      {/* Copy */}
      <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-12 max-w-[60%]">
        <nav className="text-[12px] text-gray-500 font-medium mb-3 flex items-center gap-1.5">
          <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <span className="text-gray-300">›</span>
          <Link href="/collections" className="hover:text-gray-900 transition-colors">Shop</Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-900">{category.name}</span>
        </nav>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 leading-none mb-2">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-[13px] text-gray-500 mt-2 max-w-sm leading-relaxed line-clamp-2">
            {category.description}
          </p>
        )}
      </div>
    </div>
  );
};

/* ─── Main Page ───────────────────────────────────────────────── */
export default function CollectionClient({ category: serverCategory }) {
  const { slug } = useParams();
  const { products: allProducts, categories: appCategories, concerns, fetchProducts } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedConcerns, setSelectedConcerns] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showInStock, setShowInStock] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(18);

  useEffect(() => {
    const loadProducts = async () => {
      try { await fetchProducts(); } finally { setIsLoading(false); }
    };
    loadProducts();
  }, [fetchProducts]);

  const currentCategory = useMemo(() => {
    if (serverCategory) return serverCategory;
    return appCategories.find(cat => cat.slug === slug || cat.id.toString() === slug);
  }, [appCategories, slug, serverCategory]);

  const categoryProducts = useMemo(() => {
    if (!currentCategory) return [];
    return allProducts.filter(product =>
      product.categoryNames && product.categoryNames.toLowerCase().includes(currentCategory.name.toLowerCase())
    );
  }, [allProducts, currentCategory]);

  const brands = useMemo(() => {
    const s = new Set(categoryProducts.map(p => p.brand).filter(Boolean));
    return Array.from(s).sort();
  }, [categoryProducts]);

  const maxPrice = useMemo(() => {
    if (!categoryProducts.length) return 1000;
    return Math.ceil(Math.max(...categoryProducts.map(p => p.price)));
  }, [categoryProducts]);

  useEffect(() => { setPriceRange([0, maxPrice]); }, [maxPrice]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedBrands([]);
    setSelectedConcerns([]);
    setPriceRange([0, maxPrice]);
    setShowInStock(false);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let f = [...categoryProducts];
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      f = f.filter(p => p.name.toLowerCase().includes(t) || (p.brand && p.brand.toLowerCase().includes(t)));
    }
    if (selectedBrands.length) f = f.filter(p => selectedBrands.includes(p.brand));
    if (selectedConcerns.length)
      f = f.filter(p => p.concern_ids && p.concern_ids.some(cid => selectedConcerns.includes(cid)));
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
  }, [searchTerm, selectedBrands, selectedConcerns, priceRange, showInStock, sortBy, categoryProducts]);

  const displayedProducts = filteredAndSortedProducts.slice(0, visibleCount);

  /* Active filter chips */
  const activeChips = [
    ...selectedBrands.map(b => ({ label: b, remove: () => setSelectedBrands(prev => prev.filter(x => x !== b)) })),
    ...selectedConcerns.map(cid => {
      const con = concerns?.find(c => c.id === cid);
      return con ? { label: con.name, remove: () => setSelectedConcerns(prev => prev.filter(x => x !== cid)) } : null;
    }).filter(Boolean),
    ...(showInStock ? [{ label: 'In stock', remove: () => setShowInStock(false) }] : []),
  ];

  const hasActiveFilters = activeChips.length > 0 || searchTerm;

  return (
    <div className="bg-white min-h-screen text-gray-900 overflow-x-hidden">
      <StoreCategoryNav />
      <CategoryHero category={currentCategory} />

      {/* Category pills */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-20">
        <div className="max-w-[1320px] mx-auto px-5 md:px-8 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
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
          {brands.map(brand => (
            <button
              key={brand}
              onClick={() => setSelectedBrands(prev =>
                prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
              )}
              className={`flex-shrink-0 h-[34px] px-4 rounded-full border text-[11px] font-semibold tracking-[0.04em] transition-all ${
                selectedBrands.includes(brand)
                  ? 'bg-gray-900 border-gray-900 text-white'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-700'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Shell: sidebar + content */}
      <div className="max-w-[1320px] mx-auto px-5 md:px-8 py-6 md:py-8 flex gap-10 md:gap-12 items-start">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:block w-[230px] flex-shrink-0 sticky top-[105px]">
          <SidebarFilters
            brands={brands}
            selectedBrands={selectedBrands}
            setSelectedBrands={setSelectedBrands}
            concerns={concerns}
            selectedConcerns={selectedConcerns}
            setSelectedConcerns={setSelectedConcerns}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            showInStock={showInStock}
            setShowInStock={setShowInStock}
            maxPrice={maxPrice}
            clearFilters={clearFilters}
            allProducts={categoryProducts}
          />
        </aside>

        {/* ── Main Content ── */}
        <section className="flex-1 min-w-0">

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-gray-100 flex-wrap">
            <div className="text-[12px] text-gray-500">
              <span className="font-semibold text-gray-900">{filteredAndSortedProducts.length} products</span>
              {currentCategory && <span> · {currentCategory.name}</span>}
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
              <div className="relative">
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
              </div>
              {/* View toggle */}
              <div className="hidden sm:flex items-center gap-1 bg-gray-100 p-1 rounded-full">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`w-8 h-7 flex items-center justify-center rounded-full transition-all ${
                    viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid2X2 size={13} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`w-8 h-7 flex items-center justify-center rounded-full transition-all ${
                    viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
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
                    aria-label={`Remove ${chip.label}`}
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
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
              <p className="text-sm text-gray-500 mb-6">Try adjusting your filters</p>
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
                    : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6'
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
                  brands={brands}
                  selectedBrands={selectedBrands}
                  setSelectedBrands={setSelectedBrands}
                  concerns={concerns}
                  selectedConcerns={selectedConcerns}
                  setSelectedConcerns={setSelectedConcerns}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  showInStock={showInStock}
                  setShowInStock={setShowInStock}
                  maxPrice={maxPrice}
                  clearFilters={clearFilters}
                  allProducts={categoryProducts}
                  compact
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
