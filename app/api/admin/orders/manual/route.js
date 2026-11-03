import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { createManualOrder, findCustomers, ManualOrderError } from '@/lib/manualOrders';

// GET /api/admin/orders/manual?q=<email, name or phone> → matching customers with their addresses
export async function GET(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const q = new URL(request.url).searchParams.get('q') || '';
    return NextResponse.json({ customers: await findCustomers(q) });
  } catch (error) {
    console.error('Customer search failed:', error);
    return NextResponse.json({ message: 'Customers could not be searched.' }, { status: 500 });
  }
}

// POST /api/admin/orders/manual → creates an order typed in by the team (see lib/manualOrders.js)
export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 400 });
  }
  try {
    const result = await createManualOrder(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ManualOrderError) return NextResponse.json({ message: error.message }, { status: error.status });
    console.error('Manual order failed:', error, { code: error.code, detail: error.detail, column: error.column, constraint: error.constraint, table: error.table });
    return NextResponse.json({
      message: 'The order could not be created.',
      error: [error.message, error.detail, error.constraint && `constraint ${error.constraint}`].filter(Boolean).join(' · '),
    }, { status: 500 });
  }
}
