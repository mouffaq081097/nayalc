import db from '@/lib/db';

export default async function sitemap() {
  const baseUrl = 'https://nayalc.com';

  // Fetch all products
  const { rows: products } = await db.query('SELECT id FROM products');
  
  const productUrls = products.map((product) => ({
    url: `${baseUrl}/product/${product.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Static routes
  const staticRoutes = [
    '',
    '/all-products',
    '/blog',
    '/brands',
    '/collections',
    '/fragrance',
    '/gift-sets',
    '/new-arrivals',
    '/sales',
    '/SkinCare',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1.0 : 0.9,
  }));

  return [...staticRoutes, ...productUrls];
}
