'use client';

import React, { useState, useEffect } from 'react'; // Added useState and useEffect
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function PairItWithSection({ currentCartItems }) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [suggestedProducts, setSuggestedProducts] = useState([]); // State to store fetched suggestions

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch('/api/products/suggestions?limit=4'); // Fetch 4 random suggestions
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSuggestedProducts(data);
      } catch (error) {
        console.error("Error fetching product suggestions:", error);
        setSuggestedProducts([]);
      }
    };

    fetchSuggestions();
  }, []); // Run once on component mount

  // Filter out products already in the cart from the fetched suggestions
  const filteredSuggestions = suggestedProducts.filter(suggestedProduct => 
    !currentCartItems.some(cartItem => cartItem.id === suggestedProduct.id)
  );

  if (filteredSuggestions.length === 0) {
    return null;
  }

  const handleAddToCart = (product) => {
    addToCart(product, 1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-medium mb-4">Pair it with...</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredSuggestions.map((product) => (
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
