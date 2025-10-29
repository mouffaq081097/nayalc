'use client';
import React from 'react';
import { useAppContext } from '../context/AppContext';
import ProductCard from './ProductCard';
import { Container } from './ui/Container';



export const ForYouSection = () => {
  const { products } = useAppContext();

  // For now, we'll just take a slice of the existing products.
  // In a real application, this would be a personalized list.
  const forYouProducts = products.slice(0, 8);

  return (
    <section className="py-8 bg-white">
      <Container>
        <h2 className="text-3xl md:text-4xl mb-6">
          <span className="text-gray-900">Just for </span>
          <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
            You
          </span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {forYouProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.imageUrl}
              brandName={product.brandName}
            />
          ))}
        </div>
      </Container>
    </section>
  );
};
