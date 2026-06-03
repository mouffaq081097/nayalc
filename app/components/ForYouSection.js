'use client';
import React from 'react';
import { useAppContext } from '../context/AppContext';
import ProductCard from './ProductCard';
import { Container } from './ui/Container';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const ForYouSection = () => {
  const { products } = useAppContext();
  const forYouProducts = products.slice(0, 8);

  return (
    <section
      className="py-6 relative overflow-hidden"
      style={{ background: '#ffffff' }}
    >
      {/* Tactile Paper Texture */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none bg-[url('/textures/natural-paper.png')] mix-blend-multiply" />


<Container className="relative z-10">
        {/* Section Header */}
        <div className="mb-5 flex flex-row justify-between items-end gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-gray-400">For You</p>
            <h2 className="text-[28px] md:text-[32px] font-bold text-gray-900 leading-tight">Just for You</h2>
          </div>
          <Link
            href="/all-products"
            className="shrink-0 hidden md:block text-sm font-medium text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            View all →
          </Link>
        </div>

        <div className="flex overflow-x-auto md:grid md:grid-cols-4 md:overflow-x-visible snap-x md:snap-none no-scrollbar gap-0 -ml-1.5 md:mx-0">
          {forYouProducts.map((product) => (
            <div
              key={product.id}
              className="pl-1.5 basis-1/2 md:basis-1/4 flex-shrink-0 snap-center md:snap-align-none flex flex-col"
            >
              <div className="w-full h-full p-2 flex flex-col">
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  image={product.imageUrl}
                  brandName={product.brandName}
                  stock_quantity={product.stock_quantity}
                  averageRating={product.averageRating}
                  reviewCount={product.reviewCount}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Mobile "View All" */}
        <div className="mt-6 flex justify-center md:hidden">
          <Link
            href="/all-products"
            className="inline-flex items-center gap-2 px-7 py-3 text-[11px] font-black tracking-widest uppercase rounded-full text-white transition-all duration-300 group"
            style={{
              background: 'linear-gradient(135deg, rgb(216,180,254), rgb(147,104,236))',
              boxShadow: '0 4px 16px rgba(147,104,236,0.24)',
            }}
          >
            View All
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </Container>
    </section>
  );
};
