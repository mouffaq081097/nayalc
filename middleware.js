
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose'; // Import jwtVerify from jose

export async function middleware(request) {
  const token = request.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }

  // Ensure JWT_SECRET is defined and convert it to a Uint8Array
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET is not defined in environment variables.');
    return NextResponse.json({ error: 'Internal Server Error: JWT_SECRET not configured' }, { status: 500 });
  }
  const secretKey = new TextEncoder().encode(secret);

  try {
    // Use jose's jwtVerify
    await jwtVerify(token, secretKey);
    return NextResponse.next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return NextResponse.json({ error: 'Unauthorized: Invalid token', details: error.message }, { status: 401 });
  }
}


export const config = {
  matcher: [
    '/api/users/:path*',
    '/api/orders/:path*',
    '/api/chat/:path*',
    '/api/chat-global/:path*',
    '/api/chat-user/:path*',
    '/api/admin/:path*',
  ],
};
