"use client";
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Crown, Star, Gift } from 'lucide-react';

const CollectionsGrid = dynamic(() => import('../components/CollectionsGrid'));
const FeaturedCollection = dynamic(() => import('../components/FeaturedCollection'));

export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch collections');
        }
        const data = await response.json();
        setCollections(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCollections();
  }, []);

  const featuredCollection = useMemo(() => {
    if (collections.length === 0) {
      return null;
    }

    return collections.reduce((max, collection) => 
      (collection.productsCount > max.productsCount ? collection : max), collections[0]
    );
  }, [collections]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[var(--brand-rose)] via-white to-[var(--brand-cream)] py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] text-white">
              Curated Collections
            </Badge>
            <h1 className="text-4xl md:text-6xl mb-6">
              <span className="text-gray-900">Signature </span>
              <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
                Collections
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Discover our carefully curated beauty collections, each telling a unique story 
              through expertly matched products that work in perfect harmony.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <span>• Hand-Selected Products</span>
              <span>• Seasonal Themes</span>
              <span>• Limited Editions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl text-gray-900">{collections.length} Collections</h2>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm">All Collections</Button>
              <Button variant="outline" size="sm">New Arrivals</Button>
              <Button variant="outline" size="sm">Limited Edition</Button>
              <Button variant="outline" size="sm">Bestsellers</Button>
              <Button variant="outline" size="sm">Holiday</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Collections Grid */}
      <CollectionsGrid collections={collections} />

      {/* Featured Collection */}
      {featuredCollection && <FeaturedCollection featuredCollection={featuredCollection} />}

      {/* Collection Benefits */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Why Choose Our Collections</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Each collection is thoughtfully designed to provide a complete beauty experience 
              with perfectly coordinated products that work beautifully together.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--brand-blue)]/10 to-[var(--brand-blue)]/5 rounded-2xl mb-4">
                <Crown className="h-8 w-8 text-[var(--brand-blue)]" />
              </div>
              <h3 className="text-xl mb-3">Expert Curation</h3>
              <p className="text-gray-600">
                Hand-selected by our beauty experts to ensure perfect harmony and exceptional results.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--brand-pink)]/10 to-[var(--brand-pink)]/5 rounded-2xl mb-4">
                <Star className="h-8 w-8 text-[var(--brand-pink)]" />
              </div>
              <h3 className="text-xl mb-3">Exclusive Value</h3>
              <p className="text-gray-600">
                Collections offer better value than individual purchases while ensuring product compatibility.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--brand-blue)]/8 to-[var(--brand-pink)]/8 rounded-2xl mb-4">
                <Gift className="h-8 w-8 text-[var(--brand-blue)]" />
              </div>
              <h3 className="text-xl mb-3">Beautiful Presentation</h3>
              <p className="text-gray-600">
                Luxurious packaging makes collections perfect for gifting or treating yourself.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}