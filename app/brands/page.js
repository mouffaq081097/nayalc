import BrandsClient from './BrandsClient';

export const metadata = {
  title: 'Luxury Beauty Brands UAE | GERnétic, Zorah & Naya Lumière',
  description: 'Explore our curated selection of prestigious beauty brands. Official retailer of GERnétic (France), Zorah Biocosmetics (Canada), and Naya Lumière Perfumes.',
  openGraph: {
    title: 'Luxury Beauty Brands – Naya Lumière Cosmetics',
    description: 'Discover the world\'s most prestigious beauty houses.',
    url: 'https://nayalc.com/brands',
    images: [{ url: 'https://nayalc.com/Adobe Express - file (5).png', width: 1200, height: 630 }],
    type: 'website',
    locale: 'en_AE',
  },
  alternates: {
    canonical: 'https://nayalc.com/brands'
  }
};

export default function BrandsPage() {
  return <BrandsClient />;
}
