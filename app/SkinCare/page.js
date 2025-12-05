'use client';
import React, { useState, useEffect, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Droplets, Leaf, Award, Sparkles, Filter, ArrowDownUp, X } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAppContext } from '../context/AppContext';
import { useRouter } from 'next/navigation';

const skincareBenefits = [
  {
    icon: Droplets,
    title: 'Deep Hydration',
    description: 'Advanced formulas that penetrate deep for lasting moisture'
  },
  {
    icon: Leaf,
    title: 'Natural Ingredients',
    description: 'Sustainably sourced botanicals and organic extracts'
  },
  {
    icon: Award,
    title: 'Clinically Proven',
    description: 'Dermatologist-tested and scientifically validated results'
  },
  {
    icon: Sparkles,
    title: 'Visible Results',
    description: 'Noticeable improvements in texture, tone, and radiance'
  }
];

export default function SkincarePage() {
  const { fetchProductsByCategory } = useAppContext();
  const [skincareProducts, setSkincareProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]); // New state for filtered products
  const [isFilterOpen, setIsFilterOpen] = useState(false); // New state for filter modal
  const [isSortOpen, setIsSortOpen] = useState(false); // New state for sort modal
  const [selectedFilters, setSelectedFilters] = useState({}); // New state for selected filters
  const [selectedSort, setSelectedSort] = useState('default'); // New state for selected sort
  const router = useRouter();

  // Placeholder functions
  const handleFilterClick = () => setIsFilterOpen(!isFilterOpen);
  const handleSortClick = () => setIsSortOpen(!isSortOpen);

  // Function to apply filters and sort (placeholder for now)
  const applyFiltersAndSort = useCallback(() => {
    let products = [...skincareProducts]; // Start with all products

    // Apply filters
    if (selectedFilters.brand) {
      products = products.filter(product =>
        product.brand && product.brand.toLowerCase().includes(selectedFilters.brand.toLowerCase())
      );
    }

    if (selectedFilters.maxPrice !== undefined) {
      products = products.filter(product =>
        product.price <= selectedFilters.maxPrice
      );
    }
    // ... more filter logic here ...

    // Apply sorting
    if (selectedSort === 'price_asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (selectedSort === 'price_desc') {
      products.sort((a, b) => b.price - a.price);
    }
    // ... more sort logic here ...

    setFilteredProducts(products);
  }, [skincareProducts, selectedFilters, selectedSort]);

  useEffect(() => {
    const getProducts = async () => {
      const products = await fetchProductsByCategory([1, 3, 5, 6, 7, 8]);
      setSkincareProducts(products);
      setFilteredProducts(products); // Initialize filtered products
      
    };
    getProducts();
  }, [fetchProductsByCategory]);

  // Apply filters and sort whenever skincareProducts, selectedFilters, or selectedSort changes
  useEffect(() => {
    applyFiltersAndSort();
  }, [skincareProducts, selectedFilters, selectedSort, applyFiltersAndSort]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[var(--brand-rose)] via-white to-[var(--brand-cream)] py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-[var(--brand-blue)] text-white">Premium Skincare</Badge>
              <h1 className="text-4xl md:text-5xl mb-6">
                <span className="text-gray-900">Radiant </span>
                <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
                  Skincare
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Transform your skin with our scientifically advanced skincare collection. 
                From gentle cleansers to powerful serums, each product is crafted for visible results.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90"
                  onClick={() => {
                    document.getElementById('skincare-products-grid').scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Shop Skincare
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-[var(--brand-blue)] text-[var(--brand-blue)]"
                  onClick={() => router.push('/skin-quiz')}
                >
                  Take Skin Quiz
                </Button>
              </div>
            </div>
            <div className="relative">
              <ImageWithFallback
                src="https://img.freepik.com/free-photo/woman-applying-face-cream_1303-14311.jpg?t=st=1759309544~exp=1759313144~hmac=a2e8b7d959e127279f97ee6b0485d0b1dc4aeec7d4cff75bd90947fa5426d2a5&w=1480"
                alt="Luxury skincare products"
                className="w-full h-[400px] object-cover rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Why Choose Our Skincare</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Each product is formulated with the finest ingredients and cutting-edge technology 
              to deliver exceptional results for all skin types.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {skincareBenefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--brand-blue)]/10 to-[var(--brand-pink)]/10 rounded-2xl">
                  <benefit.icon className="h-8 w-8 text-[var(--brand-blue)]" />
                </div>
                <div>
                  <h3 className="text-lg mb-1 font-semibold">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="skincare-products-grid" className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl">All Skincare Products</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleFilterClick}>
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleSortClick}>
                <ArrowDownUp className="h-4 w-4" />
                Sort
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts && filteredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* Routine Guide */}
      <section className="py-16 bg-gradient-to-br from-[var(--brand-blue)]/5 to-[var(--brand-pink)]/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">
              <span className="text-gray-900">Perfect Your </span>
              <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
                Skincare Routine
              </span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get personalized recommendations and expert tips to create the ideal skincare routine for your unique needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="text-4xl mb-4">🌅</div>
              <h3 className="text-xl mb-3">Morning Routine</h3>
              <p className="text-gray-600 mb-4">Start your day with gentle cleansing, vitamin C serum, and SPF protection.</p>
              <Button variant="outline" size="sm">Learn More</Button>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="text-4xl mb-4">🌙</div>
              <h3 className="text-xl mb-3">Evening Routine</h3>
              <p className="text-gray-600 mb-4">Repair and rejuvenate with deep cleansing, treatments, and rich moisturizers.</p>
              <Button variant="outline" size="sm">Learn More</Button>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl mb-3">Weekly Treatments</h3>
              <p className="text-gray-600 mb-4">Enhance your routine with masks, exfoliants, and intensive treatments.</p>
              <Button variant="outline" size="sm">Learn More</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Modal/Panel */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/2 lg:w-1/3 relative">
            <button
              onClick={() => setIsFilterOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">Filter Products</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="brand-filter" className="mb-2 block">Brand</Label>
                <Input
                  id="brand-filter"
                  placeholder="e.g., The Ordinary"
                  value={selectedFilters.brand || ''}
                  onChange={(e) => setSelectedFilters({ ...selectedFilters, brand: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-2 block">Max Price (AED)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={selectedFilters.maxPrice || 200} // Assuming a max price for now
                    onChange={(e) => setSelectedFilters({ ...selectedFilters, maxPrice: Number(e.target.value) })}
                    className="w-full"
                    min="0"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="200" // Max price should be dynamic based on available products
                  value={selectedFilters.maxPrice || 200}
                  onChange={(e) => setSelectedFilters({ ...selectedFilters, maxPrice: Number(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 mt-2"
                  style={{
                    '--range-thumb-color': 'var(--brand-blue)',
                    '--range-track-color': '#E5E7EB', // light gray
                    '--webkit-slider-thumb-background': 'var(--range-thumb-color)',
                    '--moz-range-thumb-background': 'var(--range-thumb-color)',
                    '--webkit-slider-runnable-track-background': 'var(--range-track-color)',
                    '--moz-range-track-background': 'var(--range-track-color)',
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                className="border-[var(--brand-blue)] text-[var(--brand-blue)]"
                onClick={() => {
                  setSelectedFilters({});
                  applyFiltersAndSort();
                }}
              >
                Clear Filters
              </Button>
              <Button
                className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90"
                onClick={() => {
                  applyFiltersAndSort();
                  setIsFilterOpen(false);
                }}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sort Modal/Panel */}
      {isSortOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/2 lg:w-1/3 relative">
            <button
              onClick={() => setIsSortOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">Sort Products</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sort-by" className="mb-2 block">Sort By</Label>
                <Select value={selectedSort} onValueChange={setSelectedSort}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a sort option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button
                className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90"
                onClick={() => {
                  applyFiltersAndSort();
                  setIsSortOpen(false);
                }}
              >
                Apply Sort
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}