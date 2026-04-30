import SkincareClient from './SkincareClient';

export const metadata = {
  title: 'Professional Skincare UAE | GERnétic & Zorah | Naya Lumière',
  description: 'Shop clinically-formulated skincare by GERnétic (cellular biocosmetics) and Zorah (natural active ingredients). Moisturisers, serums, eye creams, and more. UAE delivery.',
  openGraph: {
    title: 'Professional Skincare – Naya Lumière Cosmetics',
    description: 'Advanced skincare solutions for visible radiance and health.',
    url: 'https://nayalc.com/SkinCare',
    images: [{ url: 'https://nayalc.com/Adobe Express - file (5).png', width: 1200, height: 630 }],
    type: 'website',
    locale: 'en_AE',
  },
  alternates: {
    canonical: 'https://nayalc.com/SkinCare'
  }
};

export default function SkincarePage() {
  return <SkincareClient />;
}
