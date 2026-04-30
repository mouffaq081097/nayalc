import NewArrivalsClient from './NewArrivalsClient';

export const metadata = {
  title: 'New Arrivals | Latest Beauty & Skincare | Naya Lumière Cosmetics UAE',
  description: 'Discover the latest arrivals from GERnétic, Zorah, and Naya Lumière Perfumes. Shop new luxury skincare, fragrance, and beauty products delivered across the UAE.',
  openGraph: {
    title: 'New Arrivals – Naya Lumière Cosmetics',
    description: 'Shop the latest luxury beauty products in the UAE.',
    url: 'https://nayalc.com/new-arrivals',
    images: [{ url: 'https://nayalc.com/Adobe Express - file (5).png', width: 1200, height: 630 }],
    type: 'website',
  },
  alternates: {
    canonical: 'https://nayalc.com/new-arrivals'
  }
};

export default function NewArrivalsPage() {
  return <NewArrivalsClient />;
}
