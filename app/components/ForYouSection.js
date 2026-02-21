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
    <section className="pt-6 pb-16 bg-[#FAF9F6] relative overflow-hidden border-t border-gray-100">
      {/* Tactile Paper Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply"></div>
      
      {/* Soft Background Auras */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-brand-blue/[0.02] rounded-full blur-[120px]"></div>
      </div>

      <Container className="relative z-10">
        {/* Section Header */}
        <div className="mb-10 space-y-3">
          <div className="flex items-center gap-3">
             <span className="w-8 h-px bg-brand-pink/30"></span>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink flex items-center gap-2">
                <Sparkles size={10} />
                Tailored Experience
             </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif text-gray-900 italic">
            Just for <span className="font-sans not-italic font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500">You</span>
          </h2>
        </div>

        <div className="flex md:grid overflow-x-auto md:overflow-x-visible snap-x md:snap-none no-scrollbar gap-6 md:gap-8 -mx-4 px-4 md:mx-0 md:px-0 md:grid-cols-4">
          {forYouProducts.map((product) => (
            <div key={product.id} className="min-w-[85%] md:min-w-0 snap-center md:snap-align-none h-full">
                <ProductCard
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    image={product.imageUrl}
                    brandName={product.brandName}
                    stock_quantity={product.stock_quantity}
                    averageRating={product.averageRating}
                    reviewCount={product.reviewCount}
                />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};