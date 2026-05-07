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
      className="py-12 relative overflow-hidden"
      style={{ background: '#ffffff' }}
    >
      {/* Tactile Paper Texture */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none bg-[url('/textures/natural-paper.png')] mix-blend-multiply" />

      {/* Lavender gradient divider replacing the plain border-top */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgb(216,180,254) 30%, rgb(196,167,254) 50%, rgb(216,180,254) 70%, transparent 100%)' }}
      />

      <Container className="relative z-10">
        {/* Section Header */}
        <div className="mb-8 flex flex-row justify-between items-end gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-8 h-px" style={{ background: 'linear-gradient(90deg, rgb(196,167,254), rgb(216,180,254))' }} />
              <span className="text-[10px] md:text-[12px] font-black tracking-[0.22em] uppercase" style={{ color: 'rgb(147,104,236)' }}>
                Tailored Experience
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif text-cl-deep italic leading-tight">
              Just for{' '}
              <span
                className="font-sans not-italic font-black"
                style={{
                  backgroundImage: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                You
              </span>
            </h2>
          </div>

          {/* Soft lavender pill button */}
          <Link
            href="/all-products"
            className="shrink-0 hidden md:inline-flex items-center gap-2 px-6 py-2.5 text-[11px] font-black tracking-widest uppercase rounded-full text-white transition-all duration-300 group border-none"
            style={{
              background: 'linear-gradient(135deg, rgb(216,180,254), rgb(147,104,236))',
              boxShadow: '0 4px 16px rgba(147,104,236,0.24)',
            }}
          >
            View All
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="flex overflow-x-auto md:grid md:grid-cols-4 md:overflow-x-visible snap-x md:snap-none no-scrollbar gap-0 -ml-1.5 md:mx-0">
          {forYouProducts.map((product) => (
            <div
              key={product.id}
              className="pl-1.5 basis-[85%] md:basis-1/4 flex-shrink-0 snap-center md:snap-align-none flex flex-col"
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
