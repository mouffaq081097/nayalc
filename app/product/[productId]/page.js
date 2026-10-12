import { notFound } from 'next/navigation';
import db from '@/lib/db';
import ProductClient from './ProductClient';
import { calcShipping } from '@/lib/shipping';

const SITE = 'https://nayalc.com';

// "GERnétic International" → "GERnétic": the short brand is what people search, and titles get cut at ~60 characters
const shortBrand = (brand) => (brand || '').replace(/\s+International$/i, '').trim();

// Descriptions are stored with HTML in places; structured data wants plain text
const plainText = (html) => (html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// JSON-LD goes straight into the HTML, so a "</script>" inside product text must not be able to end the tag
const jsonLd = (data) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') });

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
      title: 'Product not found',
      robots: { index: false },
    };
  }

  // Brand first, then the product — the words people actually search. The root layout's
  // title template appends "| Naya Lumière Cosmetics", so the store name isn't repeated here.
  const brandPart = product.brand ? `${product.brand} ` : '';
  const brand = shortBrand(product.brand);
  const nameHasBrand = brand && product.name.toLowerCase().includes(brand.toLowerCase());
  const title = product.name.toLowerCase().includes('zorah sublime')
    ? 'Zorah Sublime Night Cream 50ml, Pure Argan Oil | Buy in UAE'
    : `${nameHasBrand || !brand ? '' : `${brand} `}${product.name} | Buy in UAE`;
  
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
      type: 'website',
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

  // A real 404 rather than a page that says "not found" with a 200, which Google files as a soft 404
  if (!product) notFound();

  const productUrl = `${SITE}/product/${product.slug || product.id}`;
  const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: plainText(product.long_description || product.description).slice(0, 5000),
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
      priceValidUntil: nextYear,
      seller: {
        '@type': 'Organization',
        name: 'Naya Lumière Cosmetics'
      },
      // What Google shows as delivery cost and time — the single-item rate and the OTO couriers' 1–3 working days
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: calcShipping(1), currency: 'AED' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'AE' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
        },
      },
      // Matches the terms: unopened, sealed products within 14 days
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'AE',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
      },
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
  breadcrumbList.push({ '@type': 'ListItem', position: 1, name: 'Home', item: SITE });
  
  if (product.brand) {
    breadcrumbList.push({ 
        '@type': 'ListItem', 
        position: 2, 
        name: product.brand, 
        item: `${SITE}/brand/${product.brandSlug || product.brand_id}` 
    });
  } else if (product.categoryName) {
     breadcrumbList.push({ 
        '@type': 'ListItem', 
        position: 2, 
        name: product.categoryName, 
        item: `${SITE}/collections/${product.categorySlug || product.category_id}` 
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
      {/* Plain <script> tags, not next/script: next/script injects them in the browser after
          load, so they never reached the HTML Google reads */}
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(productJsonLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbJsonLd)} />
      <ProductClient params={Promise.resolve({ productId })} initialProduct={product} />
    </>
  );
}
