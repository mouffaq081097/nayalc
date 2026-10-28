import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { updateOrderStatus } from '../../../../lib/orderStatus';
import { getOrderDetails } from '@/lib/orderDetails';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'mouffaq@nayalc.com';

export async function GET(request, context) {
    const { orderId } = await context.params;
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.email === ADMIN_EMAIL || session?.user?.role === 'admin';

    try {
        const order = await getOrderDetails(orderId, { markViewed: isAdmin });
        // Customers see only their own orders; any other id reads as not found
        if (!order || (!isAdmin && String(order.user_id) !== String(session?.user?.id))) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }
        return NextResponse.json(order);
    } catch (error) {
        console.error('Error fetching order details:', error);
        return NextResponse.json({ message: 'Error fetching order details from database', error: error.message }, { status: 500 });
    }
}

export async function PUT(request, context) {
    const { orderId } = await context.params;
    const session = await getServerSession(authOptions);
    if (session?.user?.email !== ADMIN_EMAIL) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { status, cancellationReason, trackingNumber, courierName, courierWebsite, shippingCompany, shippingLink } = await request.json();
    // Accept both legacy (shippingCompany/shippingLink) and current (courierName/courierWebsite) field names
    const result = await updateOrderStatus(orderId, {
        status,
        cancellationReason,
        trackingNumber,
        courierName: courierName ?? shippingCompany ?? null,
        courierWebsite: courierWebsite ?? shippingLink ?? null,
    });
    return NextResponse.json(result.body, { status: result.status });
}