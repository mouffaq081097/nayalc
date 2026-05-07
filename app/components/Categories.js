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
    <section
      className="py-12 relative overflow-hidden"
      style={{ background: '#ffffff' }}
    >

      <Container className="relative z-10">
        {/* Section Header */}
        <div className="mb-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <span className="w-8 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgb(216,180,254))' }}></span>
            <span className="text-[10px] md:text-[11px] font-black tracking-[0.22em] uppercase" style={{ color: 'rgb(147,104,236)' }}>Our Departments</span>
            <span className="w-8 h-px" style={{ background: 'linear-gradient(90deg, rgb(216,180,254), transparent)' }}></span>
          </div>
          {/* Decorative rule */}
          <div className="flex justify-center">
            <span className="block w-14 h-px" style={{ background: 'linear-gradient(90deg, rgb(216,180,254), rgb(196,167,254), rgb(216,180,254))' }} />
          </div>
          <h2 className="text-3xl md:text-5xl font-serif italic text-cl-deep leading-tight">
            Curated{' '}
            <span
              className="font-sans not-italic font-black"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Universes
            </span>
          </h2>
        </div>

        {/* Categories Carousel */}
        <Carousel opts={{ align: 'start', loop: true }} className="w-full">
          <CarouselContent className="-ml-4">
            {categories.map((category) => (
              <CarouselItem key={category.id} className="pl-4 basis-[85%] md:basis-1/3 lg:basis-1/4">
                <Link
                  href={category.slug ? `/collections/${category.slug}` : `/collections/${category.id}`}
                  className="block h-full group"
                >
                  <div
                    className="relative h-[380px] w-full overflow-hidden transition-all duration-500"
                    style={{
                      borderRadius: '1.75rem',
                      boxShadow: '0 4px 24px rgba(147,104,236,0.10)',
                    }}
                  >
                    {/* Full-bleed image */}
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="(max-width: 768px) 85vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                    />

                    {/* Gradient overlay — always visible at bottom */}
                    <div
                      className="absolute inset-0 transition-opacity duration-500"
                      style={{
                        background: 'linear-gradient(to top, rgba(30,5,60,0.80) 0%, rgba(30,5,60,0.30) 45%, transparent 75%)',
                      }}
                    />

                    {/* Text content — always visible */}
                    <div className="absolute inset-x-0 bottom-0 px-5 pb-6 text-left">
                      <p className="text-[9px] font-black tracking-[0.22em] uppercase mb-1.5" style={{ color: 'rgba(216,180,254,0.85)' }}>
                        Explore
                      </p>
                      <h3 className="text-xl font-serif italic font-bold leading-snug text-white">
                        {category.name}
                      </h3>
                      {/* Arrow that slides on hover */}
                      <div className="mt-2 flex items-center gap-1.5 overflow-hidden">
                        <span
                          className="block h-px transition-all duration-500 group-hover:w-8"
                          style={{
                            width: '20px',
                            background: 'linear-gradient(90deg, rgb(216,180,254), rgb(196,167,254))',
                          }}
                        />
                        <ArrowRight
                          size={13}
                          className="transition-transform duration-500 group-hover:translate-x-1"
                          style={{ color: 'rgb(216,180,254)' }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
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
