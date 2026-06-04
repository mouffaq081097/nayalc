'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './ui/carousel.tsx';
import { Container } from './ui/Container';

export function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const formattedCategories = data.map(cat => ({
          id: cat.id,
          slug: cat.slug,
          name: cat.name,
          description: cat.description || 'Explore Collection',
          image: cat.imageUrl,
          productCount: cat.productsCount || cat.productCount || cat.product_count || null,
        }));
        setCategories(formattedCategories);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) return null;
  if (error) return null;

  return (
    <section className="py-4 relative overflow-hidden bg-white">
      <Container className="relative z-10">
        {/* Section Header */}
        <div className="mb-4 flex flex-row justify-between items-end gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-gray-400">Browse</p>
            <h2 className="text-[28px] md:text-[32px] font-bold text-gray-900 leading-tight">Shop by Category</h2>
          </div>
          <Link
            href="/all-products"
            className="shrink-0 text-sm font-medium transition-colors"
            style={{ color: 'rgb(147,104,236)' }}
          >
            All categories →
          </Link>
        </div>

        {/* Categories Carousel */}
        <Carousel opts={{ align: 'start', loop: true }} className="w-full">
          <CarouselContent className="-ml-3">
            {categories.map((category) => (
              <CarouselItem key={category.id} className="pl-3 basis-[44%] sm:basis-[30%] md:basis-[22%] lg:basis-[17%]">
                <Link
                  href={category.slug ? `/collections/${category.slug}` : `/collections/${category.id}`}
                  className="block group"
                >
                  <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-all duration-200" style={{ borderWidth: '1.5px' }}>
                    {/* Square contained image area */}
                    <div className="relative bg-gray-50 aspect-square">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        sizes="(max-width: 768px) 44vw, (max-width: 1024px) 22vw, 17vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {/* Name + count */}
                    <div className="px-3 py-3 text-center">
                      <p className="text-[13px] font-semibold text-gray-900 leading-snug">{category.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {category.productCount ? `${category.productCount} products` : 'Explore'}
                      </p>
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="left-[-18px] h-9 w-9 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-all" />
            <CarouselNext className="right-[-18px] h-9 w-9 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-all" />
          </div>
        </Carousel>
      </Container>
    </section>
  );
}
