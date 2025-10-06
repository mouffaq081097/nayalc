'use client';

import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Filter, SortAsc, Grid, List } from 'lucide-react';

export default function NewArrivalsPage() {
  const [newArrivalProducts, setNewArrivalProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const response = await fetch('/api/products?isNew=true'); // Assuming an API endpoint for new arrivals
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const processedProducts = data.map(product => ({
          ...product,
          price: parseFloat(product.price), // Ensure price is a number
          image: product.imageUrl || null, // Add 'image' property for ProductCard
        }));
        setNewArrivalProducts(processedProducts);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewArrivals();
  }, []);

  if (loading) {
    return <div className="text-center py-16">Loading new arrivals...</div>;
  }

  if (error) {
    return <div className="text-center py-16 text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[var(--brand-rose)] via-white to-[var(--brand-cream)] py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-6 bg-[var(--brand-pink)] text-white">Just Arrived</Badge>
            <h1 className="text-4xl md:text-5xl mb-6">
              <span className="text-gray-900">New </span>
              <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
                Arrivals
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Discover the latest additions to our curated collection of premium beauty products. 
              Each piece represents the pinnacle of luxury and innovation.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <span>• Fresh from Paris</span>
              <span>• Limited Edition</span>
              <span>• Premium Quality</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl text-gray-900">{newArrivalProducts.length} Products</h2>
              <Badge variant="secondary" className="bg-green-100 text-green-800">New This Week</Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <SortAsc className="h-4 w-4 mr-2" />
                Sort
              </Button>
              <div className="flex border border-gray-200 rounded-lg">
                <Button variant="ghost" size="sm" className="border-r">
                  <Grid className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {newArrivalProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button 
              size="lg"
              variant="outline"
              className="border-[var(--brand-pink)] text-[var(--brand-pink)] hover:bg-[var(--brand-pink)] hover:text-white"
            >
              Load More Products
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-gradient-to-r from-[var(--brand-blue)]/5 to-[var(--brand-pink)]/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl md:text-3xl mb-4">
            <span className="text-gray-900">Be the first to know about </span>
            <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
              New Arrivals
            </span>
          </h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join our VIP list and get early access to new products, exclusive previews, and special launch events.
          </p>
          <Button 
            size="lg"
            className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90"
          >
            Join VIP Newsletter
          </Button>
        </div>
      </section>
    </div>
  );
}