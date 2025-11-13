'use client';
import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppContext } from '../../context/AppContext';
import ProductCard from '../../components/ProductCard';
import { Button } from '../../components/ui/button';
import { useRouter } from 'next/navigation';
import { Loader2, Frown } from 'lucide-react';

function SkinQuizResults() {
  const searchParams = useSearchParams();
  const { products, fetchProducts } = useAppContext();
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const answers = useMemo(() => ({
    skinType: searchParams.get('skinType'),
    skinConcerns: searchParams.getAll('skinConcerns'),
    texturePreference: searchParams.get('texturePreference'),
  }), [searchParams]);

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, [products, fetchProducts]);

  useEffect(() => {
    if (products.length > 0) {
      setIsLoading(true);
      
      // Simple recommendation logic
      const getRecommendations = () => {
        let filtered = [...products];

        // This is a placeholder logic. You should refine this based on your product data.
        // For example, you might have tags or categories on your products.
        if (answers.skinType) {
            // Example: if skin type is "Dry", recommend products with "hydrating" in description
            if (answers.skinType === 'Dry') {
                filtered = filtered.filter(p => p.description.toLowerCase().includes('hydrat'));
            }
            if (answers.skinType === 'Oily') {
                filtered = filtered.filter(p => p.description.toLowerCase().includes('oily') || p.description.toLowerCase().includes('clarifying'));
            }
        }

        if (answers.skinConcerns && answers.skinConcerns.length > 0) {
            filtered = filtered.filter(p => 
                answers.skinConcerns.some(concern => 
                    p.description.toLowerCase().includes(concern.split(' ')[0].toLowerCase())
                )
            );
        }
        
        // If still too many products, randomly pick a few
        if (filtered.length > 6) {
          filtered = filtered.sort(() => 0.5 - Math.random()).slice(0, 6);
        }

        setRecommendedProducts(filtered);
        setIsLoading(false);
      };

      getRecommendations();
    }
  }, [answers, products]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl mb-4">
            <span className="text-gray-900">Your Personalized </span>
            <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
              Skincare Routine
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Based on your answers, here are the products we think you'll love.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-[var(--brand-blue)]" />
          </div>
        ) : recommendedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recommendedProducts.map(product => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Frown className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl mb-4">No products match your criteria</h2>
            <p className="text-gray-600 mb-8">We couldn't find any products that match your specific needs. Please try the quiz again with different options.</p>
          </div>
        )}

        <div className="text-center mt-12">
          <Button onClick={() => router.push('/skin-quiz')}>
            Take the Quiz Again
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function SkinQuizResultsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SkinQuizResults />
        </Suspense>
    )
}
