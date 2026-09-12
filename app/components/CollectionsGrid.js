'use client'
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CollectionsGrid({ collections }) {
  return (
    <div className="max-w-[1320px] mx-auto px-5 md:px-8 py-8 md:py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {collections.map((collection) => (
          <div
            key={collection.id}
            className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
          >
            {/* Image */}
            <Link href={`/collections/${collection.slug || collection.id}`} className="relative block aspect-[4/3] overflow-hidden bg-gray-50">
              {collection.imageUrl ? (
                <Image
                  src={collection.imageUrl}
                  alt={collection.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No image</div>
              )}
            </Link>

            {/* Info */}
            <div className="p-5">
              <h3 className="text-[15px] font-semibold text-gray-900 mb-1">{collection.name}</h3>
              <p className="text-[12px] text-gray-500 mb-4">
                {collection.productsCount} {collection.productsCount === 1 ? 'product' : 'products'}
              </p>

              <Link
                href={`/collections/${collection.slug || collection.id}`}
                className="group/link flex items-center justify-center gap-1.5 w-full h-10 rounded-full text-[12px] font-semibold text-white transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(90deg,#c087fc,#9869f7)' }}
              >
                Shop collection
                <ArrowRight size={13} className="transition-transform group-hover/link:translate-x-0.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
