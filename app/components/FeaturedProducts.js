'use client';

import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './ui/carousel.tsx';
import { Container } from './ui/Container';
import ProductCard from './ProductCard';
import Link from 'next/link';
import { useAppContext } from '../context/AppContext';
import { ArrowRight } from 'lucide-react';

export function FeaturedProducts() {
  const { featuredProducts } = useAppContext();
  const displayedProducts = featuredProducts;

  return (
    <section className="py-6 relative overflow-hidden bg-white">

      <Container className="relative z-10">
        {/* Section Header */}
        <div className="mb-5 flex flex-row justify-between items-end gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-gray-400">Shop</p>
            <h2 className="text-[28px] md:text-[32px] font-bold text-gray-900 leading-tight">Signature Selection</h2>
          </div>
          <Link
            href="/all-products"
            className="shrink-0 text-sm font-medium text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            View all →
          </Link>
        </div>

        {/* Products Carousel */}
        <Carousel opts={{ align: 'start', loop: true }} className="w-full">
          <CarouselContent className="-ml-1.5">
            {displayedProducts.map((product) => (
              <CarouselItem key={product.id} className="pl-1.5 basis-1/2 md:basis-1/3 lg:basis-1/4 flex">
                <div
                  className="w-full h-full p-2 flex flex-col transition-all duration-300 rounded-2xl"
                  style={{ '--hover-shadow': '0 4px 24px rgba(147,51,234,0.08)' }}
                >
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    image={product.imageUrl}
                    averageRating={product.averageRating}
                    reviewCount={product.reviewCount}
                    category={product.categoryName || product.category}
                    brandName={product.brandName}
                    stock_quantity={product.stock_quantity}
                    isNew={product.isNew}
                    isBestseller={product.isBestseller}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Glass pill navigation arrows */}
          <div className="hidden md:block">
            <CarouselPrevious
              className="left-[-18px] h-10 w-10 rounded-full transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(196,167,254,0.45)',
                boxShadow: '0 2px 12px rgba(147,104,236,0.12)',
              }}
            />
            <CarouselNext
              className="right-[-18px] h-10 w-10 rounded-full transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(196,167,254,0.45)',
                boxShadow: '0 2px 12px rgba(147,104,236,0.12)',
              }}
            />
          </div>
        </Carousel>
      </Container>
    </section>
  );
}
