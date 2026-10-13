import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import db from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { updateOrderStatus } from '@/lib/orderStatus';
import { ensureBackorderColumns } from '@/lib/backorders';
import { sendPreorderAdminEmail } from '@/lib/mail';

// A customer may cancel their own order while it waits for pre-order stock.
// Cancelling refunds a card payment, returns stock and points (updateOrderStatus);
// a Tabby refund stays manual, so the team is told.
export async function POST(request, context) {
    const { orderId } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
    }

    await ensureBackorderColumns();
    const { rows: [order] } = await db.query(
        `SELECT o.id, o.user_id, o.awaiting_stock, o.payment_method, o.total_amount, COALESCE(u.first_name, 'Customer') AS first_name
         FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = $1`,
        [orderId]
    );
    if (!order || String(order.user_id) !== String(session.user.id)) {
        return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
    }
    if (!order.awaiting_stock) {
        return NextResponse.json({ message: 'This order is already being prepared, so it can no longer be cancelled here. Please contact us and we\'ll help.' }, { status: 409 });
    }

    const result = await updateOrderStatus(orderId, {
        status: 'Cancelled',
        cancellationReason: 'Cancelled by you while waiting for pre-order stock',
    });
    if (result.status === 200) {
        await sendPreorderAdminEmail({
            cancelled: { orderId: order.id, paymentMethod: order.payment_method, total: order.total_amount, customerName: order.first_name },
        });
    }
    return NextResponse.json(result.body, { status: result.status });
}
