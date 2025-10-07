'use client';
import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Droplets, Leaf, Award, Sparkles } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAppContext } from '../context/AppContext';

const skincareBenefits = [
  {
    icon: Droplets,
    title: 'Deep Hydration',
    description: 'Advanced formulas that penetrate deep for lasting moisture'
  },
  {
    icon: Leaf,
    title: 'Natural Ingredients',
    description: 'Sustainably sourced botanicals and organic extracts'
  },
  {
    icon: Award,
    title: 'Clinically Proven',
    description: 'Dermatologist-tested and scientifically validated results'
  },
  {
    icon: Sparkles,
    title: 'Visible Results',
    description: 'Noticeable improvements in texture, tone, and radiance'
  }
];

export default function SkincarePage() {
  const { fetchProductsByCategory } = useAppContext();
  const [skincareProducts, setSkincareProducts] = useState([]);

  useEffect(() => {
    const getProducts = async () => {
      const products = await fetchProductsByCategory([1, 3, 5, 6, 7, 8]);
      setSkincareProducts(products);
      console.log(products)
    };
    getProducts();
  }, [fetchProductsByCategory]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[var(--brand-rose)] via-white to-[var(--brand-cream)] py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-[var(--brand-blue)] text-white">Premium Skincare</Badge>
              <h1 className="text-4xl md:text-5xl mb-6">
                <span className="text-gray-900">Radiant </span>
                <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
                  Skincare
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Transform your skin with our scientifically advanced skincare collection. 
                From gentle cleansers to powerful serums, each product is crafted for visible results.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90"
                >
                  Shop Skincare
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-[var(--brand-blue)] text-[var(--brand-blue)]"
                >
                  Take Skin Quiz
                </Button>
              </div>
            </div>
            <div className="relative">
              <ImageWithFallback
                src="https://img.freepik.com/free-photo/woman-applying-face-cream_1303-14311.jpg?t=st=1759309544~exp=1759313144~hmac=a2e8b7d959e127279f97ee6b0485d0b1dc4aeec7d4cff75bd90947fa5426d2a5&w=1480"
                alt="Luxury skincare products"
                className="w-full h-[400px] object-cover rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Why Choose Our Skincare</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Each product is formulated with the finest ingredients and cutting-edge technology 
              to deliver exceptional results for all skin types.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {skincareBenefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--brand-blue)]/10 to-[var(--brand-pink)]/10 rounded-2xl mb-4">
                  <benefit.icon className="h-8 w-8 text-[var(--brand-blue)]" />
                </div>
                <h3 className="text-lg mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl">All Skincare Products</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">All Skin Types</Button>
              <Button variant="outline" size="sm">Dry Skin</Button>
              <Button variant="outline" size="sm">Oily Skin</Button>
              <Button variant="outline" size="sm">Sensitive</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {skincareProducts && skincareProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* Routine Guide */}
      <section className="py-16 bg-gradient-to-br from-[var(--brand-blue)]/5 to-[var(--brand-pink)]/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">
              <span className="text-gray-900">Perfect Your </span>
              <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
                Skincare Routine
              </span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get personalized recommendations and expert tips to create the ideal skincare routine for your unique needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="text-4xl mb-4">🌅</div>
              <h3 className="text-xl mb-3">Morning Routine</h3>
              <p className="text-gray-600 mb-4">Start your day with gentle cleansing, vitamin C serum, and SPF protection.</p>
              <Button variant="outline" size="sm">Learn More</Button>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="text-4xl mb-4">🌙</div>
              <h3 className="text-xl mb-3">Evening Routine</h3>
              <p className="text-gray-600 mb-4">Repair and rejuvenate with deep cleansing, treatments, and rich moisturizers.</p>
              <Button variant="outline" size="sm">Learn More</Button>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl mb-3">Weekly Treatments</h3>
              <p className="text-gray-600 mb-4">Enhance your routine with masks, exfoliants, and intensive treatments.</p>
              <Button variant="outline" size="sm">Learn More</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}