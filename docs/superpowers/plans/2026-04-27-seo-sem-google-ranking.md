# SEO & SEM: Google Ranking Improvement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Push nayalc.com from page 2 to page 1 on Google UAE for GERnétic, Zorah, and luxury skincare keywords via technical SEO code changes and a Google Merchant Center product feed.

**Architecture:** Ten tasks across three areas — (1) enriched metadata + JSON-LD schema on existing pages, (2) a new public XML feed API route for Google Shopping, and (3) a markdown-based blog replacing the Coming Soon page. No new database tables required.

**Tech Stack:** Next.js 15 App Router, Vercel Postgres (raw SQL), `gray-matter`, `remark`, `remark-html`

---

## File Map

### Modified Files
- `app/product/[productId]/page.js` — richer metadata, AggregateRating + BreadcrumbList + FAQ JSON-LD
- `app/brand/[id]/page.js` — brand-specific metadata + BreadcrumbList JSON-LD
- `app/collections/[categoryId]/page.js` — keyword-rich metadata + BreadcrumbList JSON-LD
- `app/blog/page.js` — replace Coming Soon with real blog list
- `app/sitemap.js` — add blog posts

### New Files
- `app/api/feed/google/route.js` — Google Merchant Center XML product feed
- `lib/blog.js` — markdown file reader/parser
- `app/blog/[slug]/page.js` — individual blog post page
- `content/blog/gernetic-synchro-guide-uae.md`
- `content/blog/best-gernetic-products-dubai-climate.md`
- `content/blog/zorah-bio-cosmetics-uae-guide.md`
- `content/blog/luxury-skincare-gifts-dubai-2025.md`
- `content/blog/what-is-bio-cosmetics-gernetic-explained.md`

---

## Task 1: Enhanced Product Page — Metadata + AggregateRating + BreadcrumbList + FAQ Schema

**Files:**
- Modify: `app/product/[productId]/page.js`

Four improvements in one file: (1) keyword-rich title/description per brand, (2) AggregateRating in Product JSON-LD using the `averageRating` and `reviewCount` fields already fetched by the existing SQL query, (3) BreadcrumbList JSON-LD, (4) FAQPage JSON-LD from `benefits`, `how_to_use`, `ingredients` fields.

- [ ] **Step 1: Add `brandId` to the product SQL query**

In `app/product/[productId]/page.js`, find the `productSql` string inside `getProductBySlugOrId`. It currently selects `b.name as "brand"` and groups by `b.name, b.imageurl`. Add `b.id as "brandId"` to both SELECT and GROUP BY so we can link breadcrumbs to the brand page.

Change the SELECT line from:
```sql
p.id, p.name, p.slug, p.description, p.price, b.name as "brand", b.imageurl as "brandImageUrl", p.stock_quantity,
```
To:
```sql
p.id, p.name, p.slug, p.description, p.price, b.id as "brandId", b.name as "brand", b.imageurl as "brandImageUrl", p.stock_quantity,
```

Change the GROUP BY line from:
```sql
p.long_description, p.benefits, p.how_to_use, p.how_to_use_video, p.ingredients, p.comparedprice, b.name, b.imageurl, p.size, p.form;
```
To:
```sql
p.long_description, p.benefits, p.how_to_use, p.how_to_use_video, p.ingredients, p.comparedprice, b.id, b.name, b.imageurl, p.size, p.form;
```

- [ ] **Step 2: Replace `generateMetadata` with brand-aware version**

Replace the entire `generateMetadata` export with:

```javascript
export async function generateMetadata({ params }) {
  const { productId } = await params;
  const product = await getProductBySlugOrId(productId);

  if (!product) {
    return { title: 'Product Not Found — nayalc.com' };
  }

  const brandSuffix = {
    'GERnétic': 'Bio-Energetic Skincare',
    'Zorah': 'Natural Bio-Cosmetics',
    'Naya Lumière Perfumes': 'Luxury Fragrance',
  }[product.brand] || 'Luxury Beauty';

  const title = `${product.name} | ${product.brand || 'Naya Lumière'} ${brandSuffix} | Buy in UAE — nayalc.com`;

  let descBase = product.description || '';
  if (product.benefits) {
    const firstBenefit = product.benefits.split('\n')[0].replace(/^[-•*]\s*/, '').trim();
    if (firstBenefit) descBase = `${firstBenefit}. ${descBase}`;
  }
  const description = descBase.substring(0, 150) + ' Free UAE delivery.';

  return {
    title,
    description,
    keywords: [
      product.name,
      product.brand,
      `${product.brand} UAE`,
      `${product.brand} Dubai`,
      `${product.name} UAE`,
      'luxury skincare UAE',
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
      type: 'website',
    },
    alternates: {
      canonical: `https://nayalc.com/product/${product.slug || product.id}`,
    },
  };
}
```

- [ ] **Step 3: Replace the page component with enriched JSON-LD version**

Replace the entire `ProductPage` default export with:

```javascript
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
    brand: { '@type': 'Brand', name: product.brand || 'Naya Lumière' },
    sku: String(product.id),
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'AED',
      price: product.price,
      availability: product.stock_quantity > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Naya Lumière Cosmetics' },
    },
    ...(parseInt(product.reviewCount) > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.averageRating,
        reviewCount: parseInt(product.reviewCount),
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nayalc.com' },
      ...(product.brandId
        ? [{ '@type': 'ListItem', position: 2, name: product.brand, item: `https://nayalc.com/brand/${product.brandId}` }]
        : []),
      { '@type': 'ListItem', position: product.brandId ? 3 : 2, name: product.name, item: productUrl },
    ],
  };

  const faqItems = [
    product.how_to_use && {
      '@type': 'Question',
      name: `How do I use ${product.name}?`,
      acceptedAnswer: { '@type': 'Answer', text: product.how_to_use },
    },
    product.benefits && {
      '@type': 'Question',
      name: `What are the benefits of ${product.name}?`,
      acceptedAnswer: { '@type': 'Answer', text: product.benefits },
    },
    product.ingredients && {
      '@type': 'Question',
      name: `What are the key ingredients in ${product.name}?`,
      acceptedAnswer: { '@type': 'Answer', text: product.ingredients },
    },
  ].filter(Boolean);

  const faqJsonLd = faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems,
  } : null;

  return (
    <>
      <Script id="product-jsonld" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <Script id="breadcrumb-jsonld" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && (
        <Script id="faq-jsonld" type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <ProductClient params={Promise.resolve({ productId })} initialProduct={product} />
    </>
  );
}
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: exits 0 with no errors. If it fails, check for syntax errors in the JSON-LD spread operators.

- [ ] **Step 5: Verify schemas in dev**

Run `npm run dev`, open any product page, view page source. Confirm three `<script type="application/ld+json">` tags exist for Product, BreadcrumbList, and FAQPage (only if the product has `how_to_use` populated). Paste the product URL into `https://search.google.com/test/rich-results` and verify Google detects Product + Breadcrumb rich results.

- [ ] **Step 6: Commit**

```bash
git add app/product/[productId]/page.js
git commit -m "feat(seo): enrich product metadata, add AggregateRating, BreadcrumbList, FAQ schema"
```

---

## Task 2: Enhanced Brand Page — Brand-Specific Metadata + BreadcrumbList

**Files:**
- Modify: `app/brand/[id]/page.js`

The brand page already has `generateMetadata` but uses a generic template. Replace with brand-specific copy for GERnétic, Zorah, and Naya Lumière Perfumes, and add BreadcrumbList JSON-LD alongside the existing Brand schema.

- [ ] **Step 1: Replace `generateMetadata` with brand-specific version**

Replace the existing `generateMetadata` function in `app/brand/[id]/page.js` with:

```javascript
const BRAND_META = {
  'GERnétic': {
    title: 'GERnétic Bio-Cosmetics UAE | Official Retailer — nayalc.com',
    description: 'Shop GERnétic bio-energetic skincare in UAE. Official retailer of Synchro, Biomimetic, and professional skincare trusted by dermatologists. Free UAE delivery over AED 200.',
    keywords: ['GERnétic UAE', 'GERnétic Dubai', 'GERnétic synchro', 'bio-energetic skincare UAE', 'GERnétic official retailer UAE'],
  },
  'Zorah': {
    title: 'Zorah Bio-Cosmetics UAE | Natural Argan Skincare — nayalc.com',
    description: 'Discover Zorah bio-cosmetics in UAE. Natural, vegan, cruelty-free skincare powered by argan oil and plant actives. Shop with free UAE delivery over AED 200.',
    keywords: ['Zorah UAE', 'Zorah Dubai', 'Zorah argan oil UAE', 'natural skincare UAE', 'vegan skincare Dubai'],
  },
  'Naya Lumière Perfumes': {
    title: 'Naya Lumière Perfumes UAE | Luxury Fragrance — nayalc.com',
    description: 'Shop Naya Lumière Perfumes in UAE. Exclusive luxury fragrances crafted for the discerning. Discover our signature scent collection with free UAE delivery.',
    keywords: ['Naya Lumière perfume UAE', 'luxury perfume Dubai', 'niche fragrance UAE'],
  },
};

export async function generateMetadata({ params }) {
  const { id } = await params;
  const brand = await getBrand(id);

  if (!brand) return { title: 'Brand Not Found | nayalc.com' };

  const meta = BRAND_META[brand.name] || {
    title: `${brand.name} | Premium Beauty & Skincare UAE — nayalc.com`,
    description: `Shop authentic ${brand.name} beauty and skincare at nayalc.com. Free delivery across UAE.`,
    keywords: [`${brand.name} UAE`, `${brand.name} Dubai`],
  };

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: {
      title: meta.title,
      description: meta.description,
      images: brand.imageurl ? [{ url: brand.imageurl }] : [],
      type: 'website',
    },
    alternates: { canonical: `https://nayalc.com/brand/${id}` },
  };
}
```

- [ ] **Step 2: Add BreadcrumbList JSON-LD to the page component**

Replace the existing `Page` export (which has `jsonLd` + `<Script id="brand-jsonld">` + `<BrandClient />`) with:

```javascript
export default async function Page({ params }) {
  const { id } = await params;
  const brand = await getBrand(id);

  if (!brand) return <BrandClient />;

  const brandJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Brand',
    name: brand.name,
    url: `https://nayalc.com/brand/${id}`,
    logo: brand.imageurl,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nayalc.com' },
      { '@type': 'ListItem', position: 2, name: 'Brands', item: 'https://nayalc.com/brands' },
      { '@type': 'ListItem', position: 3, name: brand.name, item: `https://nayalc.com/brand/${id}` },
    ],
  };

  return (
    <>
      <Script id="brand-jsonld" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(brandJsonLd) }} />
      <Script id="breadcrumb-jsonld" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <BrandClient />
    </>
  );
}
```

- [ ] **Step 3: Verify and commit**

```bash
npm run build
```

In dev, navigate to the GERnétic brand page, view source, confirm title is `"GERnétic Bio-Cosmetics UAE | Official Retailer — nayalc.com"` and two JSON-LD script blocks are present.

```bash
git add app/brand/[id]/page.js
git commit -m "feat(seo): add brand-specific metadata and BreadcrumbList to brand pages"
```

---

## Task 3: Enhanced Collection Page — Keyword-Rich Metadata + BreadcrumbList

**Files:**
- Modify: `app/collections/[categoryId]/page.js`

- [ ] **Step 1: Replace `generateMetadata` with keyword-rich version**

Replace the existing `generateMetadata` in `app/collections/[categoryId]/page.js` with:

```javascript
export async function generateMetadata({ params }) {
  const { categoryId } = await params;
  const category = await getCategory(categoryId);

  if (!category) return { title: 'Collection Not Found | nayalc.com' };

  const title = `${category.name} UAE | Shop Online — nayalc.com`;
  const descBase = category.description
    ? category.description.substring(0, 120)
    : `Shop ${category.name} at nayalc.com. Premium brands GERnétic and Zorah.`;
  const description = `${descBase} Free delivery across UAE.`.substring(0, 160);

  return {
    title,
    description,
    keywords: [
      `${category.name} UAE`,
      `${category.name} Dubai`,
      `buy ${category.name} online UAE`,
      'luxury skincare UAE',
    ],
    openGraph: {
      title,
      description,
      images: category.imageUrl ? [{ url: category.imageUrl }] : [],
      type: 'website',
    },
    alternates: { canonical: `https://nayalc.com/collections/${categoryId}` },
  };
}
```

- [ ] **Step 2: Add BreadcrumbList JSON-LD to the page component**

Replace the existing `Page` export (which has `jsonLd` + `<Script id="collection-jsonld">` + `<CollectionClient />`) with:

```javascript
export default async function Page({ params }) {
  const { categoryId } = await params;
  const category = await getCategory(categoryId);

  if (!category) return <CollectionClient />;

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} Collection`,
    description: category.description,
    url: `https://nayalc.com/collections/${categoryId}`,
    image: category.imageUrl,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nayalc.com' },
      { '@type': 'ListItem', position: 2, name: 'Collections', item: 'https://nayalc.com/collections' },
      { '@type': 'ListItem', position: 3, name: category.name, item: `https://nayalc.com/collections/${categoryId}` },
    ],
  };

  return (
    <>
      <Script id="collection-jsonld" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <Script id="breadcrumb-jsonld" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <CollectionClient />
    </>
  );
}
```

- [ ] **Step 3: Verify and commit**

```bash
npm run build
git add app/collections/[categoryId]/page.js
git commit -m "feat(seo): add keyword-rich metadata and BreadcrumbList to collection pages"
```

---

## Task 4: Google Merchant Center Product Feed

**Files:**
- Create: `app/api/feed/google/route.js`

A public GET endpoint returning Google Shopping-compliant XML. No authentication — this URL is submitted directly to Google Merchant Center as a scheduled fetch.

- [ ] **Step 1: Create the feed route**

Create `app/api/feed/google/route.js`:

```javascript
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const { rows: products } = await db.query(`
    SELECT
      p.id, p.name, p.slug, p.description, p.price, p.stock_quantity,
      b.name as brand,
      pi.image_url
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN LATERAL (
      SELECT image_url FROM product_images
      WHERE product_id = p.id
      ORDER BY display_order ASC, id ASC
      LIMIT 1
    ) pi ON true
    WHERE p.stock_quantity > 0
    ORDER BY p.id
  `);

  const items = products.map((p) => {
    const url = `https://nayalc.com/product/${p.slug || p.id}`;
    const price = parseFloat(p.price).toFixed(2);
    const title = p.brand ? `${p.name} | ${p.brand}` : p.name;

    return `
    <item>
      <g:id>${escapeXml(String(p.id))}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(p.description || p.name)}</g:description>
      <g:link>${escapeXml(url)}</g:link>
      ${p.image_url ? `<g:image_link>${escapeXml(p.image_url)}</g:image_link>` : ''}
      <g:price>${price} AED</g:price>
      <g:availability>in stock</g:availability>
      ${p.brand ? `<g:brand>${escapeXml(p.brand)}</g:brand>` : ''}
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      <g:shipping>
        <g:country>AE</g:country>
        <g:service>Standard</g:service>
        <g:price>0 AED</g:price>
      </g:shipping>
    </item>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Naya Lumière Cosmetics</title>
    <link>https://nayalc.com</link>
    <description>Luxury beauty and skincare UAE — GERnétic, Zorah, Naya Lumière Perfumes</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
```

- [ ] **Step 2: Verify the feed locally**

Run `npm run dev` and open `http://localhost:3000/api/feed/google` in the browser. Confirm:
- Valid XML is returned (browser shows XML tree or raw XML)
- Each `<item>` has `<g:id>`, `<g:title>`, `<g:price>` in format `450.00 AED`, `<g:link>`
- No raw `&` or `<` characters visible inside text fields

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add app/api/feed/google/route.js
git commit -m "feat(seo): add Google Merchant Center product feed at /api/feed/google"
```

> **After deploying to production:** Go to Google Merchant Center → Products → Feeds → click `+`. Set Country: United Arab Emirates, Language: English, Feed name: `Naya Lumière Products`, Method: Scheduled fetch, File URL: `https://nayalc.com/api/feed/google`, Frequency: Daily. Save and click Fetch Now.

---

## Task 5: Blog Infrastructure

**Files:**
- Create: `lib/blog.js`
- Create directory: `content/blog/`

Install two packages for markdown parsing.

- [ ] **Step 1: Install markdown packages**

```bash
npm install gray-matter remark remark-html
```

Expected: packages appear in `package.json` under `dependencies`.

- [ ] **Step 2: Create the blog utility**

Create `lib/blog.js`:

```javascript
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export function getAllPosts() {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  return files
    .map(filename => {
      const slug = filename.replace(/\.md$/, '');
      const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf8');
      const { data } = matter(raw);
      return { slug, ...data };
    })
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

export async function getPost(slug) {
  const filepath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filepath)) return null;
  const raw = fs.readFileSync(filepath, 'utf8');
  const { data, content } = matter(raw);
  const processed = await remark().use(html, { sanitize: false }).process(content);
  return { slug, ...data, contentHtml: processed.toString() };
}
```

- [ ] **Step 3: Create the content/blog directory**

```bash
mkdir -p content/blog
```

- [ ] **Step 4: Commit**

```bash
git add lib/blog.js
git commit -m "feat(blog): add markdown blog utility (gray-matter + remark)"
```

---

## Task 6: Blog List Page

**Files:**
- Modify: `app/blog/page.js`

Replace the Coming Soon page with a real blog list using the Cloud Luxe design system.

- [ ] **Step 1: Rewrite `app/blog/page.js`**

```javascript
import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';

export const metadata = {
  title: 'Skincare & Beauty Blog UAE | Naya Lumière Cosmetics',
  description: 'Expert skincare tips, GERnétic guides, Zorah reviews, and luxury beauty advice for UAE skin. Read the Naya Lumière Cosmetics blog.',
  keywords: ['skincare blog UAE', 'GERnétic guide', 'beauty tips Dubai', 'luxury skincare blog'],
  alternates: { canonical: 'https://nayalc.com/blog' },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen bg-cl-bg">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-cl-soft mb-3">Beauty Insights</p>
          <h1 className="font-cormorant text-4xl md:text-5xl italic text-cl-deep mb-4">
            The <span className="cl-gradient-text font-black not-italic">Journal</span>
          </h1>
          <p className="text-cl-light text-sm max-w-lg mx-auto">
            Expert skincare guides, product spotlights, and beauty advice tailored for UAE skin.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-center text-cl-light">No posts yet. Check back soon.</p>
        ) : (
          <div className="space-y-6">
            {posts.map(post => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="cl-glass-card p-6 flex flex-col gap-2 hover:shadow-cl-card-hover transition-shadow block"
              >
                <p className="text-xs font-medium text-cl-soft tracking-wide uppercase">
                  {new Date(post.publishedAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <h2 className="text-xl font-semibold text-cl-deep">{post.title}</h2>
                <p className="text-sm text-cl-light">{post.description}</p>
                <span className="text-xs font-semibold text-cl-soft mt-1">Read more →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

If it fails with "Cannot find module 'gray-matter'", confirm Task 5 Step 1 ran successfully.

- [ ] **Step 3: Commit**

```bash
git add app/blog/page.js
git commit -m "feat(blog): replace Coming Soon with real blog list page"
```

---

## Task 7: Blog Post Page

**Files:**
- Create: `app/blog/[slug]/page.js`

- [ ] **Step 1: Create the blog post page**

Create `app/blog/[slug]/page.js`:

```javascript
import { getPost, getAllPosts } from '@/lib/blog';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';

export const dynamicParams = true;

export async function generateStaticParams() {
  return getAllPosts().map(post => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Post Not Found | nayalc.com' };
  return {
    title: `${post.title} | Naya Lumière Cosmetics`,
    description: post.description,
    keywords: post.tags || [],
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
    },
    alternates: { canonical: `https://nayalc.com/blog/${slug}` },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    author: { '@type': 'Organization', name: 'Naya Lumière Cosmetics' },
    publisher: {
      '@type': 'Organization',
      name: 'Naya Lumière Cosmetics',
      logo: { '@type': 'ImageObject', url: 'https://nayalc.com/Adobe%20Express%20-%20file%20(5).png' },
    },
    url: `https://nayalc.com/blog/${slug}`,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nayalc.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://nayalc.com/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: `https://nayalc.com/blog/${slug}` },
    ],
  };

  return (
    <>
      <Script id="article-jsonld" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <Script id="breadcrumb-jsonld" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <main className="min-h-screen bg-cl-bg">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <Link href="/blog" className="text-xs font-medium text-cl-soft hover:text-cl-mid mb-8 inline-block">
            ← Back to Journal
          </Link>
          <p className="text-xs font-medium text-cl-soft tracking-wide uppercase mb-3">
            {new Date(post.publishedAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="font-cormorant text-4xl md:text-5xl italic text-cl-deep mb-6 leading-tight">
            {post.title}
          </h1>
          <p className="text-cl-light text-base mb-10 border-l-2 border-purple-200 pl-4">{post.description}</p>
          <article
            className="prose prose-purple max-w-none text-cl-light prose-headings:text-cl-deep prose-headings:font-semibold prose-a:text-cl-soft prose-strong:text-cl-mid"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Verify and commit**

```bash
npm run build
git add app/blog/[slug]/page.js
git commit -m "feat(blog): add individual blog post page with Article and BreadcrumbList schema"
```

---

## Task 8: Write the 5 SEO Blog Articles

**Files:**
- Create: `content/blog/gernetic-synchro-guide-uae.md`
- Create: `content/blog/best-gernetic-products-dubai-climate.md`
- Create: `content/blog/zorah-bio-cosmetics-uae-guide.md`
- Create: `content/blog/luxury-skincare-gifts-dubai-2025.md`
- Create: `content/blog/what-is-bio-cosmetics-gernetic-explained.md`

- [ ] **Step 1: Create `content/blog/gernetic-synchro-guide-uae.md`**

```markdown
---
title: "GERnétic Synchro: The Complete Guide for UAE Skin"
description: "Everything you need to know about GERnétic Synchro concentrate — how it works, how to use it, and why it suits UAE skin and climate perfectly."
publishedAt: "2026-04-27"
author: "Naya Lumière Cosmetics"
tags: ["GERnétic", "Synchro", "skincare UAE", "bio-cosmetics", "serum Dubai"]
---

## What Is GERnétic Synchro?

GERnétic Synchro is a bio-energetic concentrate developed by the French laboratory GERnétic International. Unlike conventional skincare, it works at the cellular level — delivering a concentrated blend of amino acids, vitamins, and lipids that the skin recognises and absorbs as its own.

The result is skin that looks revitalised from within, not just coated from the outside.

## Why It Works for UAE Skin

The UAE climate — intense heat, humidity, and air conditioning — creates a cycle of dehydration and sensitivity that strips skin of its natural defences. GERnétic Synchro addresses this directly:

- **Deep hydration** that doesn't rely on heavy occlusives
- **Cellular repair** that helps skin recover from sun exposure and temperature extremes
- **Lightweight texture** that absorbs immediately without clogging pores in humidity

## How to Use GERnétic Synchro

Apply 2–3 drops to clean, slightly damp skin before your moisturiser, morning and evening. In the UAE summer months, use it as a standalone treatment — its formula is complete enough on its own.

For best results, pair with GERnétic Biomimetic cream as your finishing moisturiser.

## Where to Buy GERnétic Synchro in UAE

Naya Lumière Cosmetics is the official UAE retailer of GERnétic. Shop GERnétic Synchro at [nayalc.com](https://nayalc.com) with free delivery across UAE on orders over AED 200. All products ship from our UAE warehouse — no customs delays, no grey market risk.
```

- [ ] **Step 2: Create `content/blog/best-gernetic-products-dubai-climate.md`**

```markdown
---
title: "Best GERnétic Products for Dubai's Climate"
description: "Dubai's heat and humidity demand skincare that adapts. Here are the GERnétic products that perform best in the UAE climate, chosen by our skincare specialists."
publishedAt: "2026-04-27"
author: "Naya Lumière Cosmetics"
tags: ["GERnétic", "Dubai skincare", "best skincare Dubai", "UAE climate", "bio-cosmetics Dubai"]
---

## Skincare in Dubai Is Different

Extreme heat. Relentless air conditioning. UV index that stays high year-round. Dubai's environment is genuinely demanding for skin — most European skincare formulas were not designed for it.

GERnétic was. As a French bio-cosmetic laboratory with a strong clinical heritage, GERnétic products are used by dermatologists and aestheticians across the Gulf region because they adapt to the skin's needs rather than imposing a fixed formula.

## The Top GERnétic Products for UAE Skin

### 1. GERnétic Synchro Concentrate

The most versatile product in the range. Synchro delivers cellular nutrition in a lightweight, fast-absorbing formula — ideal for Dubai's humidity where heavier serums feel suffocating. Use it morning and evening as your treatment step.

### 2. GERnétic Biomimetic

A protective daily cream that mimics the skin's own lipid barrier. In a city where skin alternates between scorching outdoor air and cold air-conditioned interiors every few minutes, barrier protection is critical. Biomimetic helps skin maintain equilibrium.

### 3. GERnétic Solar

SPF protection formulated for daily professional use. The UAE sun is unforgiving — Solar provides broad-spectrum protection without the white cast or pore-blocking effect of cheaper sunscreens.

## A Simple GERnétic Routine for UAE

1. **Morning:** Cleanse → Synchro (2 drops) → Biomimetic → Solar
2. **Evening:** Cleanse → Synchro (3 drops) → Biomimetic

This three-product core addresses hydration, barrier protection, and UV defence — the three pillars of healthy skin in the UAE.

## Shop GERnétic in UAE

All GERnétic products are available at [nayalc.com](https://nayalc.com) with free UAE delivery. We are the official retailer — you receive genuine products with full manufacturer support.
```

- [ ] **Step 3: Create `content/blog/zorah-bio-cosmetics-uae-guide.md`**

```markdown
---
title: "Zorah Bio-Cosmetics in UAE: The Complete Guide"
description: "Zorah is Canada's leading natural bio-cosmetic brand, powered by argan oil and plant actives. Here's why it's become a favourite for UAE shoppers who want clean, effective skincare."
publishedAt: "2026-04-27"
author: "Naya Lumière Cosmetics"
tags: ["Zorah", "Zorah UAE", "natural skincare UAE", "argan oil Dubai", "vegan skincare UAE"]
---

## What Makes Zorah Different?

Zorah Biocosmétiques is a Canadian brand built on one philosophy: high-performance skincare made entirely from plant-based, ethically sourced ingredients. Every product is:

- **Vegan** — no animal-derived ingredients
- **Cruelty-free** — never tested on animals
- **Argan oil powered** — their signature ingredient, cold-pressed from Moroccan argan nuts

In the UAE, where clean beauty awareness is growing rapidly, Zorah fills a clear gap between natural skincare and genuine performance.

## Zorah and UAE Skin

Argan oil is exceptional for UAE skin for two reasons: it is deeply nourishing without being heavy, and it contains high levels of Vitamin E, which helps defend against UV damage and oxidative stress — constant challenges in the Gulf climate.

## Best Zorah Products for UAE Shoppers

**Zorah Sublime Night Cream** — overnight treatment for dehydrated, sun-stressed skin. Apply after cleansing and let it work while you sleep. Fragrance-free, suitable for sensitive skin.

**Zorah Argan Serum** — concentrated argan actives for an extra hydration boost before your moisturiser. Ideal in the dry winter months (November to February) when UAE air loses humidity.

**Zorah Prisme Foundation** — mineral-based, buildable coverage that doesn't melt in the heat. One of the few foundations that genuinely holds up through a Dubai afternoon.

## Shop Zorah in UAE

[Naya Lumière Cosmetics](https://nayalc.com) is an authorised Zorah retailer in UAE. Free delivery on orders over AED 200, fast dispatch from our UAE warehouse.
```

- [ ] **Step 4: Create `content/blog/luxury-skincare-gifts-dubai-2025.md`**

```markdown
---
title: "Luxury Skincare Gift Sets in Dubai — 2025 Guide"
description: "Looking for a premium skincare gift in Dubai? Here are the best luxury beauty gift sets available in the UAE, with free delivery from Naya Lumière Cosmetics."
publishedAt: "2026-04-27"
author: "Naya Lumière Cosmetics"
tags: ["skincare gifts Dubai", "luxury beauty gifts UAE", "gift sets UAE", "beauty gifts Dubai 2025"]
---

## Gifting Skincare in the UAE

Skincare gifts have become one of the most appreciated luxury gestures in the UAE. Whether for Eid, birthdays, corporate gifting, or just because — a well-chosen beauty gift communicates care, thoughtfulness, and quality.

The challenge is knowing which brands are worth gifting. In the UAE market, buying from an authorised retailer matters — counterfeit and grey-market products circulate widely.

## Our Top Gift Set Recommendations

### For Her: GERnétic Starter Collection

Introduce someone to GERnétic bio-cosmetics with a curated starter set: Synchro Concentrate + Biomimetic moisturiser. A complete daily ritual in two products. Ideal price point: AED 400–600.

### For Sensitive Skin: Zorah Natural Collection

Zorah's plant-based, fragrance-free formulas are ideal when you don't know someone's skin type — gentle enough for sensitive skin, effective enough for demanding skin. The Sublime Night Cream alone makes a luxurious standalone gift.

### For Fragrance Lovers: Naya Lumière Perfumes

Our own luxury fragrance collection — crafted for the UAE market, presented in collector-quality bottles. A bottle of Naya Lumière Perfume is an elevated gift that carries the story of the brand.

## Why Buy Luxury Skincare Gifts from Naya Lumière

- **Official retailer** of GERnétic and Zorah in UAE — guaranteed authentic products
- **Free UAE delivery** on orders over AED 200
- **Fast dispatch** from our UAE warehouse — receive in 1–3 business days

[Browse our gift sets](https://nayalc.com/gift-sets) or contact us for bespoke corporate gifting arrangements.
```

- [ ] **Step 5: Create `content/blog/what-is-bio-cosmetics-gernetic-explained.md`**

```markdown
---
title: "What Is Bio-Cosmetics? GERnétic Explained"
description: "Bio-cosmetics is skincare that works with the skin's own biology rather than masking it. Here's what makes GERnétic a pioneer of bio-cosmetics — and why it matters for your skin."
publishedAt: "2026-04-27"
author: "Naya Lumière Cosmetics"
tags: ["bio cosmetics UAE", "what is bio cosmetics", "GERnétic explained", "cellular skincare Dubai"]
---

## What Does Bio-Cosmetics Mean?

Bio-cosmetics — sometimes called bio-energetic skincare — refers to formulas that work in harmony with the skin's own biological processes rather than overriding them.

Conventional skincare often relies on occlusives, surfactants, and synthetic actives to force a visible change. Bio-cosmetics takes a different position: give the skin what it already recognises, and let the skin's own intelligence do the work.

## The Science Behind GERnétic

GERnétic International, founded in France in the 1960s, was one of the first laboratories to apply cell biology research to skincare. Their insight: skin cells have specific nutritional needs, just like any other living cells. If those needs are met precisely, the cells function optimally — and optimal cell function equals healthy, resilient skin.

The GERnétic formulas deliver:

- **Amino acids** — the building blocks of proteins like collagen and elastin
- **Lipids** — matching the skin's own fatty acid profile
- **Vitamins** — antioxidants that protect cells from UV damage and oxidative stress
- **Trace elements** — co-factors that enable enzymatic reactions in the skin

Because these ingredients are biologically familiar to the skin, they are absorbed rapidly and efficiently.

## How This Differs from Conventional Skincare

| Conventional Skincare | GERnétic Bio-Cosmetics |
|---|---|
| Masks symptoms | Addresses root causes |
| Uses synthetic actives | Uses biologically compatible ingredients |
| Can irritate sensitive skin | Recognised and accepted by skin |
| Results fade when you stop | Supports the skin's own regenerative capacity |

## Who Is Bio-Cosmetics For?

Bio-cosmetics is particularly beneficial for:

- **Sensitive or reactive skin** — no harsh actives, no irritation risk
- **Mature skin** — supports the skin's declining regenerative capacity
- **UAE and Gulf skin** — addresses the specific stresses of sun exposure, heat, and air-conditioned environments

## Shop GERnétic in UAE

Naya Lumière Cosmetics is the official UAE retailer of GERnétic bio-cosmetics. [Browse the full GERnétic collection](https://nayalc.com/brands) with free delivery across UAE.
```

- [ ] **Step 6: Verify blog end-to-end**

Run `npm run dev` and visit:
- `/blog` — all 5 articles listed with title, date, description
- `/blog/gernetic-synchro-guide-uae` — full article renders with formatted HTML
- View source on the post page and confirm `<script type="application/ld+json">` blocks for Article and BreadcrumbList are present

- [ ] **Step 7: Commit**

```bash
git add content/blog/
git commit -m "feat(blog): add 5 SEO-targeted articles for GERnétic, Zorah, and UAE skincare keywords"
```

---

## Task 9: Update Sitemap to Include Blog Posts

**Files:**
- Modify: `app/sitemap.js`

- [ ] **Step 1: Add blog posts to the sitemap**

Replace the full contents of `app/sitemap.js` with:

```javascript
import db from '@/lib/db';
import { getAllPosts } from '@/lib/blog';

export default async function sitemap() {
  const baseUrl = 'https://nayalc.com';

  const [productsResult, categoriesResult, brandsResult] = await Promise.all([
    db.query('SELECT id, slug FROM products WHERE stock_quantity > 0'),
    db.query('SELECT id FROM categories'),
    db.query('SELECT id FROM brands'),
  ]);

  const posts = getAllPosts();
  const blogUrls = posts.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const productUrls = productsResult.rows.map((product) => ({
    url: `${baseUrl}/product/${product.slug || product.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const categoryUrls = categoriesResult.rows.map((cat) => ({
    url: `${baseUrl}/collections/${cat.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const brandUrls = brandsResult.rows.map((brand) => ({
    url: `${baseUrl}/brand/${brand.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const staticRoutes = [
    { path: '', priority: 1.0 },
    { path: '/all-products', priority: 0.9 },
    { path: '/new-arrivals', priority: 0.9 },
    { path: '/sales', priority: 0.9 },
    { path: '/brands', priority: 0.8 },
    { path: '/collections', priority: 0.8 },
    { path: '/SkinCare', priority: 0.8 },
    { path: '/fragrance', priority: 0.8 },
    { path: '/gift-sets', priority: 0.8 },
    { path: '/blog', priority: 0.7 },
  ].map(({ path, priority }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority,
  }));

  return [...staticRoutes, ...blogUrls, ...productUrls, ...categoryUrls, ...brandUrls];
}
```

- [ ] **Step 2: Verify and commit**

```bash
npm run build
git add app/sitemap.js
git commit -m "feat(seo): add blog posts to sitemap"
```

---

## Task 10: Final Deploy and Google Submission

- [ ] **Step 1: Run final clean build**

```bash
npm run build
```

Fix any errors before deploying.

- [ ] **Step 2: Deploy to production**

Push to your main branch (Vercel auto-deploy) or run:

```bash
vercel --prod
```

- [ ] **Step 3: Verify the live feed**

Visit `https://nayalc.com/api/feed/google` and confirm valid XML is returned with your products listed.

- [ ] **Step 4: Submit feed to Google Merchant Center**

In Google Merchant Center → Products → Feeds → click `+`:
- Country: **United Arab Emirates**
- Language: **English**
- Feed name: `Naya Lumière Products`
- Method: **Scheduled fetch**
- File URL: `https://nayalc.com/api/feed/google`
- Frequency: **Daily**

Save, then click **Fetch Now** to trigger the first import immediately.

- [ ] **Step 5: Submit sitemap to Google Search Console**

In Google Search Console → Sitemaps → enter `sitemap.xml` → Submit.

- [ ] **Step 6: Request indexing for key pages**

In Google Search Console → URL Inspection, enter each URL below → click **Request Indexing**:
- `https://nayalc.com`
- `https://nayalc.com/blog/gernetic-synchro-guide-uae`
- `https://nayalc.com/blog/best-gernetic-products-dubai-climate`
- `https://nayalc.com/blog/zorah-bio-cosmetics-uae-guide`
- Your GERnétic Synchro product URL (find it at nayalc.com/all-products)

- [ ] **Step 7: Final commit and push**

```bash
git add -A
git commit -m "feat(seo): complete SEO/SEM implementation — metadata, schema, feed, blog"
git push
```
