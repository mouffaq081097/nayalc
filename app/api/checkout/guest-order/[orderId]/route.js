import { NextResponse } from 'next/server';
import { getOrderDetails } from '@/lib/orderDetails';
import { readOrderLinkToken } from '@/lib/guestCheckout';

// The order confirmation page for a guest: the signed link from checkout
// (?access=…) stands in for a session, for this one order only.
export async function GET(request, { params }) {
    const { orderId } = await params;
    const access = new URL(request.url).searchParams.get('access');
    const link = readOrderLinkToken(access, orderId);
    if (!link) return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    try {
        const order = await getOrderDetails(orderId);
        if (!order || String(order.user_id) !== String(link.userId)) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }
        return NextResponse.json(order);
    } catch (error) {
        console.error('Guest order lookup failed:', error);
        return NextResponse.json({ message: 'Could not load the order' }, { status: 500 });
    }
}
