/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/.well-known/apple-developer-merchantid-domain-association',
        destination: '/.well-known/apple-developer-merchantid-domain-association',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.nayalc.com',
        port: '',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '217.165.41.108',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'gernetic.com',
        port: '',
        pathname: '/cdn/shop/files/**',
      },
      {
        protocol: 'https',
        hostname: 'zorah.ca',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.freepik.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Requests to /api/admin/* pass through middleware.js (role check) before
  // reaching the route handler. Next's default cap on the body middleware is
  // allowed to forward is 10mb, which silently truncates larger image
  // uploads (breaking FormData parsing) on every /api/admin/* upload route
  // (journal, homepage-images, brand/product images). Raised to fit a
  // typical phone-camera photo.
  experimental: {
    middlewareClientMaxBodySize: '20mb',
  },
  /* config options here */
};

export default nextConfig;