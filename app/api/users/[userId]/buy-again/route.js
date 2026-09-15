import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

/**
 * @swagger
 * /api/users/{userId}/buy-again:
 *   get:
 *     summary: Get products the user has purchased before
 *     description: Fetches a list of unique products from a user's past orders.
 *     responses:
 *       200:
 *         description: A list of products.
 *       500:
 *         description: Server error.
 */
export async function GET(request, { params }) {
    const { userId } = await params;

    // Middleware only checks that someone is signed in — without this, any
    // customer could read another customer's purchase history.
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || String(session.user.id) !== String(userId)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        // One row per product, most recently ordered first, active products only
        // (a deactivated product would otherwise link to a dead product page).
        const { rows } = await db.query(
            `SELECT
                p.id,
                p.name,
                p.price,
                p.stock_quantity AS "stockQuantity",
                (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_main = TRUE LIMIT 1) AS "imageUrl",
                b.name AS brand,
                MAX(o.created_at) AS "lastOrderedAt"
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            JOIN products p ON p.id = oi.product_id
            LEFT JOIN brands b ON b.id = p.brand_id
            WHERE o.user_id = $1 AND p.is_active = true
            GROUP BY p.id, b.name
            ORDER BY "lastOrderedAt" DESC
            LIMIT 20`,
            [userId]
        );

        return NextResponse.json(rows);
    } catch (error) {
        console.error(`Error fetching buy again items for user ${userId}:`, error);
        return NextResponse.json({ message: 'Error fetching past purchases.', error: error.message }, { status: 500 });
    }
}
