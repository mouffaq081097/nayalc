
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function middleware(request) {
  const token = request.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return NextResponse.next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }
}

export const config = {
  matcher: [
    '/api/users/:path*',
    '/api/orders/:path*',
    '/api/wishlist/:path*',
    '/api/reviews/:path*',
    '/api/chat/:path*',
    '/api/chat-global/:path*',
    '/api/chat-user/:path*',
    '/api/admin/:path*',
  ],
};
