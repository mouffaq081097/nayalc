'use client'
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Star, Sparkles, Gift } from 'lucide-react';
import Image from 'next/image';

export default function FeaturedCollection({ featuredCollection }) {
  return (
    <section className="py-16 bg-gradient-to-br from-[var(--brand-blue)]/5 to-[var(--brand-pink)]/5">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <Image
              src={featuredCollection.imageUrl}
              alt={featuredCollection.name}
              width={800}
              height={600}
              className="w-full h-[500px] object-cover rounded-2xl shadow-2xl"
            />
            <div className="absolute top-6 left-6">
              <Badge className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] text-white">
                Collection Spotlight
              </Badge>
            </div>
          </div>
          
          <div>
            <h2 className="text-3xl md:text-4xl mb-6">
              <span className="text-gray-900">Collection of the </span>
              <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
                Month
              </span>
            </h2>
            <h3 className="text-2xl text-gray-900 mb-4">{featuredCollection.name}</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              A sophisticated collection inspired by the mysterious allure of midnight in Paris. 
              This exclusive set features deep, rich formulations perfect for creating dramatic 
              evening looks that embody timeless French elegance.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-[var(--brand-pink)]" />
                <span className="text-gray-700">{featuredCollection.productsCount} carefully selected premium products</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-[var(--brand-blue)]" />
                <span className="text-gray-700">Exclusive packaging and presentation</span>
              </div>
              <div className="flex items-center gap-3">
                <Gift className="h-5 w-5 text-[var(--brand-pink)]" />
                <span className="text-gray-700">Complimentary consultation included</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90"
              >
                Shop Collection
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-[var(--brand-blue)] text-[var(--brand-blue)]"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}