"use client";

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import ProductCard from '../components/ProductCard';
import Link from 'next/link';
import Image from 'next/image';
import { headingFont } from '../components/home/headingFont';
import { FranceFlag } from '../components/MadeInFranceBadge';
import { UAEFlag } from '../components/MadeInUAEBadge';
import { Search, X, Filter, Check, ArrowRight, Minus, Plus as PlusIcon, Grid2X2, List, ChevronDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLocale, useT } from '../context/LocaleContext';
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
  const t = useT();
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
    `ms-2.5 text-[12px] tracking-wide transition-colors ${
      active ? 'text-gray-900 font-semibold' : 'text-gray-500 group-hover/item:text-gray-900'
    }`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between pb-5 mb-5 border-b border-gray-100">
        <span className="text-[11px] uppercase tracking-[0.25em] font-bold text-gray-900">{t('Filters')}</span>
        <button
          onClick={clearFilters}
          className="text-[10px] uppercase tracking-widest text-[#6b6b73] hover:text-gray-900 transition-colors font-medium"
        >
          {t('Clear all')}
        </button>
      </div>

      <Accordion type="multiple" defaultValue={['category', 'brand', 'price']} className="w-full">

        {/* Collections */}
        <AccordionItem value="category" className="border-b border-gray-100">
          <AccordionTrigger className="hover:no-underline py-4 text-[10px] uppercase tracking-[0.25em] font-bold text-gray-900 flex-1 text-start">
            {t('Collections')}
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
                      {t(category.charAt(0).toUpperCase() + category.slice(1))}
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
          <AccordionTrigger className="hover:no-underline py-4 text-[10px] uppercase tracking-[0.25em] font-bold text-gray-900 flex-1 text-start">
            {t('Brand')}
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
                  className="mt-2 text-[10px] uppercase tracking-widest text-[#6b6b73] hover:text-gray-900 transition-colors font-medium flex items-center gap-1.5"
                >
                  {showAllBrands ? <Minus size={10} /> : <PlusIcon size={10} />}
                  {showAllBrands ? t('Show less') : t('View all ({n})', { n: brands.length })}
                </button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price */}
        <AccordionItem value="price" className="border-b border-gray-100">
          <AccordionTrigger className="hover:no-underline py-4 text-[10px] uppercase tracking-[0.25em] font-bold text-gray-900">
            {t('Price (AED)')}
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
                  <div className="text-[8px] uppercase tracking-widest text-[#6b6b73] font-semibold mb-0.5">{t('Min')}</div>
                  <div className="text-[12px] font-semibold text-gray-900">AED {localPriceRange[0]}</div>
                </div>
                <span className="text-gray-300 text-sm">—</span>
                <div className="flex-1 border border-gray-200 rounded-[8px] px-3 py-2">
                  <div className="text-[8px] uppercase tracking-widest text-[#6b6b73] font-semibold mb-0.5">{t('Max')}</div>
                  <div className="text-[12px] font-semibold text-gray-900">AED {localPriceRange[1]}</div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Availability */}
        <AccordionItem value="stock" className="border-none">
          <AccordionTrigger className="hover:no-underline py-4 text-[10px] uppercase tracking-[0.25em] font-bold text-gray-900">
            {t('Availability')}
          </AccordionTrigger>
          <AccordionContent>
            <div className="pb-5">
              <div className={itemRow} onClick={() => setShowInStock(!showInStock)}>
                <div className="flex items-center">
                  <div className={checkBox(showInStock)}>
                    {showInStock && <Check size={9} className="text-white" strokeWidth={3.5} />}
                  </div>
                  <span className={itemText(showInStock)}>{t('In stock only')}</span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
};

/* ─── Desktop filter bar pieces ───────────────────────────────── */

/** A pill that opens a small panel under itself; closes on outside click or Esc. */
const FilterDropdown = ({ label, count = 0, active = false, align = 'left', children }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const on = active || count > 0;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className={`h-9 px-4 rounded-full border text-[12px] font-medium flex items-center gap-1.5 transition-colors ${
          on ? 'border-gray-900 text-gray-900' : 'border-gray-200 text-gray-700 hover:border-gray-700'
        }`}
      >
        {label}
        {count > 0 && (
          <span className="w-4 h-4 rounded-full bg-gray-900 text-white text-[9px] flex items-center justify-center font-bold">{count}</span>
        )}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className={`absolute ${align === 'right' ? 'end-0' : 'start-0'} top-[calc(100%+8px)] z-30 w-[270px] bg-white border border-gray-200 rounded-xl shadow-lg p-4`}>
          {children}
        </div>
      )}
    </div>
  );
};

/** Price slider with min/max readout; applies half a second after the last move. */
const PriceFilter = ({ priceRange, setPriceRange, maxPrice }) => {
  const [local, setLocal] = useState(priceRange);
  useEffect(() => {
    const handler = setTimeout(() => setPriceRange(local), 500);
    return () => clearTimeout(handler);
  }, [local, setPriceRange]);

  return (
    <div className="pt-2 px-1">
      <Slider defaultValue={priceRange} max={maxPrice} step={10} onValueChange={setLocal} className="mb-5" />
      <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-900">
        <span className="flex-1 border border-gray-200 rounded-[8px] px-3 py-2">AED {local[0]}</span>
        <span className="text-gray-300">—</span>
        <span className="flex-1 border border-gray-200 rounded-[8px] px-3 py-2">AED {local[1]}</span>
      </div>
    </div>
  );
};

/** The page title with a ⌄ that jumps to another listing: best sellers, a brand or a collection. */
const PageSwitcher = ({ title, brands, collections }) => {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const groups = [
    { label: 'Shop', links: [{ name: 'All products', href: '/all-products' }, { name: 'Best sellers', href: '/all-products?bestseller=true' }, { name: 'New arrivals', href: '/new-arrivals' }, { name: 'Offers', href: '/sales' }] },
    { label: 'Brands', links: brands.map(b => ({ name: b.name, href: `/brand/${b.slug || b.id}` })) },
    { label: 'Collections', links: collections.map(c => ({ name: c.name, href: `/collections/${c.slug || c.id}` })) },
  ].filter(g => g.links.length);

  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="group flex items-center gap-3 text-start">
        <h1 className={`${headingFont} text-[30px] md:text-[44px] font-medium leading-tight text-[#111114]`}>{t(title)}</h1>
        <ChevronDown size={26} strokeWidth={1.5} className={`mt-1 shrink-0 text-[#111114] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute start-0 top-full z-40 mt-2 w-[min(88vw,560px)] max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 shadow-lg grid gap-5 sm:grid-cols-3">
          {groups.map(g => (
            <div key={g.label}>
              <p className="text-[12px] text-[#8a8a92]">{t(g.label)}</p>
              <ul className="mt-2 space-y-1.5">
                {g.links.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} onClick={() => setOpen(false)} className="text-[14px] text-[#111114] hover:underline underline-offset-4">{t(l.name)}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** One large rounded card per brand: photo, name, origin and product count. Click to filter; click again to clear. */
const BrandCards = ({ brands, selected, onToggle, counts }) => {
  const t = useT();
  return (
  <div>
    <div className="flex items-center justify-between gap-4">
      <p className="text-[15px] text-[#111114]">{t('Brand')}</p>
      <Link href="/brands" className="text-[13px] text-[#5a5a64] underline underline-offset-4 hover:text-[#111114]">{t('About our brands')}</Link>
    </div>
    <div className="mt-3 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-3 overflow-x-auto scrollbar-hide lg:grid lg:grid-cols-4 lg:overflow-visible">
      {brands.map(b => {
        const on = selected.includes(b.name);
        const french = /gern[eé]t/i.test(b.name);
        const emirati = /perfumes?/i.test(b.name) && /naya/i.test(b.name);
        const n = counts[b.name] || 0;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => onToggle(b.name)}
            aria-pressed={on}
            className={`shrink-0 w-[270px] lg:w-auto flex items-center gap-3.5 rounded-full border bg-white ps-3 pe-6 py-3 text-start transition-colors ${
              on ? 'border-[#111114] ring-1 ring-[#111114]' : 'border-[#e4e4e7] hover:border-[#a1a1aa]'
            }`}
          >
            <span className="relative w-11 h-11 shrink-0 overflow-hidden rounded-full bg-[#f6f5f2]">
              {b.imageurl && <Image src={b.imageurl} alt="" fill sizes="44px" className="object-cover" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold text-[#111114]">{b.name}</span>
              <span className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-[12.5px] text-[#8a8a92]">
                {french && <><FranceFlag title={t('Made in France')} /> {t('Made in France')} ·</>}
                {emirati && <><UAEFlag title={t('Made in the UAE')} /> {t('Made in the UAE')} ·</>}
                {` ${t(n === 1 ? '{n} product' : '{n} products', { n })}`}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  </div>
  );
};

/* ─── Main Page ───────────────────────────────────────────────── */
export default function AllProductsPage() {
  const { products: allProducts, categories: appCategories, concerns, fetchProducts, brands: brandList } = useAppContext();
  const { t, dir: textDir } = useLocale();
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
  const [selectedConcern, setSelectedConcern] = useState(null);

  useEffect(() => {
    const category = searchParams.get('category');
    if (category) setSelectedCategories([category]);
  }, [searchParams]);

  const bestsellerOnly = searchParams.get('bestseller') === 'true';

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

  // ?brand=<name> pre-selects a brand facet — the Shop menu's Cosmetics entry
  // uses it. Resolved against the loaded brand list case-insensitively rather
  // than trusted verbatim, because the facet filter matches brand names exactly.
  useEffect(() => {
    const brand = searchParams.get('brand');
    if (!brand) return;
    const match = brands.find(b => b.toLowerCase() === brand.toLowerCase());
    if (match) setSelectedBrands([match]);
  }, [searchParams, brands]);

  // ?concern=<slug> (the homepage's Shop by Concern) filters to products tagged with it
  useEffect(() => {
    const concern = searchParams.get('concern');
    if (!concern) return;
    const match = concerns.find(c => c.slug === concern || String(c.id) === concern);
    if (match) setSelectedConcern(match);
  }, [searchParams, concerns]);

  // Counts beside each brand in the desktop Brand dropdown (collections are the pills above)
  const brandCounts = useMemo(() => {
    const c = {};
    allProducts.forEach(p => { if (p.brand) c[p.brand] = (c[p.brand] || 0) + 1; });
    return c;
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
    setSelectedConcern(null);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let f = [...allProducts];
    if (bestsellerOnly) f = f.filter(p => p.isBestseller);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      f = f.filter(p => p.name.toLowerCase().includes(term) || (p.brand && p.brand.toLowerCase().includes(term)));
    }
    if (selectedCategories.length)
      f = f.filter(p => p.categoryNames && selectedCategories.some(cat => p.categoryNames.toLowerCase().includes(cat.toLowerCase())));
    if (selectedBrands.length)
      f = f.filter(p => selectedBrands.includes(p.brand));
    if (selectedConcern)
      f = f.filter(p => (p.concern_ids || []).map(Number).includes(Number(selectedConcern.id)));
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
  }, [searchTerm, selectedCategories, selectedBrands, selectedConcern, priceRange, showInStock, sortBy, allProducts, bestsellerOnly]);

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
    ...(selectedConcern ? [{ label: selectedConcern.name, remove: () => setSelectedConcern(null) }] : []),
    ...(showInStock ? [{ label: t('In stock'), remove: () => setShowInStock(false) }] : []),
  ];

  const hasActiveFilters = activeChips.length > 0 || searchTerm;
  const countLabel = t(filteredAndSortedProducts.length === 1 ? '{n} product' : '{n} products', { n: filteredAndSortedProducts.length });

  return (
    <div className="bg-white min-h-screen text-gray-900 overflow-x-hidden">

      {/* ── Top (after Pitaka): a title that switches listing, then the brands as large cards ── */}
      <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-10 2xl:px-[4%] pt-8 md:pt-14 pb-6 md:pb-8">
        <PageSwitcher
          title={bestsellerOnly ? 'Best sellers' : 'All products'}
          brands={(brandList || []).filter(b => brandCounts[b.name])}
          collections={appCategories || []}
        />
        <p className="mt-1.5 text-[14px] text-[#6b6b73]">
          {bestsellerOnly
            ? t('Our real top sellers, ranked by units sold.')
            : allProducts.length > 0 ? t('{n} products from GERnétic, Zorah and Naya Lumière.', { n: allProducts.length }) : '\u00a0'}
        </p>
        {(brandList || []).some(b => brandCounts[b.name]) && (
          <div className="mt-7 md:mt-9 max-w-[1320px]">
            <BrandCards
              brands={(brandList || []).filter(b => brandCounts[b.name])}
              selected={selectedBrands}
              onToggle={(name) => setSelectedBrands(prev => (prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]))}
              counts={brandCounts}
            />
          </div>
        )}
      </div>

      {/* ── Content: on desktop the filters run across the top; phones use the Filters drawer ── */}
      <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-10 2xl:px-[4%] py-6 md:py-8">
        <section className="min-w-0">

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-gray-100 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="hidden lg:flex items-center gap-2">
                <FilterDropdown label={t('Price')} active={priceRange[0] > 0 || priceRange[1] < maxPrice}>
                  <PriceFilter priceRange={priceRange} setPriceRange={setPriceRange} maxPrice={maxPrice} />
                </FilterDropdown>
                <button
                  type="button"
                  onClick={() => setShowInStock(!showInStock)}
                  aria-pressed={showInStock}
                  className={`h-9 px-4 rounded-full border text-[12px] font-medium flex items-center gap-1.5 transition-colors ${
                    showInStock ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-700'
                  }`}
                >
                  {showInStock && <Check size={12} strokeWidth={3} />}
                  {t('In stock only')}
                </button>
                {hasActiveFilters && (
                  <button type="button" onClick={clearFilters} className="ms-1 text-[12px] text-gray-500 underline underline-offset-4 hover:text-gray-900">
                    {t('Clear all')}
                  </button>
                )}
              </div>
              <div className="lg:hidden text-[12px] text-gray-500">
                <span className="font-semibold text-gray-900">{countLabel}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden lg:inline text-[12px] font-semibold text-gray-900">{countLabel}</span>
              {/* Mobile filter button */}
              <button
                onClick={() => setIsFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 h-9 px-4 bg-white border border-gray-200 rounded-full text-[11px] font-semibold text-gray-700 hover:border-gray-700 transition-all"
              >
                <Filter size={12} />
                {t('Filters')}
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
                aria-label={t('Sort products')}
                className="h-9 ps-3 pe-8 border border-gray-200 rounded-full text-[11px] font-medium text-gray-700 bg-white appearance-none cursor-pointer focus:outline-none focus:border-gray-700 transition-colors"
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235a5a64' stroke-width='2'><path d='m6 9 6 6 6-6'/></svg>")`,
                  backgroundRepeat: 'no-repeat',
                  // The arrow sits at the end of the field, whichever way the page reads
                  backgroundPosition: textDir === 'rtl' ? 'left 10px center' : 'right 10px center',
                }}
              >
                <option value="featured">{t('Featured')}</option>
                <option value="newest">{t('Newest first')}</option>
                <option value="rating">{t('Best rated')}</option>
                <option value="price-low">{t('Price · low to high')}</option>
                <option value="price-high">{t('Price · high to low')}</option>
              </select>
              {/* View toggle */}
              <div className="hidden sm:flex items-center gap-1 bg-gray-100 p-1 rounded-full">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`w-8 h-7 flex items-center justify-center rounded-full transition-all ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                  aria-label={t('Grid view')}
                >
                  <Grid2X2 size={13} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`w-8 h-7 flex items-center justify-center rounded-full transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                  aria-label={t('List view')}
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
                  {t(chip.label)}
                  <button
                    onClick={chip.remove}
                    aria-label={t('Remove filter {name}', { name: t(chip.label) })}
                    className="text-[#6b6b73] hover:text-gray-900 transition-colors leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={clearFilters}
                className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 transition-colors"
              >
                {t('Clear all')}
              </button>
            </div>
          )}

          {/* Products */}
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
              {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
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
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">{t('No products found')}</h3>
              <p className="text-sm text-gray-500 mb-6">{t('Try adjusting your filters or search')}</p>
              <button
                onClick={clearFilters}
                className="px-8 py-3 bg-gray-900 text-white rounded-full text-[12px] font-semibold hover:bg-purple-700 transition-all"
              >
                {t('Clear filters')}
              </button>
            </motion.div>
          ) : (
            <div className="space-y-12">
              <motion.div
                layout
                className={
                  viewMode === 'list'
                    ? 'flex flex-col gap-4'
                    : 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4'
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
                        backorderable={product.backorderable}
                        backorder_lead_days={product.backorder_lead_days}
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
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#6b6b73] font-medium">
                      {t('{n} of {total}', { n: displayedProducts.length, total: filteredAndSortedProducts.length })}
                    </span>
                  </div>
                  <button
                    onClick={() => setVisibleCount(prev => prev + 12)}
                    className="group flex items-center gap-2 px-7 py-3 bg-gray-900 text-white rounded-full text-[12px] font-semibold hover:bg-purple-700 transition-all shadow-sm active:scale-95"
                  >
                    {t('Show more')}
                    <ArrowRight size={13} className="flip-rtl group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
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
              initial={{ x: textDir === 'rtl' ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: textDir === 'rtl' ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 35, stiffness: 300 }}
              className="absolute end-0 top-0 bottom-0 w-[88%] max-w-sm bg-white shadow-2xl overflow-y-auto rounded-s-3xl flex flex-col"
            >
              <div className="px-7 py-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{t('Filters')}</h2>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-purple-500 font-semibold mt-1">
                      {countLabel}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    aria-label={t('Close')}
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
                  {t(filteredAndSortedProducts.length === 1 ? 'Show {n} product' : 'Show {n} products', { n: filteredAndSortedProducts.length })}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
