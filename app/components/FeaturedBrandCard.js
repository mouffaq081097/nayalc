import Image from 'next/image';
import React from 'react';
import Link from 'next/link';

const FeaturedBrandCard = ({ brand }) => {
  return (
    <Link href={`/brand/${brand.id}`} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row items-center p-6 text-center transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
      <div className="relative w-32 h-32 mb-4 md:mb-0 md:mr-6 mx-auto">
        <Image
          src={brand.imageUrl || 'https://placehold.co/96x96/EEE/31343C?text=No+Image'}
          alt={brand.name}
          fill
          sizes="96px"
          className="object-contain"
        />
      </div>
                    <div className="text-center md:text-left flex-grow">
                      <p className="text-sm text-[#A0B8BA] mb-4">{brand.description}</p>
                      <Link href={`/brand/${brand.id}`} className="inline-block bg-[var(--brand-button-bg)] text-white px-6 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-colors">
                        View Products
                      </Link>
                    </div>    </Link>
  );
};

export default FeaturedBrandCard;
