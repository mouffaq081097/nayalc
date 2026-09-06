'use client';

import { Carousel, CarouselContent, CarouselItem } from './ui/carousel.tsx';
import { Container } from './ui/Container';
import ProductCard from './ProductCard';
import Link from 'next/link';
import { useAppContext } from '../context/AppContext';

/**
 * Real top 4 best sellers, ranked 1-4 by actual units sold (product.isBestseller /
 * product.totalSold, computed in /api/products from real order line items — see
 * app/api/products/route.js). The rank badge reflects real sales order, so it's
 * independent of the "Signature Selection" carousel's pinned picks.
 */
export function BestSellers() {
  const { products } = useAppContext();
  const topSellers = [...products]
    .filter((p) => p.isBestseller)
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
  });

  return (
    <section className="py-4 relative overflow-hidden bg-white">
      <Container className="relative z-10">
        <div className="mb-4 flex flex-row justify-between items-end gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-gray-400">Most loved</p>
            <h2 className="text-[28px] md:text-[32px] font-bold text-gray-900 leading-tight">Best Sellers</h2>
          </div>
          <Link
            href="/all-products"
            className="shrink-0 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: 'rgb(147,104,236)' }}
          >
            View all →
          </Link>
        </div>

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
