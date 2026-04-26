'use client';
import React from 'react';
import { useAppContext } from '../context/AppContext';
import ProductCard from './ProductCard';
import { Container } from './ui/Container';
import { Sparkles } from 'lucide-react';

export const ForYouSection = () => {
  const { products } = useAppContext();

  // For now, we'll just take a slice of the existing products.
  const forYouProducts = products.slice(0, 8);

  return (
    <section className="py-10 bg-transparent relative overflow-hidden border-t border-[var(--cl-glass-border)]/50">
      {/* Tactile Paper Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/textures/natural-paper.png')] mix-blend-multiply"></div>
      
      {/* Cloud Luxe aura orbs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="cl-aura cl-aura-purple" style={{ width: 400, height: 400, top: '-10%', right: '-10%', opacity: 0.1 }} />
        <div className="cl-aura cl-aura-rose" style={{ width: 300, height: 300, bottom: '-10%', left: '-10%', opacity: 0.15 }} />
      </div>

      <Container className="relative z-10">
        {/* Section Header */}
        <div className="mb-10 space-y-3">
          <div className="flex items-center gap-3">
             <span className="w-8 h-px" style={{ background: 'linear-gradient(90deg, rgb(196,167,254), rgb(216,180,254))' }}></span>
             <span className="text-[10px] md:text-[12px] font-black tracking-widest uppercase" style={{ color: 'rgb(147,104,236)' }}>
                Tailored Experience
             </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif text-cl-deep italic leading-tight">
            Just for{' '}
            <span
              className="font-sans not-italic font-black"
              style={{ backgroundImage: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              You
            </span>
          </h2>
        </div>

        <div className="flex overflow-x-auto md:grid md:grid-cols-4 md:overflow-x-visible snap-x md:snap-none no-scrollbar gap-0 -ml-1.5 md:mx-0">
          {forYouProducts.map((product) => (
            <div key={product.id} className="pl-1.5 basis-[85%] md:basis-1/4 flex-shrink-0 snap-center md:snap-align-none flex flex-col">
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
      </Container>
    </section>
  );
};