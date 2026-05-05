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
    <section className="py-10 relative overflow-hidden bg-transparent">
       {/* Tactile Paper Texture */}
       <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/textures/natural-paper.png')] mix-blend-multiply"></div>
       
       {/* Cloud Luxe aura orbs */}
       <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="cl-aura cl-aura-purple" style={{ width: 400, height: 400, top: '10%', right: '-10%', opacity: 0.15 }} />
        <div className="cl-aura cl-aura-rose" style={{ width: 300, height: 300, bottom: '-10%', left: '-5%', opacity: 0.1 }} />
       </div>

      <Container className="relative z-10">
        {/* Section Header */}
        <div className="mb-8 flex flex-row justify-between items-center gap-4 md:items-end md:gap-6">
          <div className="space-y-1.5 md:space-y-3">
             <div className="flex items-center gap-3">
                <span className="w-5 md:w-8 h-px" style={{ background: 'linear-gradient(90deg, rgb(196,167,254), rgb(216,180,254))' }}></span>
                <span className="text-[10px] md:text-[12px] font-black tracking-widest uppercase" style={{ color: 'rgb(147,104,236)' }}>Editor's Pick</span>
             </div>
             <h2 className="text-3xl md:text-5xl font-serif text-cl-deep italic leading-tight">
                Signature{' '}
                <span
                  className="font-sans not-italic font-black"
                  style={{ backgroundImage: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                >
                  Selection
                </span>
             </h2>
          </div>

          <Link
            href="/all-products"
            className="cl-gradient-btn px-4 py-2.5 md:px-8 md:py-3.5 text-[11px] md:text-[13px] font-black tracking-tight rounded-full transition-all duration-300 group shrink-0 border-none shadow-none"
          >
            <span className="flex items-center gap-2 md:gap-3">
                View All
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>

        {/* Products Grid */}
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-1.5">
            {displayedProducts.map((product) => (
              <CarouselItem key={product.id} className="pl-1.5 basis-[85%] md:basis-1/3 lg:basis-1/4 flex">
                <div className="w-full h-full p-2 flex flex-col"> 
                    <ProductCard
                    key={product.id}
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
          <div className="hidden md:block">
            <CarouselPrevious className="left-[-20px] transition-colors" style={{ background: 'var(--cl-glass)', border: '1px solid var(--cl-glass-border)' }} />
            <CarouselNext className="right-[-20px] transition-colors" style={{ background: 'var(--cl-glass)', border: '1px solid var(--cl-glass-border)' }} />
          </div>
        </Carousel>
      </Container>
    </section>
  );
}