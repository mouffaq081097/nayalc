import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * For /api/users/[userId]/… routes: the signed-in customer may only read or
 * change their own account; admins may act on any (e.g. the chat's customer
 * panel). Returns a response to send back when refused, or null to go on.
 *
 * The middleware only checks that someone is signed in, so without this any
 * customer could read another's addresses by changing the id in the URL.
 */
export async function requireSelf(request, userId) {
  const token = await getToken({ req: request });
  if (!token) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
  const self = String(token.id ?? token.sub) === String(userId);
  if (self || token.role === 'admin') return null;
  return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
}
