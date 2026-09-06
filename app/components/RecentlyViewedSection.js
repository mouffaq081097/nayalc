'use client';

import React, { useMemo } from 'react';
import { Container } from './ui/Container';
import { Carousel, CarouselContent, CarouselItem } from './ui/carousel.tsx';
import ProductCard from './ProductCard';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';

export function RecentlyViewedSection({ excludeId } = {}) {
  const { items, hydrated, clear } = useRecentlyViewed();
  const visible = useMemo(
    () => items.filter((p) => p.id !== excludeId).slice(0, 8),
    [items, excludeId]
  );

  if (!hydrated || visible.length === 0) return null;

  return (
    <section className="py-2 relative overflow-hidden bg-white">
      <Container className="relative z-10">
        {/* Section Header */}
        <div className="mb-4 flex flex-row justify-between items-end gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-gray-400">Previously Viewed</p>
            <h2 className="text-[28px] md:text-[32px] font-bold text-gray-900 leading-tight">Pick up where you left off</h2>
          </div>
          <button
            onClick={clear}
            className="shrink-0 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: 'rgb(147,104,236)' }}
          >
            Clear history →
          </button>
        </div>

        {/* Mobile: Carousel — consistent with every other product section */}
        <div className="md:hidden">
          <Carousel opts={{ align: 'start', loop: true }} className="w-full">
            <CarouselContent className="-ml-1.5">
              {visible.map((product) => (
                <CarouselItem key={product.id} className="pl-1.5 basis-1/2">
                  <div className="p-1.5">
                    <ProductCard
                      id={product.id}
                      slug={product.slug}
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
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Desktop: 4-col grid */}
        <div className="hidden md:grid md:grid-cols-4 gap-3">
          {visible.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              slug={product.slug}
              name={product.name}
              price={product.price}
              originalPrice={product.originalPrice}
              image={product.imageUrl}
              brandName={product.brandName}
              stock_quantity={product.stock_quantity}
              averageRating={product.averageRating}
              reviewCount={product.reviewCount}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
