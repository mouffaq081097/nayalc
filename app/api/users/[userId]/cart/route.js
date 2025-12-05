import { NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * @swagger
 * /api/users/{userId}/cart:
 *   get:
 *     summary: Get user's cart
 *     description: Retrieves all items in a user's shopping cart.
 *     responses:
 *       200:
 *         description: The user's cart.
 *       500:
 *         description: Server error.
 */
export async function GET(request, context) {
    const params = await context.params; // Explicitly await params
    const userId = params.userId;

    try {
        const sql = "SELECT p.id as \"productId\", uc.quantity, p.name, p.price, p.description, p.vendor as \"brand\", p.stock_quantity as \"stock_quantity\", (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_main = TRUE LIMIT 1) as \"imageUrl\" FROM user_carts uc JOIN products p ON uc.product_id = p.id WHERE uc.user_id = $1;";

        const { rows } = await db.query(sql, [userId]);
        
        return NextResponse.json({ cart: rows });

    } catch (error) {
        console.error(`Error fetching cart for user ${userId}:`, error);
        return NextResponse.json({ message: 'Failed to fetch user cart.', error: error.message }, { status: 500 });
    }
}

/**
 * @swagger
 * /api/users/{userId}/cart:
 *   put:
 *     summary: Update (replace) user's cart
 *     description: Deletes all items from a user's cart and replaces them with a new set of items.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cart:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId: { type: 'integer' }
 *                     quantity: { type: 'integer' }
 *     responses:
 *       200:
 *         description: Cart updated successfully.
 *       400:
 *         description: Bad request, cart data must be an array.
 *       500:
 *         description: Server error.
 */
export async function PUT(request, context) {
    const params = await context.params;
    const { userId } = params;
    const userIdInt = parseInt(userId, 10);
    const client = await db.connect();
    try {
        const { cart } = await request.json();

        if (!Array.isArray(cart)) {
            return NextResponse.json({ message: 'Cart data must be an array.' }, { status: 400 });
        }

        await client.query('BEGIN');

        const deleteResult = await client.query('DELETE FROM user_carts WHERE user_id = $1', [userIdInt]);
        

        if (cart.length > 0) {
            for (const item of cart) {
                const productIdInt = parseInt(item.id, 10);
                const insertSql = `INSERT INTO user_carts (user_id, product_id, quantity) VALUES ($1, $2, $3);`;
                await client.query(insertSql, [userIdInt, productIdInt, item.quantity]);
            }
        }

        await client.query('COMMIT');
        return NextResponse.json({ message: 'Cart updated successfully' }, { status: 200 });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving cart:', error); // Log the full error object
        console.error('Error details:', error);
        return NextResponse.json({ message: 'Failed to update cart.', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
