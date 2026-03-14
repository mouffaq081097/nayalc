import { Suspense } from 'react';
import AllProducts from './AllProducts.js';
import Script from 'next/script';

export const metadata = {
  title: "Shop All Beauty & Skincare Products | nayalc.com UAE",
  description: "Explore our full range of premium beauty and skincare products. From Zorah Sublime Night Cream to luxury fragrances, find everything you need for your beauty ritual in the UAE.",
  keywords: "beauty products UAE, skincare online, luxury beauty, Zorah Sublime, night cream, serum, fragrance",
  openGraph: {
    title: "Shop All Beauty & Skincare Products | nayalc.com UAE",
    description: "Discover the best in beauty and skincare. Premium products delivered across the UAE.",
    url: "https://nayalc.com/all-products",
    type: "website",
  },
};

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'All Beauty & Skincare Products',
    description: 'Explore our full range of premium beauty and skincare products.',
    url: 'https://nayalc.com/all-products',
  };

  return (
    <>
      <Script
        id="all-products-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-brand-pink/20 border-t-brand-pink rounded-full animate-spin"></div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">Loading Boutique</span>
          </div>
        </div>
      }>
        <AllProducts />
      </Suspense>
    </>
  );
}
