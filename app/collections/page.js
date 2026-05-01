import CollectionsListClient from './CollectionsListClient';

export const metadata = {
  title: 'All Collections | Skincare & Fragrance by Category | Naya Lumière UAE',
  description: 'Explore all skincare and fragrance collections at Naya Lumière Cosmetics UAE. Shop by category: moisturisers, serums, eye creams, perfumes and more from GERnétic and Zorah.',
  openGraph: {
    title: 'All Collections – Naya Lumière Cosmetics',
    description: 'Discover curated luxury beauty collections from GERnétic, Zorah, and Naya Lumière Perfumes. Free UAE delivery.',
    url: 'https://nayalc.com/collections',
    locale: 'en_AE',
    type: 'website',
  },
  alternates: {
    canonical: 'https://nayalc.com/collections',
  },
};

export default function CollectionsPage() {
  return <CollectionsListClient />;
}
