import { NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * @swagger
 * /api/orders/{id}/fulfill:
 *   put:
 *     summary: Fulfill an order
 *     description: Marks an order's status as 'fulfilled'.
 *     responses:
 *       200:
 *         description: Order fulfilled successfully.
 *       404:
 *         description: Order not found.
 *       500:
 *         description: Server error.
 */
export async function PUT(request, { params }) {
    const { id } = params;
    try {
        const sql = 'UPDATE orders SET order_status = $1, updated_at = NOW() WHERE id = $2 RETURNING id';
        const { rowCount } = await db.query(sql, ['fulfilled', id]);

        if (rowCount === 0) {
            return NextResponse.json({ message: 'Order not found or already fulfilled' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Order fulfilled successfully' });

    } catch (error) {
        console.error(`Error fulfilling order ${id}:`, error);
        return NextResponse.json({ message: 'Error fulfilling order in database', error: error.message }, { status: 500 });
    }
}
