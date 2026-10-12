'use client';

import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './ui/carousel.tsx';
import { Container } from './ui/Container';
import ProductCard from './ProductCard';
import { useAppContext } from '../context/AppContext';
import { SectionHeading } from './home/SectionHeading';

export function FeaturedProducts() {
  const { featuredProducts } = useAppContext();
  // Out-of-stock picks stay off the homepage: a featured product should be one you can buy
  const displayedProducts = featuredProducts.filter((p) => Number(p.stock_quantity) > 0);

  return (
    <section className="py-8 md:py-12 relative overflow-hidden bg-white">

      <Container className="relative z-10">
        <SectionHeading eyebrow="Shop" title="Signature Selection" href="/all-products" linkLabel="View all →" />

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
                    viewCount={product.viewCount}
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
