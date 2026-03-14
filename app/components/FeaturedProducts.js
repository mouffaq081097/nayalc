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
    <section className="pt-6 pb-12 bg-[#FAF9F6] relative">
       {/* Tactile Paper Texture */}
       <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply"></div>
       
       {/* Soft Background Auras */}
       <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-brand-pink/[0.02] rounded-full blur-[120px]"></div>
       </div>

      <Container className="relative z-10">
        {/* Section Header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-end gap-5">
          <div className="space-y-3">
             <div className="flex items-center gap-3">
                <span className="w-8 h-px bg-brand-pink/30"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink">Editor's Pick</span>
             </div>
             <h2 className="text-3xl md:text-4xl font-serif text-gray-900 italic">
                Signature <span className="font-sans not-italic font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500">Selection</span>
             </h2>
          </div>

          <Link
            href="/all-products"
            className="group flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-300 shadow-sm"
          >
            View Full Collection
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
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
          <CarouselContent className="-ml-2">
            {displayedProducts.map((product) => (
              <CarouselItem key={product.id} className="pl-2 basis-[85%] md:basis-1/3 lg:basis-1/4">
                <div className="h-full p-1"> {/* Padding for hover effects */}
                    <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
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
            <CarouselPrevious className="left-[-20px] bg-white border-gray-100 hover:bg-brand-pink hover:text-white hover:border-brand-pink transition-colors" />
            <CarouselNext className="right-[-20px] bg-white border-gray-100 hover:bg-brand-pink hover:text-white hover:border-brand-pink transition-colors" />
          </div>
        </Carousel>
      </Container>
    </section>
  );
}