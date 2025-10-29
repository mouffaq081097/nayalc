'use client';
import Image from 'next/image'; // Use next/image
import React from 'react'; // Import React
import Link from 'next/link'; // Use next/link

const CategoryCard = ({ category }) => {

    return (
        <Link
            href={`/category/${encodeURIComponent(category.name)}`}
            className="group relative block h-80 rounded-xl overflow-hidden shadow-lg w-full sm:w-auto px-2"
        >
            <Image 
                src={category.image_url || 'https://placehold.co/600x400/EEE/31343C?text=No+Image'} 
                alt={category.name}
                fill // Use fill to make the image take up the parent's size
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Responsive image sizes
                className="object-contain transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-6">
                <h3 className="text-2xl font-bold font-serif">{category.name}</h3>
                <p className="text-sm mt-2 opacity-90 max-w-[90%]">{category.description}</p>
                <div className="mt-4 transition-all duration-300 sm:opacity-0 sm:group-hover:opacity-100 sm:translate-y-4 sm:group-hover:translate-y-0">
                    <span className="bg-white text-[var(--brand-text)] px-5 py-2 rounded-full font-semibold text-sm">
                        Shop Now
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default CategoryCard;