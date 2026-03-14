import db from '@/lib/db';
import CollectionClient from './CollectionClient';
import Script from 'next/script';

async function getCategory(id) {
  try {
    const categorySql = 'SELECT id, name, description, image_url as "imageUrl" FROM categories WHERE id = $1';
    const { rows } = await db.query(categorySql, [id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Error fetching category for metadata:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { categoryId } = await params;
  const category = await getCategory(categoryId);

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
      canonical: `https://nayalc.com/collections/${categoryId}`
    }
  };
}

export default async function Page({ params }) {
  const { categoryId } = await params;
  const category = await getCategory(categoryId);

  if (!category) return <CollectionClient />;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} Collection`,
    description: category.description,
    url: `https://nayalc.com/collections/${categoryId}`,
    image: category.imageUrl,
  };

  return (
    <>
      <Script
        id="collection-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CollectionClient />
    </>
  );
}
