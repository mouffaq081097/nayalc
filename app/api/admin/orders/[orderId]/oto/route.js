import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { createOtoShipment } from '@/lib/oto';

// "Ship with OTO" — sends the order to OTO, which books the courier from our pickup location
export async function POST(request, { params }) {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    const { orderId } = await params;

    try {
        const { status, body } = await createOtoShipment(orderId);
        return NextResponse.json(body, { status });
    } catch (error) {
        console.error(`Error sending order ${orderId} to OTO:`, error);
        return NextResponse.json({ message: `OTO did not accept the order: ${error.message}` }, { status: 502 });
    }
}
