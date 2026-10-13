'use client';

import { Carousel, CarouselContent, CarouselItem } from './ui/carousel.tsx';
import { Container } from './ui/Container';
import ProductCard from './ProductCard';
import { useAppContext } from '../context/AppContext';
import { SectionHeading } from './home/SectionHeading';
import { orderableQty } from '@/lib/backorderRules';

/**
 * Real top 4 best sellers, ranked 1-4 by actual units sold (product.isBestseller /
 * product.totalSold, computed in /api/products from real order line items — see
 * app/api/products/route.js). The rank badge reflects real sales order, so it's
 * independent of the "Signature Selection" carousel's pinned picks.
 */
export function BestSellers() {
  const { products } = useAppContext();
  const topSellers = [...products]
    .filter((p) => p.isBestseller && orderableQty(p) > 0)
    .sort((a, b) => Number(b.totalSold || 0) - Number(a.totalSold || 0))
    .slice(0, 4);

  if (topSellers.length === 0) return null;

  const cardProps = (product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice,
    image: product.imageUrl,
    averageRating: product.averageRating,
    reviewCount: product.reviewCount,
    viewCount: product.viewCount,
    brandName: product.brandName,
    stock_quantity: product.stock_quantity,
    backorderable: product.backorderable,
    backorder_lead_days: product.backorder_lead_days,
  });

  return (
    <section className="py-8 md:py-12 relative overflow-hidden bg-white">
      <Container className="relative z-10">
        <SectionHeading eyebrow="Most loved" title="Best Sellers" href="/all-products" linkLabel="View all →" />

        {/* Mobile: carousel */}
        <div className="md:hidden">
          <Carousel opts={{ align: 'start', loop: false }} className="w-full">
            <CarouselContent className="-ml-2">
              {topSellers.map((product, i) => (
                <CarouselItem key={product.id} className="pl-2 basis-1/2">
                  <ProductCard {...cardProps(product)} rank={i + 1} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Desktop: 4-col grid */}
        <div className="hidden md:grid md:grid-cols-4 gap-2">
          {topSellers.map((product, i) => (
            <ProductCard key={product.id} {...cardProps(product)} rank={i + 1} />
          ))}
        </div>
      </Container>
    </section>
  );
}
