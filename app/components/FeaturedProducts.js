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
    <section className="py-12 relative overflow-hidden bg-white">

      <Container className="relative z-10">
        {/* Section Header */}
        <div className="mb-8 flex flex-row justify-between items-center gap-4 md:items-end md:gap-6">
          <div className="relative space-y-1.5 md:space-y-3">
            {/* Decorative editorial number */}
            <span
              className="absolute -top-8 -left-2 font-serif font-black select-none pointer-events-none leading-none"
              style={{
                fontSize: 'clamp(80px, 10vw, 120px)',
                color: 'transparent',
                WebkitTextStroke: '1px rgba(196,167,254,0.18)',
                lineHeight: 1,
              }}
              aria-hidden="true"
            >
              01
            </span>

            <div className="flex items-center gap-3">
              <span className="w-5 md:w-8 h-px" style={{ background: 'linear-gradient(90deg, rgb(196,167,254), rgb(216,180,254))' }} />
              <span className="text-[10px] md:text-[12px] font-black tracking-[0.22em] uppercase" style={{ color: 'rgb(147,104,236)' }}>Editor's Pick</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif text-cl-deep italic leading-tight">
              Signature{' '}
              <span
                className="font-sans not-italic font-black"
                style={{
                  backgroundImage: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Selection
              </span>
            </h2>
          </div>

          {/* Soft lavender pill button */}
          <Link
            href="/all-products"
            className="shrink-0 inline-flex items-center gap-2 md:gap-3 px-5 py-2.5 md:px-8 md:py-3.5 text-[11px] md:text-[13px] font-black tracking-widest uppercase rounded-full text-white transition-all duration-300 group border-none shadow-none"
            style={{
              background: 'linear-gradient(135deg, rgb(216,180,254), rgb(147,104,236))',
              boxShadow: '0 4px 16px rgba(147,104,236,0.28)',
            }}
          >
            View All
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Products Carousel */}
        <Carousel opts={{ align: 'start', loop: true }} className="w-full">
          <CarouselContent className="-ml-1.5">
            {displayedProducts.map((product) => (
              <CarouselItem key={product.id} className="pl-1.5 basis-[85%] md:basis-1/3 lg:basis-1/4 flex">
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
