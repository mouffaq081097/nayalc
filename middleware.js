
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      // Example: Only allow admin to access '/api/admin' routes
      if (req.nextUrl.pathname.startsWith('/api/admin')) {
        return token?.role === 'admin';
      }
      // Allow authenticated users to access all other matched routes
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    '/api/users/:path*',
    '/api/orders/:path*',
    '/api/chat/:path*',
    '/api/chat-global/:path*',
    '/api/chat-user/:path*',
    '/api/admin/:path*',
    '/api/payment-methods/:path*',
  ],
};
