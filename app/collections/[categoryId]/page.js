"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const ProductCard = dynamic(() => import('../../components/ProductCard'));

export default function CollectionDetailsPage() {
  const { categoryId } = useParams();
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (categoryId) {
      const fetchCollectionDetails = async () => {
        try {
          const response = await fetch(`/api/categories/${categoryId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch collection details');
          }
          const data = await response.json();
          setCollection(data);
          setProducts(data.products || []); // Assuming products are nested under the collection object
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchCollectionDetails();
    }
  }, [categoryId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading collection...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error}</div>;
  }

  if (!collection) {
    return <div className="min-h-screen flex items-center justify-center">Collection not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section for Collection Details */}
      <section className="bg-gradient-to-br from-[var(--brand-rose)] via-white to-[var(--brand-cream)] py-16">
        <div className="container mx-auto px-4">
          <Link href="/collections" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
            <ChevronLeft className="h-5 w-5 mr-1" /> Back to Collections
          </Link>
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] text-white">
              {collection.name} Collection
            </Badge>
            <h1 className="text-4xl md:text-5xl mb-4">
              <span className="text-gray-900">{collection.name} </span>
              <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
                Essentials
              </span>
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              {collection.description || "Explore the curated selection of products in this exclusive collection."}
            </p>
            <Button size="lg" className="bg-[var(--brand-blue)] hover:bg-[var(--brand-pink)] text-white">
              Shop All Products
            </Button>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl text-gray-900 mb-8 text-center">Products in this Collection</h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  image={product.imageUrl}
                  rating={4.5} // Hardcoded dummy rating
                  reviewCount={120} // Hardcoded dummy review count
                  brandName={product.brandName}
                  stock_quantity={product.stock_quantity}
                // Add other product properties as needed by ProductCard
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No products found in this collection.</p>
          )}
        </div>
      </section>
    </div>
  );
}
