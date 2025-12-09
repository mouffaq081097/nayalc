'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import ProductCard from '../../components/ProductCard';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Container } from '../../components/ui/Container';
import { ChevronLeft } from 'lucide-react';
import Brands from '../../components/Brands';

function BrandPage() {
  const { id } = useParams();
  const [currentBrand, setCurrentBrand] = useState(null);
  const [brandProducts, setBrandProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch brand details and products for that brand in parallel
        const [brandDetailsResponse, brandProductsResponse] = await Promise.all([
          fetch(`/api/brands/${id}`),
          fetch(`/api/products?brandId=${id}`)
        ]);

        if (!brandDetailsResponse.ok) {
          throw new Error('Failed to fetch brand details');
        }
        if (!brandProductsResponse.ok) {
          throw new Error('Failed to fetch products for this brand');
        }

        const brandDetails = await brandDetailsResponse.json();
        const brandProducts = await brandProductsResponse.json();

        setCurrentBrand(brandDetails);
        setBrandProducts(brandProducts);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading brand details...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error}</div>;
  }

  if (!currentBrand) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 p-4">
        <h1 className="text-3xl font-bold mb-8">Brand Not Found</h1>
        <p>The brand you are looking for does not exist or data is not available.</p>
        <Link href="/" className="mt-4 text-[var(--brand-blue)] hover:underline">Go to Homepage</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section for Brand Details */}
      <section className="bg-gradient-to-br from-[var(--brand-rose)] via-white to-[var(--brand-cream)] py-16">
        <Container>
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
            <ChevronLeft className="h-5 w-5 mr-1" /> Back to Homepage
          </Link>
          <div className="text-center max-w-4xl mx-auto">
            {currentBrand.imageUrl && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <Image
                  src={currentBrand.imageUrl}
                  alt={currentBrand.name}
                  width={150}
                  height={150}
                  objectFit="contain"
                  className="mx-auto rounded-full shadow-lg"
                />
              </motion.div>
            )}
            <Badge className="mb-4 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] text-white">
              New Brand
            </Badge>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-5xl mb-4"
            >
              <span className="text-gray-900">Discover </span>
              <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-pink)] bg-clip-text text-transparent">
                {currentBrand.name}
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg text-gray-600 mb-6"
            >
              {currentBrand.description || "Explore the exquisite range of products from this premium brand."}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Button size="lg" className="bg-[var(--brand-blue)] hover:bg-[var(--brand-pink)] text-white">
                Shop All {currentBrand.name} Products
              </Button>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Products Grid */}
      <section className="py-12 bg-white">
        <Container>
          <h2 className="text-3xl text-gray-900 mb-8 text-center">Products by {currentBrand.name}</h2>
          {brandProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {brandProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  image={product.imageUrl}
                  brandName={product.brandName}
                  stock_quantity={product.stock_quantity}
                  averageRating={product.averageRating}
                  reviewCount={product.reviewCount}
              />))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No products found for {currentBrand.name}.</p>
          )}
        </Container>
      </section>
      <Brands />
    </div>
  );
}

export default BrandPage;