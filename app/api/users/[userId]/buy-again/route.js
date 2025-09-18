import { NextResponse } from 'next/server';
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
    const { userId } = params;

    try {
        // Correctly fetch unique product IDs from a user's past orders
        const productIdsSql = `
            SELECT DISTINCT oi.product_id
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.user_id = $1;
        `;
        const { rows: productIdsRows } = await db.query(productIdsSql, [userId]);

        if (productIdsRows.length === 0) {
            return NextResponse.json([]); // No past purchases
        }

        const productIds = productIdsRows.map(row => row.product_id);

        // Fetch details for those unique products
        const productDetailsSql = `
            SELECT 
                p.id, p.name, p.price, p.stock_quantity as "stockQuantity",
                (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_main = TRUE LIMIT 1) as "imageUrl"
            FROM products p
            WHERE p.id = ANY($1::int[])
        `;
        const { rows: buyAgainProducts } = await db.query(productDetailsSql, [productIds]);
        
        return NextResponse.json(buyAgainProducts);

    } catch (error) {
        console.error(`Error fetching buy again items for user ${userId}:`, error);
        return NextResponse.json({ message: 'Error fetching past purchases.', error: error.message }, { status: 500 });
    }
}
