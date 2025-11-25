'use client';

import React, { useState, useEffect } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function RecommendationsSection() {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [recommendedProducts, setRecommendedProducts] = useState([]); // State to store fetched recommendations

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch('/api/products/suggestions?limit=4'); // Fetch 4 random recommendations
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setRecommendedProducts(data);
      } catch (error) {
        console.error("Error fetching product recommendations:", error);
        setRecommendedProducts([]);
      }
    };

    fetchRecommendations();
  }, []); // Run once on component mount

  if (recommendedProducts.length === 0) {
    return null;
  }

  const handleAddToCart = (product) => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    addToCart(product, 1);
  };

  return (
    <div className="bg-white rounded-2xl p-6 my-8">
      <h2 className="text-xl font-medium mb-4">Recommendations for you</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {recommendedProducts.map((product) => (
          <div key={product.id} className="flex flex-col items-center text-center">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-white mb-2">
              <ImageWithFallback
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-sm font-medium truncate w-full px-2">{product.name}</p>
            <p className="text-xs text-gray-500">{product.brand}</p>
            <p className="text-xs text-gray-500">AED {parseFloat(product.price).toFixed(2)}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 text-xs h-8"
              onClick={() => handleAddToCart(product)}
            >
              <ShoppingBag className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
