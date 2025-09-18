import { NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   put:
 *     summary: Cancel an order
 *     description: Marks an order's status as 'cancelled'.
 *     responses:
 *       200:
 *         description: Order cancelled successfully.
 *       404:
 *         description: Order not found.
 *       500:
 *         description: Server error.
 */
export async function PUT(request, { params }) {
    const { id } = params;
    try {
        const sql = 'UPDATE orders SET order_status = $1, updated_at = NOW() WHERE id = $2 RETURNING id';
        const { rowCount } = await db.query(sql, ['cancelled', id]);

        if (rowCount === 0) {
            return NextResponse.json({ message: 'Order not found or already cancelled' }, { status: 404 });
        }

        return NextResponse.json({ message: `Order ${id} cancelled successfully.` });

    } catch (error) {
        console.error(`Error cancelling order ${id}:`, error);
        return NextResponse.json({ message: 'Failed to cancel order.', error: error.message }, { status: 500 });
    }
}
