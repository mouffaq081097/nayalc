import db from '@/lib/db';
import BrandClient from './BrandClient';
import Script from 'next/script';

async function getBrand(id) {
  try {
    const { rows } = await db.query('SELECT id, name, imageurl FROM brands WHERE id = $1', [id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Error fetching brand for metadata:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const brand = await getBrand(id);

  if (!brand) {
    return {
      title: 'Brand Not Found | nayalc.com',
    };
  }

  const title = `Shop ${brand.name} | Premium Beauty & Skincare | nayalc.com UAE`;
  const description = `Discover the exquisite range of products from ${brand.name}. Shop authentic ${brand.name} beauty and skincare essentials at nayalc.com. Fast delivery in the UAE.`;

  return {
    title: title,
    description: description.substring(0, 160),
    openGraph: {
      title: title,
      description: description,
      images: brand.imageurl ? [{ url: brand.imageurl }] : [],
      type: 'website',
    },
    alternates: {
      canonical: `https://nayalc.com/brand/${id}`
    }
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const brand = await getBrand(id);

  if (!brand) return <BrandClient />;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Brand',
    name: brand.name,
    url: `https://nayalc.com/brand/${id}`,
    logo: brand.imageurl,
  };

  return (
    <>
      <Script
        id="brand-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BrandClient />
    </>
  );
}
