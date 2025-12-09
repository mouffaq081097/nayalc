import React, { useState, useEffect } from 'react';
import Image from 'next/image'; // Using next/image instead of ImageWithFallback
import Link from 'next/link'; // Import Link
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
          id: cat.id, // Include the category ID
          name: cat.name,
          description: cat.description || 'Explore this category',
          image: cat.imageUrl,
          color: cat.color || 'from-[var(--brand-blue)]/80 to-[var(--brand-pink)]/60' // Default color
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

  if (loading) {
    return <div className="text-center py-16">Loading categories...</div>;
  }

  if (error) {
    return <div className="text-center py-16 text-red-500">Error: {error.message}</div>;
  }

  return (
    <section className="py-8 bg-white"> {/* Added bg-gray-50 back to section */}
      <Container>
        {/* Section Header */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl mb-4">
            <span className="text-gray-900">Explore our </span>
            <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
              Universe
            </span>
          </h2>
          
        </div>

        {/* Categories Grid */}
        <Carousel
          opts={{
            align: "start",
          }}
          className="w-full"
        >
          <CarouselContent>
            {categories.map((category) => (
              <CarouselItem key={category.name} className="basis-1/2 md:basis-1/2 lg:basis-1/3">
                <Link href={category.id === 4 ? '/fragrance' : `/collections/${String(category.id)}`} passHref>
                  <div
                    className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                  >
                    {/* Background Image */}
                    <div className="relative h-80">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 50vw, 33vw"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      
                      {/* Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-t ${category.color} group-hover:opacity-80 transition-opacity duration-300`} />
                    </div>
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                      <h3 className="text-2xl mb-2 group-hover:transform group-hover:-translate-y-1 transition-transform duration-300">
                        {category.name}
                      </h3>
                      <p className="text-white/90 mb-4 group-hover:transform group-hover:-translate-y-1 transition-transform duration-300 delay-75">
                        {category.description}
                      </p>
                      <div className="w-12 h-0.5 bg-white group-hover:w-20 transition-all duration-300 delay-100" />
                    </div>
                    
                    {/* Decorative Element */}
                    <div className="absolute top-4 right-4 w-8 h-8 border border-white/30 rounded-full group-hover:scale-125 group-hover:rotate-90 transition-all duration-300" />
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </Container>
    </section>
  );
}