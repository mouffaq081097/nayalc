import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getBackorderOverview, allocateStock } from '@/lib/backorders';

// The logistics view of pre-orders: units owed per product and the orders waiting on them
export async function GET() {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    try {
        return NextResponse.json(await getBackorderOverview());
    } catch (error) {
        console.error('Backorder overview failed:', error);
        return NextResponse.json({ message: 'Could not load backorders', error: error.message }, { status: 500 });
    }
}

// Hands shelf stock to waiting pre-orders again — saving the product does this
// already; this is the manual retry if that step failed
export async function POST(request) {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    try {
        const { productId } = await request.json();
        if (!productId) return NextResponse.json({ message: 'productId is required' }, { status: 400 });
        return NextResponse.json(await allocateStock([productId]));
    } catch (error) {
        console.error('Stock allocation failed:', error);
        return NextResponse.json({ message: 'Could not allocate stock', error: error.message }, { status: 500 });
    }
}
