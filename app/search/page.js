'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '../components/ProductCard';
import { useAppContext } from '../context/AppContext';
import { Loader2, Frown } from 'lucide-react';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const [searchedProducts, setSearchedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSearchedProducts = async () => {
      if (!query) {
        setSearchedProducts([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchedProducts();
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl mb-4">
            <span className="text-gray-900">Search Results for: </span>
            <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
              &quot;{query}&quot;
            </span>
          </h1>
          <p className="text-lg text-gray-600">
            {isLoading ? 'Searching...' : `${searchedProducts.length} products found`}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-[var(--brand-blue)]" />
          </div>
        ) : searchedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {searchedProducts.map(product => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Frown className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl mb-4">No products found for &quot;{query}&quot;</h2>
            <p className="text-gray-600 mb-8">Please try a different search term.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SearchResults />
        </Suspense>
    )
}