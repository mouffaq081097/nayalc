'use client';
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import { Icon } from '../components/Icon';

const ProductsPage = () => {
    const { products, categories, brands } = useAppContext();
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [sortBy, setSortBy] = useState('name-asc');

    const handleCategoryChange = (categoryId) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleBrandChange = (brandId) => {
        setSelectedBrands(prev =>
            prev.includes(brandId)
                ? prev.filter(id => id !== brandId)
                : [...prev, brandId]
        );
    };

    const filteredAndSortedProducts = useMemo(() => {
        let filtered = products;

        if (selectedCategories.length > 0) {
            filtered = filtered.filter(p => p.categoryIds && p.categoryIds.some(catId => selectedCategories.includes(catId)));
        }

        if (selectedBrands.length > 0) {
            filtered = filtered.filter(p => selectedBrands.includes(p.brand_id));
        }

        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'price-asc':
                    return a.price - b.price;
                case 'price-desc':
                    return b.price - a.price;
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                default:
                    return 0;
            }
        });
    }, [products, selectedCategories, selectedBrands, sortBy]);

    const FilterSidebar = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-3">Categories</h3>
                <div className="space-y-2">
                    {categories.map(c => (
                        <div key={c.id} className="flex items-center">
                            <input
                                type="checkbox"
                                id={`cat-${c.id}`}
                                checked={selectedCategories.includes(c.id)}
                                onChange={() => handleCategoryChange(c.id)}
                                className="h-4 w-4 rounded border-gray-300 text-brand-pink focus:ring-brand-pink"
                            />
                            <label htmlFor={`cat-${c.id}`} className="ml-3 text-sm text-gray-600">{c.name}</label>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-3">Brands</h3>
                <div className="space-y-2">
                    {brands.map(b => (
                        <div key={b.id} className="flex items-center">
                            <input
                                type="checkbox"
                                id={`brand-${b.id}`}
                                checked={selectedBrands.includes(b.id)}
                                onChange={() => handleBrandChange(b.id)}
                                className="h-4 w-4 rounded border-gray-300 text-brand-pink focus:ring-brand-pink"
                            />
                            <label htmlFor={`brand-${b.id}`} className="ml-3 text-sm text-gray-600">{b.name}</label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-serif font-bold text-brand-text">All Products</h1>
                <p className="text-brand-muted mt-2 max-w-2xl mx-auto">Explore our full range of premium beauty and skincare products.</p>
            </div>

            <div className="flex">
                {/* Desktop Filters */}
                <aside className="hidden lg:block w-1/4 pr-8">
                    <FilterSidebar />
                </aside>

                <main className="w-full lg:w-3/4">
                    {/* Toolbar */}
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={() => setIsFiltersOpen(true)} className="lg:hidden flex items-center space-x-2 px-4 py-2 border rounded-md">
                            <Icon name="filter" className="w-5 h-5" />
                            <span>Filters</span>
                        </button>
                        <div className="flex items-center space-x-2">
                            <label htmlFor="sort-by" className="text-sm">Sort by:</label>
                            <select
                                id="sort-by"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="border-gray-300 rounded-md shadow-sm focus:border-brand-pink focus:ring-brand-pink text-sm"
                            >
                                <option value="name-asc">Name: A-Z</option>
                                <option value="name-desc">Name: Z-A</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                            </select>
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredAndSortedProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </main>
            </div>

            {/* Mobile Filter Modal */}
            {isFiltersOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setIsFiltersOpen(false)}></div>
                    <div className="relative w-4/5 max-w-sm h-full bg-white shadow-xl p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-serif">Filters</h2>
                            <button onClick={() => setIsFiltersOpen(false)} className="p-2">
                                <Icon name="x" className="w-6 h-6" />
                            </button>
                        </div>
                        <FilterSidebar />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsPage;