import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { resendStatusEmail } from '@/lib/orderStatus';

// Sends the customer the email for the order's current status again — e.g. the Shipped email after the first send failed
export async function POST(request, { params }) {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    const { orderId } = await params;

    try {
        const { status, body } = await resendStatusEmail(orderId);
        return NextResponse.json(body, { status });
    } catch (error) {
        console.error(`Error resending status email for order ${orderId}:`, error);
        return NextResponse.json({ message: 'The email could not be sent.', error: error.message }, { status: 500 });
    }
}
