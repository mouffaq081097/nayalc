"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import ProductCard from '../../components/ProductCard';
import StoreCategoryNav from '../../components/StoreCategoryNav';
import { MadeInFranceBadge } from '../../components/MadeInFranceBadge';
import { MadeInUAEBadge } from '../../components/MadeInUAEBadge';
import { Filter, Search, X, Check, ArrowRight, Grid2X2, List } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import ProductCardSkeleton from '../../components/ProductCardSkeleton';
import { Slider } from '../../components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { slugify } from '@/lib/slugify';
import { getBrandMeta } from '@/lib/brandMeta';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion';

/* ─── Sidebar Filters ─────────────────────────────────────────── */
const SidebarFilters = ({
  categories,
  selectedCategories,
  setSelectedCategories,
  priceRange,
  setPriceRange,
  showInStock,
  setShowInStock,
  maxPrice,
  clearFilters,
  allProducts,
}) => {
  const [localPriceRange, setLocalPriceRange] = useState(priceRange);

  useEffect(() => {
    const handler = setTimeout(() => setPriceRange(localPriceRange), 500);
    return () => clearTimeout(handler);
  }, [localPriceRange, setPriceRange]);

  const categoryCounts = useMemo(() => {
    const c = {};
    allProducts.forEach(p => {
      if (p.categoryNames) {
        p.categoryNames.split(',').forEach(cat => {
          const key = cat.trim().toLowerCase();
          c[key] = (c[key] || 0) + 1;
        });
      }
    });
    return c;
  }, [allProducts]);

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
    <div className="space-y-0">
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

      <Accordion type="multiple" defaultValue={['category', 'price']} className="w-full space-y-0">

        {/* Category */}
        <AccordionItem value="category" className="border-b border-gray-100">
          <AccordionTrigger className="hover:no-underline py-4 text-[10px] uppercase tracking-[0.25em] font-bold text-gray-900 flex-1 text-left">
            Category
          </AccordionTrigger>
          <AccordionContent>
            <div className="pb-5 space-y-0">
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
              {categories.length === 0 && (
                <p className="text-[12px] text-gray-400 py-1">No categories yet</p>
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

/* ─── Hero Banner ─────────────────────────────────────────────── */
const BrandHero = ({ brand, meta }) => {
  if (!brand) return null;
  const isFrance = meta.origin === 'France';
  const isNayaPerfumes = /naya\s*lumi[eè]?re?\s*perfumes?/i.test(brand.name);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '220px', background: 'linear-gradient(90deg, #faf6ff 0%, #f1e8ff 55%, #e9dcff 100%)' }}>
      {/* Decorative SVG lines — same motif as the collections hero */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180' fill='none' stroke='%239869f7' stroke-width='1.2' opacity='0.15'><path d='M0 90 Q45 90 45 45 Q45 0 90 0 Q135 0 135 45 Q135 90 180 90'/><path d='M0 130 Q45 130 45 85 Q45 40 90 40 Q135 40 135 85 Q135 130 180 130'/><path d='M0 50 Q45 50 45 5 Q45 -40 90 -40 Q135 -40 135 5 Q135 50 180 50'/></svg>")`,
        backgroundRepeat: 'repeat',
        maskImage: 'linear-gradient(90deg, #000 0%, #000 60%, transparent 80%)',
        WebkitMaskImage: 'linear-gradient(90deg, #000 0%, #000 60%, transparent 80%)',
      }} />

      {brand.imageurl && (
        <>
          {/* Mobile: full-bleed bg, text stays readable — same technique as /all-products */}
          <div className="md:hidden absolute inset-0 pointer-events-none overflow-hidden">
            <Image
              src={brand.imageurl}
              alt={brand.name}
              fill
              className="object-cover"
              style={{
                maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 20%, rgba(0,0,0,0.55) 50%, black 70%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 20%, rgba(0,0,0,0.55) 50%, black 70%)',
              }}
            />
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to right, rgba(250,246,255,0.97) 0%, rgba(250,246,255,0.7) 35%, transparent 65%)',
            }} />
          </div>

          {/* Desktop: image masked at every edge so it melts into the gradient, no hard-edged card */}
          <div className="hidden md:block absolute top-0 bottom-0 right-0 pointer-events-none overflow-hidden" style={{ width: '62%' }}>
            <Image
              src={brand.imageurl}
              alt={brand.name}
              fill
              className="object-cover"
              style={{
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
            />
          </div>

          {/* Foreground left anchor — pulls the hero's own background colour across the seam */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(to right, #faf6ff 0%, rgba(250,246,255,0.92) 16%, rgba(250,246,255,0.38) 30%, transparent 44%)',
          }} />
        </>
      )}

      {/* Copy */}
      <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-12 max-w-[60%]">
        <nav className="text-[12px] text-gray-500 font-medium mb-3 flex items-center gap-1.5">
          <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <span className="text-gray-300">›</span>
          <Link href="/brands" className="hover:text-gray-900 transition-colors">Brands</Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-900">{brand.name}</span>
        </nav>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 leading-none mb-2">
          {brand.name}
        </h1>
        <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">
          {[meta.origin, meta.year && `Est. ${meta.year}`, meta.category].filter(Boolean).join(' · ')}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap mt-3">
          {meta.tags.map(tag => (
            <span key={tag} className="text-[10px] font-semibold uppercase tracking-wide text-gray-600 border border-gray-200 bg-white/70 rounded-md px-2 py-0.5">
              {tag}
            </span>
          ))}
          {isFrance && <MadeInFranceBadge variant="light" />}
          {isNayaPerfumes && <MadeInUAEBadge variant="light" />}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ───────────────────────────────────────────────── */
export default function BrandClient({ brand: serverBrand }) {
  const { slug } = useParams();
  const { products: allProducts, brands: appBrands, fetchProducts } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  const [selectedCategories, setSelectedCategories] = useState([]);
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

  const currentBrand = useMemo(() => {
    if (serverBrand) return serverBrand;
    return appBrands.find(b => b.slug === slug || slugify(b.name) === slug || b.id.toString() === slug);
  }, [appBrands, slug, serverBrand]);

  const meta = useMemo(() => getBrandMeta(currentBrand?.name), [currentBrand]);

  const brandProducts = useMemo(() => {
    if (!currentBrand) return [];
    return allProducts.filter(product =>
      product.brand && product.brand.toLowerCase() === currentBrand.name.toLowerCase()
    );
  }, [allProducts, currentBrand]);

  const categories = useMemo(() => {
    const unique = new Set();
    brandProducts.forEach(prod => {
      if (prod.categoryNames) {
        prod.categoryNames.split(',').forEach(cat => unique.add(cat.trim().toLowerCase()));
      }
    });
    return Array.from(unique).sort();
  }, [brandProducts]);

  const maxPrice = useMemo(() => {
    if (brandProducts.length === 0) return 1000;
    return Math.ceil(Math.max(...brandProducts.map(p => p.price)));
  }, [brandProducts]);

  useEffect(() => { setPriceRange([0, maxPrice]); }, [maxPrice]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setPriceRange([0, maxPrice]);
    setShowInStock(false);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...brandProducts];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product => product.name.toLowerCase().includes(term));
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product =>
        product.categoryNames && selectedCategories.some(cat => product.categoryNames.toLowerCase().includes(cat))
      );
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
  }, [searchTerm, selectedCategories, priceRange, showInStock, sortBy, brandProducts]);

  const displayedProducts = filteredAndSortedProducts.slice(0, visibleCount);

  /* Active filter chips */
  const activeChips = [
    ...selectedCategories.map(cat => ({
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      remove: () => setSelectedCategories(prev => prev.filter(c => c !== cat)),
    })),
    ...(showInStock ? [{ label: 'In stock', remove: () => setShowInStock(false) }] : []),
  ];

  const hasActiveFilters = activeChips.length > 0 || searchTerm;

  return (
    <div className="bg-white min-h-screen text-gray-900 overflow-x-hidden">
      <StoreCategoryNav />
      <BrandHero brand={currentBrand} meta={meta} />

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
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategories(prev =>
                prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
              )}
              className={`flex-shrink-0 h-[34px] px-4 rounded-full border text-[11px] font-semibold tracking-[0.04em] transition-all ${
                selectedCategories.includes(category)
                  ? 'bg-gray-900 border-gray-900 text-white'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-700'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Shell: sidebar + content */}
      <div className="max-w-[1320px] mx-auto px-5 md:px-8 py-6 md:py-8 flex gap-10 md:gap-12 items-start">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:block w-[230px] flex-shrink-0 sticky top-[105px]">
          <SidebarFilters
            categories={categories}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            showInStock={showInStock}
            setShowInStock={setShowInStock}
            maxPrice={maxPrice}
            clearFilters={clearFilters}
            allProducts={brandProducts}
          />
        </aside>

        {/* ── Main Content ── */}
        <section className="flex-1 min-w-0">

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-gray-100 flex-wrap">
            <div className="text-[12px] text-gray-500">
              <span className="font-semibold text-gray-900">{filteredAndSortedProducts.length} products</span>
              {currentBrand && <span> · {currentBrand.name}</span>}
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
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                {currentBrand ? 'No products found' : 'Brand not found'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {currentBrand ? 'Try adjusting your filters' : "We couldn't find the brand you're looking for"}
              </p>
              {currentBrand ? (
                <button
                  onClick={clearFilters}
                  className="px-8 py-3 bg-gray-900 text-white rounded-full text-[12px] font-semibold hover:bg-purple-700 transition-all"
                >
                  Clear filters
                </button>
              ) : (
                <Link
                  href="/brands"
                  className="inline-block px-8 py-3 bg-gray-900 text-white rounded-full text-[12px] font-semibold hover:bg-purple-700 transition-all"
                >
                  Browse all brands
                </Link>
              )}
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
                        viewCount={product.viewCount}
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

              {/* Load More */}
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
                  selectedCategories={selectedCategories}
                  setSelectedCategories={setSelectedCategories}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  showInStock={showInStock}
                  setShowInStock={setShowInStock}
                  maxPrice={maxPrice}
                  clearFilters={clearFilters}
                  allProducts={brandProducts}
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
