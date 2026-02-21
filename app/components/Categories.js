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
    <section className="pt-8 pb-6 bg-[#FAF9F6] relative overflow-hidden">
      {/* Tactile Paper Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-multiply"></div>
      
      {/* Soft Background Auras */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] -left-[10%] w-[50%] h-[50%] bg-brand-pink/[0.03] rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-brand-blue/[0.03] rounded-full blur-[100px]"></div>
      </div>

      <Container className="relative z-10">
        {/* Section Header */}
        <div className="mb-8 text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
                <span className="w-8 h-px bg-brand-pink/30"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink">Our Departments</span>
                <span className="w-8 h-px bg-brand-pink/30"></span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif text-gray-900 italic">
                Curated <span className="font-sans not-italic font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">Universes</span>
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
                <Link href={category.id === 4 ? '/fragrance' : `/collections/${String(category.id)}`} className="block h-full group">
                  <div className="relative h-[400px] w-full rounded-[2rem] overflow-hidden bg-white border border-gray-100 transition-all duration-500 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] hover:border-brand-pink/20">
                    
                    {/* Image Container */}
                    <div className="absolute inset-0 p-4">
                        <div className="relative w-full h-[70%] rounded-[1.5rem] overflow-hidden bg-gray-50">
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
                    <div className="absolute inset-x-0 bottom-0 h-[30%] flex flex-col items-center justify-center p-6 text-center">
                        <h3 className="text-xl font-serif italic text-gray-900 mb-2 group-hover:text-brand-pink transition-colors duration-300">
                            {category.name}
                        </h3>
                        <div className="flex items-center gap-2 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Explore</span>
                            <ArrowRight size={12} className="text-brand-pink" />
                        </div>
                    </div>
                  </div>
                </Link>
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