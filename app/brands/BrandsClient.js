'use client';
import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

// Static metadata for known brands
const BRAND_META = {
  'Gernetic': {
    origin: 'France',
    year: '1976',
    category: 'Advanced Skincare',
    tags: ['CLINICAL', 'BIO-CELLULAR', 'PROFESSIONAL'],
    filterCategory: 'Advanced Skincare',
  },
  'Zorah': {
    origin: 'Canada',
    year: '2008',
    category: 'Natural Beauty',
    tags: ['VEGAN', 'CRUELTY-FREE', 'ORGANIC'],
    filterCategory: 'Skincare',
  },
  'Naya Lumière Perfumes': {
    origin: 'UAE',
    year: '2021',
    category: 'Fragrance & Body',
    tags: ['ARTISAN', 'LUXURY', 'HAND-CRAFTED'],
    filterCategory: 'Fragrance & Body',
  },
};

const FILTER_CATEGORIES = [
  'All',
  'Skincare',
  'Makeup',
  'Haircare',
  'Fragrance & Body',
  'Body & Bath',
  'Advanced Skincare',
];

const ALPHABET = ['All', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

function ProductCard({ product }) {
  const imgSrc = product.imageUrl || product.imageurl || product.image_url || product.images?.[0]?.url || null;
  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="rounded-xl overflow-hidden border border-gray-200 bg-white hover:shadow-md transition-shadow duration-200">
        <div className="relative h-52 bg-gray-50 overflow-hidden">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, 200px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No image</div>
          )}
        </div>
        <div className="p-3">
          <p className="text-xs font-medium text-gray-800 leading-tight line-clamp-2 mb-2">{product.name}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">AED {product.price}</span>
            {product.rating && (
              <span className="flex items-center gap-0.5 text-xs text-amber-500">
                <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                {product.rating}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function BrandCard({ brand, products }) {
  const meta = BRAND_META[brand.name] || {
    origin: 'International',
    year: '',
    category: 'Beauty',
    tags: ['PREMIUM', 'CURATED'],
    filterCategory: 'All',
  };

  const brandProducts = products.filter(p =>
    p.brand_id === brand.id || p.brandName === brand.name || p.brand === brand.name
  );
  const featuredProducts = brandProducts.slice(0, 3);
  const initial = brand.name.charAt(0).toUpperCase();
  const slug = brand.name.toLowerCase().replace(/\s+/g, '-').replace(/[éè]/g, 'e').replace(/[^a-z0-9-]/g, '');

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex flex-col md:flex-row">
        {/* Left panel */}
        <div className="md:w-64 lg:w-72 flex-shrink-0 bg-gray-50/60 border-b md:border-b-0 md:border-r border-gray-200 p-6 flex flex-col gap-4">
          {/* Logo */}
          <div className="w-16 h-16 rounded-xl border border-gray-200 bg-white flex items-center justify-center shadow-sm overflow-hidden">
            {brand.imageurl ? (
              <Image src={brand.imageurl} alt={brand.name} width={64} height={64} className="object-contain w-full h-full p-1" />
            ) : (
              <span className="text-2xl font-bold text-gray-500">{initial}</span>
            )}
          </div>

          {/* Name + meta */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">{brand.name}</h3>
            <p className="text-xs text-gray-500">
              {[meta.origin, meta.year && `Est. ${meta.year}`, meta.category].filter(Boolean).join(' · ')}
            </p>
          </div>

          {/* Attribute tags */}
          <div className="flex flex-wrap gap-1.5">
            {meta.tags.map(tag => (
              <span key={tag} className="text-[10px] font-semibold tracking-wide text-gray-600 border border-gray-200 bg-gray-100/60 rounded-md px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{brandProducts.length}</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Products</p>
            </div>
            <Link href={`/brand/${slug}`} className="btn sm">
              Shop All
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 p-6">
          <p className="text-sm text-gray-500 leading-relaxed mb-5">
            {brand.description}
          </p>

          {featuredProducts.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-3">
                Featured Products
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {featuredProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}

          {featuredProducts.length === 0 && (
            <div className="flex items-center justify-center h-28 rounded-xl border border-dashed border-gray-200 text-sm text-gray-400">
              Products coming soon
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrandsClient() {
  const { brands, products } = useAppContext();
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeLetter, setActiveLetter] = useState('All');

  const filteredBrands = useMemo(() => {
    let list = brands || [];

    if (activeLetter !== 'All') {
      list = list.filter(b => b.name.toUpperCase().startsWith(activeLetter));
    }

    if (activeCategory !== 'All') {
      list = list.filter(b => {
        const meta = BRAND_META[b.name];
        return meta?.filterCategory === activeCategory;
      });
    }

    return list;
  }, [brands, activeCategory, activeLetter]);

  // Only show letters that have brands
  const lettersWithBrands = useMemo(() => {
    const set = new Set((brands || []).map(b => b.name.charAt(0).toUpperCase()));
    return set;
  }, [brands]);

  return (
    <section className="min-h-screen bg-white py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Discover</p>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
            Our Curated Brands
          </h1>
          <p className="text-base text-gray-500 max-w-xl leading-relaxed">
            We partner with visionary founders who share our commitment to clean formulas, ethical sourcing, and uncompromising quality. Every brand is vetted, tested, and loved by our community.
          </p>
        </div>

        {/* Category filter */}
        <div className="mb-4 overflow-x-auto">
          <div className="flex gap-2 pb-1 min-w-max">
            {FILTER_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-sm font-medium px-4 py-2 rounded-full border transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? 'border-transparent text-white'
                    : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                }`}
                style={activeCategory === cat ? { background: 'linear-gradient(135deg, rgb(216,180,254), rgb(147,104,236))' } : {}}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Alphabetical filter */}
        <div className="mb-8 border-b border-gray-200 pb-4 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {ALPHABET.map(letter => {
              const hasItems = letter === 'All' || lettersWithBrands.has(letter);
              const isActive = activeLetter === letter;
              return (
                <button
                  key={letter}
                  onClick={() => hasItems && setActiveLetter(letter)}
                  disabled={!hasItems}
                  className={`w-8 h-8 text-xs font-semibold rounded-md transition-all ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : hasItems
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-gray-300 cursor-default'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Count */}
        <p className="text-sm text-gray-500 mb-6">
          Showing <span className="font-semibold text-gray-800">{filteredBrands.length}</span> of{' '}
          <span className="font-semibold text-gray-800">{(brands || []).length}</span> brands
        </p>

        {/* Brand cards */}
        <div className="space-y-5">
          {filteredBrands.map(brand => (
            <BrandCard key={brand.id} brand={brand} products={products || []} />
          ))}

          {filteredBrands.length === 0 && (
            <div className="text-center py-20 text-[rgba(59,7,100,0.4)]">
              No brands found for the selected filters.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
