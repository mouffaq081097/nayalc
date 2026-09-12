import { cache } from 'react';
import db from '@/lib/db';
import BrandClient from './BrandClient';
import Script from 'next/script';
import { redirect } from 'next/navigation';
import { slugify } from '@/lib/slugify';

// Brand URLs are matched by a slug computed from the name (see lib/slugify),
// not a stored DB column — that column exists but nothing ever populates it,
// which is why "Shop All" links used to 404 into an empty page for any
// brand whose name has a space or accent (e.g. "Naya Lumière Perfumes").
const getActiveBrands = cache(async () => {
  try {
    const { rows } = await db.query('SELECT id, name, imageurl FROM brands WHERE is_active = true');
    return rows;
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
});

async function getBrandBySlug(slug) {
  const brands = await getActiveBrands();
  return brands.find((b) => slugify(b.name) === slug) || null;
}

async function getBrandById(id) {
  const brands = await getActiveBrands();
  return brands.find((b) => String(b.id) === String(id)) || null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  let brand = await getBrandBySlug(slug);
  if (!brand && /^\d+$/.test(slug)) {
    brand = await getBrandById(slug);
  }

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
      canonical: `https://nayalc.com/brand/${slugify(brand.name)}`
    }
  };
}

export default async function Page({ params }) {
  const { slug } = await params;

  if (/^\d+$/.test(slug)) {
    const brand = await getBrandById(slug);
    if (brand) {
      redirect(`/brand/${slugify(brand.name)}`);
    }
  }

  const brand = await getBrandBySlug(slug);

  if (!brand) return <BrandClient />;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Brand',
    name: brand.name,
    url: `https://nayalc.com/brand/${slugify(brand.name)}`,
    logo: brand.imageurl,
  };

  return (
    <>
      <Script
        id="brand-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BrandClient brand={brand} />
    </>
  );
}
