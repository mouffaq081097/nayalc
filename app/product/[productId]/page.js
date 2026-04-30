import db from '@/lib/db';
import ProductClient from './ProductClient';
import Script from 'next/script';

async function getProductBySlugOrId(identifier) {
  // Try slug first, then fallback to ID if it's numeric
  let productSql = `
    SELECT
        p.id, p.name, p.slug, p.description, p.price, b.name as "brand", b.slug as "brandSlug", b.imageurl as "brandImageUrl", p.stock_quantity,
        p.long_description, p.benefits, p.how_to_use, p.how_to_use_video, p.ingredients, p.comparedprice, p.size, p.form,
        COALESCE(AVG(r.rating), 0)::numeric(10,1) as "averageRating",
        COUNT(r.id) as "reviewCount",
        c.name as "categoryName", c.slug as "categorySlug"
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.slug = $1
    GROUP BY p.id, p.name, p.slug, p.description, p.price, p.vendor, p.stock_quantity,
             p.long_description, p.benefits, p.how_to_use, p.how_to_use_video, p.ingredients, p.comparedprice, b.name, b.slug, b.imageurl, p.size, p.form, c.name, c.slug;
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

  // Highly optimized title for UAE searches
  const brandPart = product.brand ? `${product.brand} ` : '';
  const title = product.name.toLowerCase().includes('zorah sublime') 
    ? "Zorah Sublime Night Cream 50ml | Pure Argan Oil UAE | nayalc.com" 
    : `${brandPart}${product.name} | Buy Online in UAE | nayalc.com`;
  
  // Optimized description including brand and "UAE"
  let description = product.description || '';
  if (description.length < 100) {
     description = `Buy ${brandPart}${product.name} online in the UAE. ${description} Authentic luxury skincare & beauty products at Naya Lumière Cosmetics.`;
  }
  
  if (product.name.toLowerCase().includes('zorah sublime')) {
    description = "Zorah Sublime Night Cream 50ml with Pure Argan Oil, Enhanced Skin Hydration, Revitalizing & Brightening, Vegan, Cruelty-Free, Ideal for All Skin Types. Buy in UAE.";
  }

  return {
    title: title,
    description: description.substring(0, 160),
    keywords: [product.name, product.brand, `${product.brand} UAE`, `${product.name} Dubai`, 'buy online UAE', 'skincare UAE'],
    openGraph: {
      title: title,
      description: description.substring(0, 160),
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
      type: 'product',
      locale: 'en_AE',
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

  const productUrl = `https://nayalc.com/product/${product.slug || product.id}`;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: product.long_description || product.description,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Naya Lumière Cosmetics',
    },
    sku: product.id.toString(),
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'AED',
      price: product.price,
      availability: product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'Naya Lumière Cosmetics'
      }
    },
    ...(product.reviewCount > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.averageRating.toFixed(1),
        reviewCount: product.reviewCount,
        bestRating: '5',
        worstRating: '1',
      }
    } : {}),
  };

  const breadcrumbList = [];
  breadcrumbList.push({ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nayalc.com' });
  
  if (product.brand) {
    breadcrumbList.push({ 
        '@type': 'ListItem', 
        position: 2, 
        name: product.brand, 
        item: `https://nayalc.com/brand/${product.brandSlug || product.brand_id}` 
    });
  } else if (product.categoryName) {
     breadcrumbList.push({ 
        '@type': 'ListItem', 
        position: 2, 
        name: product.categoryName, 
        item: `https://nayalc.com/collections/${product.categorySlug || product.category_id}` 
    });
  }

  breadcrumbList.push({ 
      '@type': 'ListItem', 
      position: breadcrumbList.length + 1, 
      name: product.name, 
      item: productUrl 
  });

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbList
  };

  return (
    <>
      <Script
        id="product-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductClient params={Promise.resolve({ productId })} initialProduct={product} />
    </>
  );
}
