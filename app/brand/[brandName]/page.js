'use client';
import React from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useAppContext } from '../../context/AppContext';
import ProductCard from '../../components/ProductCard';

const BrandPage = () => {
  const { brandName } = useParams();
  const { products, brands } = useAppContext();

  const currentBrand = brands.find(brand => brand.name === brandName);
  const brandProducts = products.filter(product => product.brand === brandName);

  console.log('Brand Name:', brandName);
  console.log('Brand Products:', brandProducts);

  if (!currentBrand) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Brand Not Found</h1>
        <p>The brand you are looking for does not exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-8">
        <Image src={currentBrand.imageUrl} alt={currentBrand.name} width={96} height={96} objectFit="contain" className="mr-6" />
        <div>
          <h1 className="text-4xl font-bold text-[#3D5A5D] mb-2">{currentBrand.name}</h1>
          <p className="text-lg text-[#A0B8BA]">{currentBrand.description}</p>
        </div>
      </div>

      <h2 className="text-3xl font-bold mb-6">Products by {currentBrand.name}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {brandProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default BrandPage;
