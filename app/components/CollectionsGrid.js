'use client'
import { Button } from './ui/button';
import { Gift } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link'; // Import Link

export default function CollectionsGrid({ collections }) {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((collection, index) => (
            <div key={index} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* Collection Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={collection.imageUrl}
                  alt={collection.name}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Collection Info */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xl text-gray-900">{collection.name}</h3>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-500">
                    <span>{collection.productsCount} products</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/collections/${collection._id}`} passHref>
                    <Button 
                      className="flex-1 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] hover:opacity-90"
                      size="sm"
                    >
                      View Collection
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="px-3">
                    <Gift className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}