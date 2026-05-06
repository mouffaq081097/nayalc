'use client';

import React, { useMemo, useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductCard from '../components/ProductCard';
import { Loader2, Frown, Search, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../components/ui/utils';

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = (searchParams.get('q') || '').trim();
  const [inputValue, setInputValue] = useState(query);
  const [searchedProducts, setSearchedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const resultsLabel = useMemo(() => {
    if (!query) return 'Search the collection';
    if (isLoading) return 'Searching...';
    return `${searchedProducts.length} products found`;
  }, [query, isLoading, searchedProducts.length]);

  const submitQuery = (value) => {
    const next = (value || '').trim();
    if (!next) {
      router.push('/search');
      return;
    }
    router.push(`/search?q=${encodeURIComponent(next)}`);
  };

  useEffect(() => {
    const fetchSearchedProducts = async () => {
      if (!query) {
        setSearchedProducts([]);
        setIsLoading(false);
        setHasError(false);
        return;
      }
      setIsLoading(true);
      setHasError(false);
      try {
        const response = await fetch(`/api/products?search=${query}`);
        if (!response.ok) {
          throw new Error('Failed to fetch search results');
        }
        const data = await response.json();
        setSearchedProducts(data);
      } catch (error) {
        console.error(error);
        setSearchedProducts([]);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchedProducts();
  }, [query]);

  return (
    <div className="min-h-screen bg-[#ffffff] px-4 pb-28 pt-6 md:pb-12 md:pt-12">
      <div className="container mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex flex-col items-center text-center md:mb-10">
            <p className="app-mobile-label mb-2 text-brand-pink">Search</p>
            <h1 className="font-serif text-[34px] font-light leading-[1.05] tracking-tight text-[#1d1d1f] md:text-5xl">
              Find your next ritual.
            </h1>
            <p className="mt-3 text-sm text-neutral-500 md:text-base">{resultsLabel}</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitQuery(inputValue);
            }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-black/[0.06] bg-white/90 px-3 py-2 shadow-sm backdrop-blur-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-[#1d1d1f]">
                <Search size={18} />
              </div>
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                inputMode="search"
                placeholder="Search products, brands, categories…"
                className={cn(
                  'h-11 w-full bg-transparent text-sm font-medium text-[#1d1d1f] outline-none placeholder:text-neutral-400 md:text-base',
                )}
              />
              {inputValue.trim().length > 0 && (
                <Button
                  type="button"
                  variant="pillGlass"
                  size="pillIcon"
                  onClick={() => {
                    setInputValue('');
                    submitQuery('');
                  }}
                  className="border-transparent bg-black/[0.04] hover:bg-black/[0.06]"
                  aria-label="Clear search"
                >
                  <X size={18} />
                </Button>
              )}
              <Button type="submit" variant="pillPrimary" size="pill" className="hidden md:inline-flex">
                Search
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {['Anti-Aging', 'Serums', 'Fragrance', 'Gift Sets'].map((q) => (
                <Button
                  key={q}
                  type="button"
                  variant="pillSecondary"
                  size="pillSm"
                  onClick={() => submitQuery(q)}
                  className="font-black tracking-widest"
                >
                  {q}
                </Button>
              ))}
            </div>
          </form>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-[var(--brand-blue)]" />
          </div>
        ) : hasError ? (
          <div className="mx-auto max-w-xl rounded-[var(--radius-card)] border border-black/[0.06] bg-white/80 p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-[#1d1d1f]">Search is temporarily unavailable.</h2>
            <p className="mt-2 text-sm text-neutral-600">Please try again in a moment.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button type="button" variant="pillPrimary" size="pill" onClick={() => submitQuery(query)}>
                Retry
              </Button>
              <Button type="button" variant="pillSecondary" size="pill" onClick={() => submitQuery('')}>
                Clear
              </Button>
            </div>
          </div>
        ) : searchedProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
            {searchedProducts.map(product => (
              <ProductCard
                key={product.id}
                {...product}
                image={product.imageUrl || product.image}
                imageUrls={product.imageUrl ? [product.imageUrl] : (product.imageUrls || [])}
                originalPrice={product.comparedprice || product.originalPrice}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Frown className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl mb-4">
              {query ? (
                <>
                  No results for{' '}
                  <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
                    “{query}”
                  </span>
                </>
              ) : (
                'Start typing to search.'
              )}
            </h2>
            <p className="text-gray-600 mb-8">Try a different keyword or pick a suggested category above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 rounded-full border-2 border-[var(--cl-purple)]/20 border-t-[var(--cl-purple)] animate-spin" /></div>}>
            <SearchResults />
        </Suspense>
    )
}