import { NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * @swagger
 * /api/orders/{id}/schedule-collection:
 *   put:
 *     summary: Schedule an order for collection
 *     description: Updates an order's status to 'scheduled' and sets the collection date.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shipping_scheduled_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Order scheduled successfully.
 *       400:
 *         description: Bad request, date is missing.
 *       404:
 *         description: Order not found.
 *       500:
 *         description: Server error.
 */
export async function PUT(request, { params }) {
    const { id } = params;
    try {
        const { shipping_scheduled_date } = await request.json();

        if (!shipping_scheduled_date) {
            return NextResponse.json({ message: 'shipping_scheduled_date is required.' }, { status: 400 });
        }

        const sql = 'UPDATE orders SET order_status = $1, shipping_scheduled_date = $2, updated_at = NOW() WHERE id = $3 RETURNING id';
        const { rowCount } = await db.query(sql, ['scheduled', shipping_scheduled_date, id]);

        if (rowCount === 0) {
            return NextResponse.json({ message: 'Order not found or already scheduled' }, { status: 404 });
        }

        return NextResponse.json({ message: `Order ${id} scheduled for collection successfully.` });

    } catch (error) {
        console.error(`Error scheduling collection for order ${id}:`, error);
        return NextResponse.json({ message: 'Failed to schedule collection for order.', error: error.message }, { status: 500 });
    }
}
