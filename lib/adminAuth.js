import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth.js';

// The signed-in user from the session ({ id, role, ... }), or null
export async function currentSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

// Returns a 401 response unless the request comes from a signed-in admin; null means the handler may continue
export async function requireAdmin() {
  const user = await currentSessionUser();
  if (user?.role === 'admin') return null;
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}
