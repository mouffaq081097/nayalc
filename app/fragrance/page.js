import FragranceClient from './FragranceClient';

export const metadata = {
  title: 'Luxury Perfumes & Fragrances UAE | Naya Lumière Perfumes',
  description: 'Shop exclusive Oriental and French perfumes from Naya Lumière. Discover Jasmine of Damascus, oud-based scents, and signature EdP collections. Fast delivery across UAE.',
  openGraph: {
    title: 'Luxury Perfumes & Fragrances – Naya Lumière',
    description: 'Discover your signature scent with our exclusive fragrance collection.',
    url: 'https://nayalc.com/fragrance',
    images: [{ url: 'https://nayalc.com/Adobe Express - file (5).png', width: 1200, height: 630 }],
    type: 'website',
    locale: 'en_AE',
  },
  alternates: {
    canonical: 'https://nayalc.com/fragrance'
  }
};

export default function FragrancePage() {
  return <FragranceClient />;
}
