'use client';

import { useSearchParams } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import React, { Suspense } from 'react';

const SearchPageContent = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const { products } = useAppContext();

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">{`Search Results for "${query}"`}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

const SearchPage = () => {
  return (
    <Suspense fallback={<div>Loading search results...</div>}>
      <SearchPageContent />
    </Suspense>
  );
};

export default SearchPage;
