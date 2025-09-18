'use client';
import React from 'react';
import Link from 'next/link';

const FeaturedBrandCard = ({ brand }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row items-center p-6">
      <img src={brand.name === 'Gernetic' ? 'https://gernetic.com/cdn/shop/files/LOGO_OR-01_180x.png?v=1707386090' : brand.name === 'Zorah' ? 'https://zorah.ca/cdn/shop/files/logo-header-grey.png?height=80&v=1669306014' : brand.imageUrl} alt={brand.name} className="w-24 h-24 object-contain mb-4 md:mb-0 md:mr-6" />
      <div className="text-center md:text-left flex-grow">
        <h3 className="text-xl font-bold text-[#3D5A5D] mb-2">{brand.name}</h3>
        <p className="text-sm text-[#A0B8BA] mb-4">
          {brand.name === 'Gernetic' ? 'Gernetic is a leading skincare brand known for its advanced cellular biology and natural ingredients, offering innovative solutions for various skin concerns.' :
           brand.name === 'Zorah' ? 'Zorah Biocosmetiques offers certified organic, high-performance skincare and cosmetics, harnessing the power of argan oil and other natural ingredients for radiant skin.' :
           brand.description}
        </p>
        <Link href={`/brand/${brand.name}`} className="inline-block bg-[#4A6D70] text-white px-6 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-colors">
          View Products
        </Link>
      </div>
    </div>
  );
};

export default FeaturedBrandCard;
