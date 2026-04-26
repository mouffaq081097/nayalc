import db from '@/lib/db';

export default async function sitemap() {
  const baseUrl = 'https://nayalc.com';

  const [productsResult, categoriesResult, brandsResult] = await Promise.all([
    db.query('SELECT id, slug FROM products WHERE stock_quantity > 0'),
    db.query('SELECT id FROM categories'),
    db.query('SELECT id FROM brands'),
  ]);

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
    { path: '/blog', priority: 0.6 },
  ].map(({ path, priority }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority,
  }));

  return [...staticRoutes, ...productUrls, ...categoryUrls, ...brandUrls];
}
