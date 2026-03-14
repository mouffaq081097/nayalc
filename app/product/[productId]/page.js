import db from '@/lib/db';
import ProductClient from './ProductClient';
import Script from 'next/script';

async function getProductBySlugOrId(identifier) {
  // Try slug first, then fallback to ID if it's numeric
  let productSql = `
    SELECT
        p.id, p.name, p.slug, p.description, p.price, b.name as "brand", p.stock_quantity,
        p.long_description, p.benefits, p.how_to_use, p.ingredients, p.comparedprice,
        COALESCE(AVG(r.rating), 0)::numeric(10,1) as "averageRating",
        COUNT(r.id) as "reviewCount"
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE p.slug = $1
    GROUP BY p.id, p.name, p.slug, p.description, p.price, p.vendor, p.stock_quantity,
             p.long_description, p.benefits, p.how_to_use, p.ingredients, p.comparedprice, b.name;
  `;
  
  let { rows } = await db.query(productSql, [identifier]);
  
  // Fallback to ID
  if (rows.length === 0 && !isNaN(identifier)) {
    productSql = productSql.replace('p.slug = $1', 'p.id = $1');
    const result = await db.query(productSql, [identifier]);
    rows = result.rows;
  }

  if (rows.length === 0) return null;

  const product = rows[0];
  product.price = parseFloat(product.price);
  if (product.comparedprice) product.comparedprice = parseFloat(product.comparedprice);
  if (product.averageRating) product.averageRating = parseFloat(product.averageRating);

  const imagesSql = `
    SELECT image_url
    FROM product_images
    WHERE product_id = $1
    ORDER BY display_order ASC, id ASC;
  `;
  const { rows: imageRows } = await db.query(imagesSql, [product.id]);
  product.images = imageRows.map(row => row.image_url);
  
  return product;
}

export async function generateMetadata({ params }) {
  const { productId } = await params;
  const product = await getProductBySlugOrId(productId);

  if (!product) {
    return {
      title: 'Product Not Found - nayalc.com',
    };
  }

  const title = product.name.toLowerCase().includes('zorah sublime') 
    ? "Zorah Sublime Night Cream 50ml | Pure Argan Oil & Hydration | nayalc.com" 
    : `${product.name} | ${product.brand || 'Beauty'} | nayalc.com`;
  
  const description = product.name.toLowerCase().includes('zorah sublime')
    ? "Zorah Sublime Night Cream 50ml with Pure Argan Oil, Enhanced Skin Hydration, Revitalizing & Brightening, Vegan, Cruelty-Free, Ideal for All Skin Types."
    : product.description?.substring(0, 160);

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
      type: 'website',
    },
    alternates: {
        canonical: `https://nayalc.com/product/${product.slug || product.id}`
    }
  };
}

export default async function ProductPage({ params }) {
  const { productId } = await params;
  const product = await getProductBySlugOrId(productId);

  if (!product) return <ProductClient params={Promise.resolve({ productId })} />;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: product.long_description || product.description,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Naya Lumière',
    },
    sku: product.id,
    offers: {
      '@type': 'Offer',
      url: `https://nayalc.com/product/${product.slug || product.id}`,
      priceCurrency: 'AED',
      price: product.price,
      availability: product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    }
  };

  return (
    <>
      <Script
        id="product-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductClient params={Promise.resolve({ productId })} initialProduct={product} />
    </>
  );
}
