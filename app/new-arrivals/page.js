'use client';

import { useAppContext } from '../context/AppContext';
import ProductCard from '../components/ProductCard';

const NewArrivalsPage = () => {
  const { products } = useAppContext(); // Assuming newArrivals will be available in the context

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">New Arrivals</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.slice(0, 8).map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default NewArrivalsPage;
