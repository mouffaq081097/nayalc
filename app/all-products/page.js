"use client";

import { useState, useEffect, useMemo } from 'react';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Grid3x3, List, Search, Filter, SlidersHorizontal, Package } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAppContext } from '../context/AppContext';

export default function AllProductsPage() {
  const { products: allProducts, categories: appCategories, fetchProducts } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(appCategories.map(cat => cat.name.toLowerCase()));
    return ['all', ...Array.from(uniqueCategories)];
  }, [appCategories]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = allProducts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase()) // Assuming brand is also searchable
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product =>
        product.categoryNames && product.categoryNames.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // Sort products
    switch (sortBy) {
      case 'price-low':
        return filtered.sort((a, b) => a.price - b.price);
      case 'price-high':
        return filtered.sort((a, b) => b.price - a.price);
      case 'rating':
        // Assuming products have a rating property, if not, this will need adjustment
        return filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'newest':
        // Assuming products have a created_at property for sorting by newest
        return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      default: // featured
        return filtered.sort((a, b) => {
          // Assuming products have isBestseller and rating properties
          if (a.isBestseller && !b.isBestseller) return -1;
          if (!a.isBestseller && b.isBestseller) return 1;
          return (b.rating || 0) - (a.rating || 0);
        });
    }
  }, [searchTerm, selectedCategory, sortBy, allProducts]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[var(--brand-rose)] via-white to-[var(--brand-cream)] py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-[var(--brand-blue)] text-white">
                <Package className="h-4 w-4 mr-2" />
                Complete Collection
              </Badge>
              <h1 className="text-4xl md:text-5xl mb-6">
                <span className="text-gray-900">All </span>
                <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
                  Products
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Discover our complete collection of luxury beauty products. From skincare essentials 
                to makeup artistry and enchanting fragrances - everything you need for your beauty routine.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90"
                >
                  Shop All Products
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-[var(--brand-pink)] text-[var(--brand-pink)]"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filter & Sort
                </Button>
              </div>
            </div>
            <div className="relative">
              <ImageWithFallback
                src="/Gemini_Generated_Image_1d4x5g1d4x5g1d4x.png"
                alt="Gemini Generated Image of beauty products"
                className="w-full h-[400px] object-cover rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-4 shadow-lg">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
                    {allProducts.length}+ 
                  </div>
                  <div className="text-sm text-gray-600">Products</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Search Bar */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(searchTerm || selectedCategory !== 'all') && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchTerm}
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedCategory !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Category: {selectedCategory}
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl mb-2">
                {selectedCategory === 'all' ? 'All Products' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Products`}
              </h2>
              <p className="text-gray-600">
                Showing {filteredAndSortedProducts.length} of {allProducts.length} products
              </p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
          
          {filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search or filters to find what you&apos;re looking for.
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {filteredAndSortedProducts.map(product => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  image={product.imageUrl}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  isNew={product.isNew}
                  isBestseller={product.isBestseller}
                  category={product.categoryNames}
                  brandName={product.brand}
                />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {filteredAndSortedProducts.length > 0 && (allProducts.length > filteredAndSortedProducts.length) && (
            <div className="text-center mt-12">
              <Button 
                variant="outline" 
                size="lg"
                className="border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[var(--brand-blue)] hover:text-white"
              >
                Load More Products
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Category Quick Links */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl mb-4">Shop by Category</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our curated collections designed to meet all your beauty needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.filter(cat => cat !== 'all').map(category => (
              <div 
                key={category}
                className="bg-gradient-to-br from-[var(--brand-blue)]/10 to-[var(--brand-blue)]/5 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                <div className="text-3xl mb-3">✨</div> {/* Placeholder icon */}
                <h4 className="text-lg mb-2">{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                <p className="text-gray-600 text-sm mb-3">Explore our {category} collection</p>
                <Badge variant="secondary" className="bg-white/80">
                  {allProducts.filter(p => p.categoryNames && p.categoryNames.toLowerCase().includes(category.toLowerCase())).length} products
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}