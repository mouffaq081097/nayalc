'use client';

import { useAppContext } from '../context/AppContext';
import FeaturedBrandCard from '../components/FeaturedBrandCard';

const BrandsPage = () => {
  const { brands } = useAppContext();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Our Brands</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {brands.map(brand => (
          <FeaturedBrandCard key={brand.id} brand={brand} />
        ))}
      </div>
    </div>
  );
};

export default BrandsPage;
