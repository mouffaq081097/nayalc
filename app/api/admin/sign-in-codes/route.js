import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { codeRequestReport } from '@/lib/emailCodeGuard';

// GET /api/admin/sign-in-codes?days=7 → who asked for sign-in codes, and what was sent or blocked
export async function GET(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const days = Math.min(Math.max(parseInt(new URL(request.url).searchParams.get('days'), 10) || 7, 1), 90);
    return NextResponse.json(await codeRequestReport({ days }));
  } catch (error) {
    console.error('Sign-in code report failed:', error);
    return NextResponse.json({ message: 'The report could not be loaded.', error: error.message }, { status: 500 });
  }
}
