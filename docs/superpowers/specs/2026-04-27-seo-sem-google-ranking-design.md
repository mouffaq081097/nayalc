# SEO & SEM: Google Ranking Improvement — Design Spec

**Date:** 2026-04-27
**Goal:** Push nayalc.com from page 2 to page 1 on Google UAE for both brand-specific terms (GERnétic Synchro, Zorah UAE) and category terms (luxury skincare UAE, bio cosmetics Dubai).
**Approach:** Option C — Technical SEO code improvements + Paid Google Ads in parallel.

---

## Context

- **Site:** Naya Lumière Cosmetics (nayalc.com) — UAE luxury beauty e-commerce, Next.js 15 App Router
- **Search market:** Google UAE (google.ae + UAE IP)
- **Current ranking:** Page 2 for "gernetic synchro" and similar terms
- **Budget:** AED 1,500–2,500/month for paid ads (user controls)
- **Brand name decision:** Keep "Naya Lumière Cosmetics" — do not rebrand to "Nayalc". Domain abbreviation is normal in luxury (LVMH, SSENSE). Optionally acquire nayalumiere.com as a redirect.

### Current SEO State

| What exists | Quality |
|---|---|
| Global metadata (title, description, keywords) | Good |
| Open Graph + Twitter Card | Good |
| Organization + WebSite JSON-LD | Good |
| Product JSON-LD on product pages | Present but incomplete |
| Dynamic sitemap (products, brands, categories) | Good |
| robots.txt | Correct |
| Blog | Coming Soon — no content |
| Product metadata per product | Minimal — generic for most products |
| AggregateRating in product schema | Missing |
| BreadcrumbList schema | Missing |
| Brand page metadata | Missing |
| Collection page metadata | Missing |
| Google Merchant Center feed | Missing |

---

## Part 1: Technical SEO Code Changes

### 1. Rich Product Metadata (generateMetadata)

**File:** `app/product/[productId]/page.js`

Currently: only the Zorah Sublime product has a custom title/description. All others use `product.description.substring(0, 160)`.

**New behaviour:**
- Title pattern: `{Product Name} | {Brand} | Buy in UAE — nayalc.com`
- Description: generated from `benefits` + `description` fields, 140–160 chars, includes brand name and "UAE" naturally
- Canonical URL always uses slug (never numeric ID)
- OpenGraph image always uses first product image

**Example output:**
- Before: `"Synchro Concentrate | Beauty | nayalc.com"`
- After: `"GERnétic Synchro Concentrate | Bio-Energetic Skincare | Buy in UAE — nayalc.com"`

---

### 2. AggregateRating in Product JSON-LD

**File:** `app/product/[productId]/page.js`

Add `aggregateRating` to the existing `Product` JSON-LD block using real review data already fetched by `getProductBySlugOrId` (fields: `averageRating`, `reviewCount`).

Only emit `aggregateRating` when `reviewCount > 0` — Google ignores or penalises empty rating schemas.

**Result:** Yellow stars appear next to your listing in Google search results, increasing click-through rate significantly.

---

### 3. BreadcrumbList Schema

**Files:** `app/product/[productId]/page.js`, `app/brand/[id]/page.js`, `app/collections/[categoryId]/page.js`

Add `BreadcrumbList` JSON-LD to all three page types:

- Product: `Home › {Brand} › {Product Name}`
- Brand: `Home › Brands › {Brand Name}`
- Collection: `Home › Collections › {Category Name}`

**Result:** Breadcrumb trail shown in Google results — makes the listing appear larger and more structured.

---

### 4. FAQ Schema on Product Pages

**File:** `app/product/[productId]/page.js`

Generate FAQ JSON-LD from existing product fields:
- `how_to_use` → "How do I use {Product Name}?"
- `benefits` → "What are the benefits of {Product Name}?"
- `ingredients` → "What are the key ingredients in {Product Name}?"

Only emit FAQ schema when at least one of these fields is populated.

**Result:** Expandable Q&A shown directly on Google results page, dramatically increasing result footprint.

---

### 5. Brand Page Metadata

**File:** `app/brand/[id]/page.js`

Add `generateMetadata` function. The brand page currently has no metadata at all.

- Title pattern: `{Brand Name} Official UAE | Skincare & Beauty — nayalc.com`
- Description: brand-specific, mentions product types and UAE context
- Canonical URL: `https://nayalc.com/brand/{id}`

**GERnétic example:**
- Title: `"GERnétic Bio-Cosmetics UAE | Official Retailer — nayalc.com"`
- Description: `"Shop GERnétic bio-energetic skincare in the UAE. Official retailer of Synchro, Biomimetic, and professional skincare formulas. Free UAE delivery on orders over AED 200."`

---

### 6. Collection Page Metadata

**File:** `app/collections/[categoryId]/page.js`

Add `generateMetadata` function. Collection pages currently have no metadata.

- Title pattern: `{Category Name} | Luxury Skincare UAE — nayalc.com`
- Description: category-specific, includes "UAE" and "Dubai" naturally
- Canonical URL: `https://nayalc.com/collections/{categoryId}`

---

### 7. Google Merchant Center Product Feed

**New file:** `app/api/feed/google/route.js`

A public GET endpoint that returns a Google-compliant XML product feed (RSS 2.0 / Google Shopping format).

**Feed fields per product:**
- `g:id` — product ID
- `g:title` — product name + brand
- `g:description` — product description
- `g:link` — `https://nayalc.com/product/{slug}`
- `g:image_link` — first product image (Cloudinary URL)
- `g:price` — price in AED
- `g:availability` — in stock / out of stock
- `g:brand` — brand name (GERnétic, Zorah, Naya Lumière)
- `g:condition` — new
- `g:shipping` — UAE, free over AED 200

Queries: `products JOIN product_images JOIN brands WHERE stock_quantity > 0`.

Response: `Content-Type: application/xml`, publicly accessible (no auth).

**How to submit:** User submits `https://nayalc.com/api/feed/google` to Google Merchant Center as a Scheduled Fetch (daily). Do not submit until endpoint is deployed and returning valid XML.

---

### 8. Blog — Real Implementation

**Files:** `app/blog/page.js`, `app/blog/[slug]/page.js`, blog posts as markdown files in `content/blog/`

Replace the "Coming Soon" blog with a real markdown-based blog (no DB required — posts are `.md` files read at build time via `gray-matter` + `remark`).

**Structure:**
```
content/blog/
  gernetic-synchro-guide-uae.md
  best-gernetic-products-dubai-climate.md
  zorah-bio-cosmetics-uae-guide.md
  luxury-skincare-gifts-dubai-2025.md
  what-is-bio-cosmetics-gernetic-explained.md
```

**Each post has:**
- Frontmatter: `title`, `description`, `publishedAt`, `author`, `tags`, `featuredImage`
- Article JSON-LD schema
- `generateMetadata` with keyword-optimized title + description
- Internal links to relevant product pages

**Initial 5 articles target:**

| Slug | Target keyword |
|---|---|
| `gernetic-synchro-guide-uae` | "gernetic synchro UAE" |
| `best-gernetic-products-dubai-climate` | "gernetic Dubai" / "best skincare Dubai" |
| `zorah-bio-cosmetics-uae-guide` | "zorah UAE" / "zorah argan oil Dubai" |
| `luxury-skincare-gifts-dubai-2025` | "skincare gifts Dubai" / "luxury beauty gifts UAE" |
| `what-is-bio-cosmetics-gernetic-explained` | "bio cosmetics UAE" / "what is bio cosmetics" |

---

## Part 2: What the User Does on Google's Side

### Google Business Profile
- Verify the existing listing (postcard / phone / email)
- Business categories: "Beauty Store" + "Cosmetics Store"
- Add: UAE phone, opening hours, website URL, 10+ product/store photos
- Business description (provided — 750 chars, already written)
- **Goal:** Appear in the Google Maps 3-pack for "skincare store Dubai" and similar

### Google Merchant Center
- Create account at merchants.google.com
- Verify and claim nayalc.com
- Submit feed URL: `https://nayalc.com/api/feed/google` as Scheduled Fetch (daily)
- Wait for feed approval (~1–3 business days)

### Google Ads Campaigns

**Campaign 1 — Google Shopping (AED 800–1,500/month)**
- Linked to Merchant Center
- Targets UAE
- Shows product images + price at top of results
- Highest ROI for e-commerce product searches

**Campaign 2 — Google Search Ads (AED 700–1,000/month)**
- Target keywords:
  - `gernetic synchro UAE` / `gernetic Dubai` / `buy gernetic UAE`
  - `zorah beauty UAE` / `zorah argan oil Dubai`
  - `luxury skincare UAE` / `bio cosmetics Dubai`
  - `night cream Dubai` / `face serum UAE`
  - `skincare gift set Dubai`
- Ad copy should mention: brand name, free UAE delivery, official retailer
- Start with broad match + phrase match, tighten after 2 weeks of data

**Total recommended budget:** AED 1,500–2,500/month. Allocate 60% Shopping, 40% Search.

### Google Search Console
- Verify nayalc.com (HTML tag or DNS method)
- Submit sitemap: `https://nayalc.com/sitemap.xml`
- Monitor for crawl errors and coverage issues after deployment

---

## Timeline

| Week | Action |
|---|---|
| Week 1 | Deploy all code changes; GBP verified; Search Ads live → **immediate page-1 presence via ads** |
| Week 2 | Merchant Center approved; Shopping Ads live → **product images at top of results** |
| Month 1–2 | Google re-crawls site; new schemas indexed; blog articles indexed → **organic movement begins** |
| Month 3 | Brand terms ranking organically → **reduce ad spend if desired** |

---

## Dependencies & Constraints

- `fetchWithAuth` must come from `useAppContext()` — the feed endpoint is public so no auth needed
- Feed endpoint must return valid Google Shopping XML or Merchant Center will reject it
- AggregateRating only emitted when `reviewCount > 0` — no fake data
- FAQ schema only emitted when product fields are populated — no empty schemas
- Blog posts are markdown files — no DB schema changes required
- `gray-matter` and `remark` npm packages required for markdown parsing

---

## Out of Scope

- Arabic language version of the site (future phase)
- Google My Business product posts automation
- Bing/Yahoo SEO (UAE usage is <5%)
- Social media advertising (separate initiative)
