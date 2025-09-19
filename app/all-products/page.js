'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import ProductCard from '../components/ProductCard';

const AllProductsPage = () => {
  const { products, categories, brands, fetchProducts, loading } = useAppContext();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortOption, setSortOption] = useState('default');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    setSelectedCategories(prev => checked ? [...prev, value] : prev.filter(c => c !== value));
  };

  const handleBrandChange = (e) => {
    const { value, checked } = e.target;
    setSelectedBrands(prev => checked ? [...prev, value] : prev.filter(b => b !== value));
  };
  
  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setPriceRange(prev => ({...prev, [name]: value }));
  }

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    if (selectedCategories.length > 0) {
        filtered = filtered.filter(p => selectedCategories.includes(p.categoryName));
    }

    if (selectedBrands.length > 0) {
        filtered = filtered.filter(p => selectedBrands.includes(p.brandName));
    }
    
    const minPrice = parseFloat(priceRange.min);
    const maxPrice = parseFloat(priceRange.max);

    if (!isNaN(minPrice)) {
        filtered = filtered.filter(p => p.price >= minPrice);
    }
    if (!isNaN(maxPrice)) {
        filtered = filtered.filter(p => p.price <= maxPrice);
    }
    
    switch (sortOption) {
        case 'price-asc':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            filtered.sort((a, b) => b.name.localeCompare(a.name));
            break;
        default:
            break;
    }

    return filtered;
  }, [products, selectedCategories, selectedBrands, priceRange, sortOption]);

  if (loading) {
      return <div className="text-center py-20">Loading...</div>;
  }

  return (
    <div className="bg-brand-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-serif font-bold text-brand-text">All Products</h1>
                <p className="text-brand-muted mt-2 max-w-2xl mx-auto">Browse our entire collection of products.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <aside className="hidden lg:block lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit sticky top-28 z-10">
                    <h3 className="text-xl font-serif font-semibold text-brand-text border-b pb-3 mb-4">Filters</h3>
                    
                    {/* Category Filter */}
                    <div className="mb-6">
                        <h4 className="font-semibold text-brand-text mb-2">Category</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {categories.map(cat => (
                                <label key={cat.id} className="flex items-center text-sm text-brand-muted cursor-pointer">
                                    <input type="checkbox" value={cat.name} onChange={handleCategoryChange} className="h-4 w-4 rounded border-gray-300 text-brand-pink focus:ring-brand-pink" />
                                    <span className="ml-2">{cat.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Brand Filter */}
                    <div className="mb-6">
                        <h4 className="font-semibold text-brand-text mb-2">Brand</h4>
                        <div className="space-y-2">
                            {brands.map(brand => (
                                <label key={brand.id} className="flex items-center text-sm text-brand-muted cursor-pointer">
                                    <input type="checkbox" value={brand.name} onChange={handleBrandChange} className="h-4 w-4 rounded border-gray-300 text-brand-pink focus:ring-brand-pink" />
                                    <span className="ml-2">{brand.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    {/* Price Filter */}
                    <div>
                        <h4 className="font-semibold text-brand-text mb-2">Price</h4>
                         <div className="flex items-center space-x-2">
                            <input type="number" name="min" placeholder="Min" value={priceRange.min} onChange={handlePriceChange} className="w-full border-gray-300 rounded-md p-2 text-sm focus:ring-brand-pink focus:border-brand-pink" />
                            <span className="text-gray-500">-</span>
                            <input type="number" name="max" placeholder="Max" value={priceRange.max} onChange={handlePriceChange} className="w-full border-gray-300 rounded-md p-2 text-sm focus:ring-brand-pink focus:border-brand-pink" />
                        </div>
                    </div>

                </aside>

                {showFilters && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end lg:hidden">
                        <div className="bg-white w-full max-w-sm p-6 overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-serif font-semibold text-brand-text">Filters</h3>
                                <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-gray-700">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            {/* Category Filter */}
                            <div className="mb-6">
                                <h4 className="font-semibold text-brand-text mb-2">Category</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                    {categories.map(cat => (
                                        <label key={cat.id} className="flex items-center text-sm text-brand-muted cursor-pointer">
                                            <input type="checkbox" value={cat.name} onChange={handleCategoryChange} className="h-4 w-4 rounded border-gray-300 text-brand-pink focus:ring-brand-pink" />
                                            <span className="ml-2">{cat.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Brand Filter */}
                            <div className="mb-6">
                                <h4 className="font-semibold text-brand-text mb-2">Brand</h4>
                                <div className="space-y-2">
                                    {brands.map(brand => (
                                        <label key={brand.id} className="flex items-center text-sm text-brand-muted cursor-pointer">
                                            <input type="checkbox" value={brand.name} onChange={handleBrandChange} className="h-4 w-4 rounded border-gray-300 text-brand-pink focus:ring-brand-pink" />
                                            <span className="ml-2">{brand.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Price Filter */}
                            <div>
                                <h4 className="font-semibold text-brand-text mb-2">Price</h4>
                                 <div className="flex items-center space-x-2">
                                    <input type="number" name="min" placeholder="Min" value={priceRange.min} onChange={handlePriceChange} className="w-full border-gray-300 rounded-md p-2 text-sm focus:ring-brand-pink focus:border-brand-pink" />
                                    <span className="text-gray-500">-</span>
                                    <input type="number" name="max" placeholder="Max" value={priceRange.max} onChange={handlePriceChange} className="w-full border-gray-300 rounded-md p-2 text-sm focus:ring-brand-pink focus:border-brand-pink" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Product Grid */}
                <main className="lg:col-span-3 z-20">
                    <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-brand-muted"><span className="font-semibold text-brand-text">{filteredAndSortedProducts.length}</span> products found</p>
                        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="border-gray-300 rounded-md p-2 text-sm focus:ring-brand-pink focus:border-brand-pink">
                            <option value="default">Default Sorting</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="name-asc">Name: A to Z</option>
                            <option value="name-desc">Name: Z to A</option>
                        </select>
                        <button onClick={() => setShowFilters(true)} className="lg:hidden ml-4 p-2 rounded-md bg-brand-blue text-white">
                            Filters
                        </button>
                    </div>

                    {filteredAndSortedProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredAndSortedProducts.map(product => <ProductCard key={product.id} product={product} />)}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-lg shadow-md">
                            <p className="text-xl text-brand-muted">No products match your filters.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    </div>
  );
};

export default AllProductsPage;