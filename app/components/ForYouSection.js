'use client';
import React from 'react';
import { useAppContext } from '../context/AppContext';
import ProductCard from './ProductCard';
import { Container } from './ui/Container';
import { Carousel, CarouselContent, CarouselItem } from './ui/carousel.tsx';
import Link from 'next/link';

export const ForYouSection = () => {
  const { products } = useAppContext();
  const forYouProducts = products.slice(0, 8);

  return (
    <section className="py-4 relative overflow-hidden bg-white">
      <Container className="relative z-10">
        {/* Section Header */}
        <div className="mb-4 flex flex-row justify-between items-end gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-gray-400">For You</p>
            <h2 className="text-[28px] md:text-[32px] font-bold text-gray-900 leading-tight">Just for You</h2>
          </div>
          <Link
            href="/all-products"
            className="shrink-0 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: 'rgb(147,104,236)' }}
          >
            View all →
          </Link>
        </div>

        {/* Mobile: Carousel — consistent with every other product section */}
        <div className="md:hidden">
          <Carousel opts={{ align: 'start', loop: true }} className="w-full">
            <CarouselContent className="-ml-1.5">
              {forYouProducts.map((product) => (
                <CarouselItem key={product.id} className="pl-1.5 basis-1/2">
                  <div className="p-1.5">
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
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Desktop: 4-col grid */}
        <div className="hidden md:grid md:grid-cols-4 gap-3">
          {forYouProducts.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
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
          ))}
        </div>
      </Container>
    </section>
  );
};
