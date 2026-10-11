import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { resendOrderConfirmation } from '@/lib/orderConfirmation';

// Sends the customer their order confirmation again — e.g. after the order was corrected
export async function POST(request, { params }) {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    const { orderId } = await params;

    try {
        const { status, body } = await resendOrderConfirmation(orderId);
        return NextResponse.json(body, { status });
    } catch (error) {
        console.error(`Error sending confirmation for order ${orderId}:`, error);
        return NextResponse.json({ message: 'The email could not be sent.', error: error.message }, { status: 500 });
    }
}
