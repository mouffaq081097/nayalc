"use client";
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Crown, Star, Gift } from 'lucide-react';

const CollectionsGrid = dynamic(() => import('../components/CollectionsGrid'));
const FeaturedCollection = dynamic(() => import('../components/FeaturedCollection'));

export default function CollectionsListClient() {
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
    <div className="min-h-screen" style={{ background: 'var(--cl-bg)' }}>
      {/* Hero Section */}
      <section className="py-20" style={{ background: '#ffffff' }}>
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 text-white text-xs font-semibold uppercase tracking-wide" style={{ background: 'var(--brand-gradient)' }}>
              Curated Collections
            </Badge>
            <h1 className="text-4xl md:text-6xl mb-6">
              <span style={{ color: 'var(--cl-text-deep)' }}>Signature </span>
              <span className="font-black" style={{ backgroundImage: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Collections
              </span>
            </h1>
            <p className="text-xl mb-8" style={{ color: 'var(--cl-text-light)' }}>
              Discover our carefully curated beauty collections, each telling a unique story
              through expertly matched products that work in perfect harmony.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm" style={{ color: 'var(--cl-text-soft)' }}>
              <span>• Hand-Selected Products</span>
              <span>• Seasonal Themes</span>
              <span>• Limited Editions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="py-8 border-b" style={{ background: 'rgba(255,255,255,0.8)', borderColor: 'var(--cl-glass-border)' }}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl" style={{ color: 'var(--cl-text-deep)' }}>{collections.length} Collections</h2>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" style={{ borderColor: 'var(--cl-glass-border)', color: 'var(--cl-text-mid)' }}>All Collections</Button>
              <Button variant="outline" size="sm" style={{ borderColor: 'var(--cl-glass-border)', color: 'var(--cl-text-mid)' }}>New Arrivals</Button>
              <Button variant="outline" size="sm" style={{ borderColor: 'var(--cl-glass-border)', color: 'var(--cl-text-mid)' }}>Limited Edition</Button>
              <Button variant="outline" size="sm" style={{ borderColor: 'var(--cl-glass-border)', color: 'var(--cl-text-mid)' }}>Bestsellers</Button>
              <Button variant="outline" size="sm" style={{ borderColor: 'var(--cl-glass-border)', color: 'var(--cl-text-mid)' }}>Holiday</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Collections Grid */}
      <CollectionsGrid collections={collections} />

      {/* Featured Collection */}
      {featuredCollection && <FeaturedCollection featuredCollection={featuredCollection} />}

      {/* Collection Benefits */}
      <section className="py-16" style={{ background: 'rgba(255,255,255,0.7)' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4" style={{ color: 'var(--cl-text-deep)' }}>Why Choose Our Collections</h2>
            <p className="max-w-2xl mx-auto" style={{ color: 'var(--cl-text-light)' }}>
              Each collection is thoughtfully designed to provide a complete beauty experience
              with perfectly coordinated products that work beautifully together.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'rgba(147,51,234,0.08)' }}>
                <Crown className="h-8 w-8" style={{ color: 'var(--cl-purple)' }} />
              </div>
              <h3 className="text-xl mb-3" style={{ color: 'var(--cl-text-deep)' }}>Expert Curation</h3>
              <p style={{ color: 'var(--cl-text-light)' }}>
                Hand-selected by our beauty experts to ensure perfect harmony and exceptional results.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'rgba(219,39,119,0.08)' }}>
                <Star className="h-8 w-8" style={{ color: 'var(--cl-pink)' }} />
              </div>
              <h3 className="text-xl mb-3" style={{ color: 'var(--cl-text-deep)' }}>Exclusive Value</h3>
              <p style={{ color: 'var(--cl-text-light)' }}>
                Collections offer better value than individual purchases while ensuring product compatibility.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'rgba(147,51,234,0.06)' }}>
                <Gift className="h-8 w-8" style={{ color: 'var(--cl-purple)' }} />
              </div>
              <h3 className="text-xl mb-3" style={{ color: 'var(--cl-text-deep)' }}>Beautiful Presentation</h3>
              <p style={{ color: 'var(--cl-text-light)' }}>
                Luxurious packaging makes collections perfect for gifting or treating yourself.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
