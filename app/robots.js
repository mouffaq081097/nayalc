export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/account/',
          '/checkout/',
          '/cart/',
          '/auth/',
        ],
      },
    ],
    sitemap: 'https://nayalc.com/sitemap.xml',
    host: 'https://nayalc.com',
  };
}
