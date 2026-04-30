import db from '@/lib/db';
import CollectionClient from './CollectionClient';
import Script from 'next/script';
import { redirect } from 'next/navigation';

async function getCategoryBySlug(slug) {
  try {
    const categorySql = 'SELECT id, name, description, image_url as "imageUrl", slug FROM categories WHERE slug = $1 AND is_active = true';
    const { rows } = await db.query(categorySql, [slug]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Error fetching category by slug:", error);
    return null;
  }
}

async function getCategoryById(id) {
  try {
    const categorySql = 'SELECT id, name, description, image_url as "imageUrl", slug FROM categories WHERE id = $1 AND is_active = true';
    const { rows } = await db.query(categorySql, [id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Error fetching category by id:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  // Handle numeric ID fallback/redirect in metadata too for consistency
  let category = await getCategoryBySlug(slug);
  if (!category && /^\d+$/.test(slug)) {
    category = await getCategoryById(slug);
  }

  if (!category) {
    return {
      title: 'Collection Not Found | nayalc.com',
    };
  }

  const title = `${category.name} Collection | Beauty & Skincare | nayalc.com UAE`;
  const description = category.description || `Explore the ${category.name} collection at nayalc.com. Premium beauty and skincare essentials delivered in the UAE.`;

  return {
    title: title,
    description: description.substring(0, 160),
    openGraph: {
      title: title,
      description: description,
      images: category.imageUrl ? [{ url: category.imageUrl }] : [],
      type: 'website',
    },
    alternates: {
      canonical: `https://nayalc.com/collections/${category.slug || category.id}`
    }
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  
  // If slug is numeric, check if it's an ID and redirect to the slug
  if (/^\d+$/.test(slug)) {
    const category = await getCategoryById(slug);
    if (category && category.slug) {
      redirect(`/collections/${category.slug}`);
    }
  }

  const category = await getCategoryBySlug(slug);

  if (!category) return <CollectionClient />;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} Collection`,
    description: category.description,
    url: `https://nayalc.com/collections/${category.slug || category.id}`,
    image: category.imageUrl,
  };

  return (
    <>
      <Script
        id="collection-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CollectionClient category={category} />
    </>
  );
}
