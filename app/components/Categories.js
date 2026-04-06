'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './ui/carousel.tsx';
import { Container } from './ui/Container';
import { ArrowRight } from 'lucide-react';

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
    <section className="pt-8 pb-6 relative overflow-hidden" style={{ background: 'transparent' }}>
      {/* Cloud Luxe aura orbs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="cl-aura cl-aura-purple" style={{ width: 400, height: 400, top: '-10%', left: '-10%', opacity: 0.35 }} />
        <div className="cl-aura cl-aura-rose" style={{ width: 300, height: 300, bottom: '-10%', right: '-10%', opacity: 0.25 }} />
      </div>

      <Container className="relative z-10">
        {/* Section Header */}
        <div className="mb-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
                <span className="w-8 h-px" style={{ background: 'var(--cl-gradient)' }}></span>
                <span className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: 'var(--cl-text-soft)' }}>Our Departments</span>
                <span className="w-8 h-px" style={{ background: 'var(--cl-gradient)' }}></span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif italic text-gray-900">
                Curated <span className="font-sans not-italic font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500">Universes</span>
            </h2>
        </div>

        {/* Categories Grid */}
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {categories.map((category) => (
              <CarouselItem key={category.id} className="pl-4 basis-[85%] md:basis-1/3 lg:basis-1/4">
                <Link href={category.slug ? `/collections/${category.slug}` : `/collections/${category.id}`} className="block h-full group">
                  <div className="relative h-[350px] w-full rounded-[2rem] overflow-hidden transition-all duration-500 cl-glass-card hover:shadow-cl-card-hover">
                    
                    {/* Image Container */}
                    <div className="absolute inset-0 p-4">
                        <div className="relative w-full h-[75%] rounded-[1.5rem] overflow-hidden bg-gray-50">
                            <Image
                                src={category.image}
                                alt={category.name}
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="absolute inset-x-0 bottom-0 h-[25%] flex flex-col items-center justify-center p-6 text-center">
                        <h3 className="text-lg font-serif italic mb-2 transition-colors duration-300" style={{ color: 'var(--cl-text-deep)' }}>
                            {category.name}
                        </h3>
                        <div className="flex items-center gap-2 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                            <span className="text-[9px] font-bold tracking-widest" style={{ color: 'var(--cl-text-muted)' }}>Explore</span>
                            <ArrowRight size={12} style={{ color: 'var(--cl-purple)' }} />
                        </div>
                    </div>
                  </div>
                </Link>
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