'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useAppContext } from '../context/AppContext';
import { headingFont } from '../components/home/SectionHeading';
import { searchCatalog } from '@/lib/search';
import { slugify } from '@/lib/slugify';
import { orderableQty } from '@/lib/backorderRules';

const SUGGESTIONS = ['Anti-Aging', 'Serums', 'Hydration', 'Fragrance', 'Gift Sets', 'GERnétic'];
const GRID = 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4';
const chip = 'inline-flex items-center px-5 py-2 rounded-full text-[14px] transition-colors';

// ProductCard takes the catalogue fields under its own prop names
const cardProps = (p) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  originalPrice: p.comparedprice,
  image: p.imageUrl,
  averageRating: p.averageRating,
  reviewCount: p.reviewCount,
  viewCount: p.viewCount,
  isNew: p.isNew,
  isBestseller: p.isBestseller,
  brandName: p.brand,
  stock_quantity: p.stock_quantity,
  backorderable: p.backorderable,
  backorder_lead_days: p.backorder_lead_days,
  imageUrls: p.additionalImagesData?.map((img) => img.url) || [],
});

function PlaceholderGrid() {
  return (
    <div className={GRID} aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[2/3] md:aspect-[3/4] bg-[#f6f5f2] animate-pulse motion-reduce:animate-none" />
          <div className="mt-2.5 grid gap-1.5">
            <span className="h-2.5 w-3/4 bg-[#eeece8]" />
            <span className="h-2.5 w-1/3 bg-[#eeece8]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = (searchParams.get('q') || '').trim();
  const [input, setInput] = useState(query);
  const { products, concerns, categories, brands, loading } = useAppContext();

  useEffect(() => { setInput(query); }, [query]);

  const result = useMemo(
    () => searchCatalog(products || [], query, { concerns, categories, brands }),
    [products, query, concerns, categories, brands],
  );

  // Shortcuts to whole brands, collections and concerns the query names
  const links = [
    ...result.brands.map((b) => ({ key: `b${b.id}`, label: b.name, href: `/brand/${b.slug || slugify(b.name)}` })),
    ...result.collections.map((c) => ({ key: `c${c.id}`, label: c.name, href: `/collections/${c.slug || c.id}` })),
    ...result.concerns.map((c) => ({ key: `k${c.id}`, label: c.name, href: `/all-products?concern=${encodeURIComponent(c.slug || c.id)}` })),
  ];

  // For an empty result: concerns that actually have products, and the best sellers
  const taggedConcerns = useMemo(() => {
    const tagged = new Set();
    (products || []).forEach((p) => (p.concern_ids || []).forEach((id) => tagged.add(Number(id))));
    return (concerns || []).filter((c) => tagged.has(Number(c.id)));
  }, [products, concerns]);
  const bestSellers = useMemo(
    () => (products || []).filter((p) => orderableQty(p) > 0)
      .sort((a, b) => (Number(!!b.isBestseller) - Number(!!a.isBestseller)) || (Number(b.totalSold || 0) - Number(a.totalSold || 0)))
      .slice(0, 4),
    [products],
  );

  const go = (value) => {
    const next = (value || '').trim();
    router.push(next ? `/search?q=${encodeURIComponent(next)}` : '/search');
  };

  const count = result.products.length;
  const summary = !query
    ? 'Search products, brands, collections and skin concerns.'
    : loading
      ? 'Searching…'
      : result.close
        ? `No exact matches. Showing ${count} close ${count === 1 ? 'match' : 'matches'} for “${query}”.`
        : `${count} ${count === 1 ? 'product' : 'products'} for “${query}”`;

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-10 2xl:px-[4%] pt-8 md:pt-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className={`${headingFont} text-[28px] md:text-[40px] font-medium uppercase tracking-[0.02em] text-[#111114]`}>Search</h1>
          <p className="mt-2 text-[14px] text-[#6b6b73]" aria-live="polite">{summary}</p>

          <form onSubmit={(e) => { e.preventDefault(); go(input); }} className="mt-6 flex items-center gap-3 border-b border-[#111114] pb-3 text-left">
            <Search size={22} strokeWidth={1.5} className="shrink-0 text-[#111114]" />
            <label htmlFor="search-page-input" className="sr-only">Search</label>
            <input
              id="search-page-input"
              type="search"
              inputMode="search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search"
              className="flex-1 min-w-0 bg-transparent text-[17px] text-[#111114] outline-none placeholder:text-[#6b6b73] [&::-webkit-search-cancel-button]:hidden"
            />
            {input && (
              <button type="button" onClick={() => { setInput(''); go(''); }} aria-label="Clear search" className="shrink-0 p-1 text-[#111114]">
                <X size={22} strokeWidth={1.5} />
              </button>
            )}
            <button type="submit" className="sr-only">Search</button>
          </form>

          {!query && (
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              {SUGGESTIONS.map((q) => (
                <button key={q} type="button" onClick={() => go(q)} className={`${chip} bg-[#f6f5f2] text-[#111114] hover:bg-[#ebe9e4]`}>{q}</button>
              ))}
            </div>
          )}

          {query && links.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              {links.map((l) => (
                <Link key={l.key} href={l.href} className={`${chip} border border-[#111114] text-[#111114] hover:bg-[#111114] hover:text-white`}>{l.label}</Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 md:mt-14">
          {query && loading ? (
            <PlaceholderGrid />
          ) : count > 0 ? (
            <div className={GRID}>
              {result.products.map((p) => <ProductCard key={p.id} {...cardProps(p)} />)}
            </div>
          ) : query ? (
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-[20px] md:text-[24px] font-semibold text-[#111114]">No results for “{query}”</h2>
              <p className="mt-2 text-[14px] text-[#6b6b73]">Check the spelling, or start from a skin concern.</p>
              {taggedConcerns.length > 0 && (
                <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                  {taggedConcerns.map((c) => (
                    <Link key={c.id} href={`/all-products?concern=${encodeURIComponent(c.slug || c.id)}`} className={`${chip} border border-[#e7e6e2] text-[#111114] hover:border-[#111114]`}>{c.name}</Link>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* Best sellers fill an empty page, with or without a query */}
          {!loading && count === 0 && bestSellers.length > 0 && (
            <section className="mt-14">
              <h2 className={`${headingFont} mb-5 text-center text-[20px] md:text-[26px] font-medium uppercase tracking-[0.02em] text-[#111114]`}>Best sellers</h2>
              <div className={GRID}>
                {bestSellers.map((p) => <ProductCard key={p.id} {...cardProps(p)} />)}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <SearchResults />
    </Suspense>
  );
}
