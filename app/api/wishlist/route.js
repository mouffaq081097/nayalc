import { NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     description: Retrieves all items in a user's wishlist.
 *     responses:
 *       200:
 *         description: The user's wishlist.
 *       500:
 *         description: Server error.
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
    }

    try {
        const sql = `
            SELECT 
                p.id as "productId", 
                p.name, 
                p.price, 
                p.description, 
                p.vendor as "brand", 
                p.stock_quantity as "stockQuantity",
                (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_main = TRUE LIMIT 1) as "imageUrl" 
            FROM user_wishlists uw 
            JOIN products p ON uw.product_id = p.id 
            WHERE uw.user_id = $1;
        `;
        const { rows } = await db.query(sql, [userId]);
        
        return NextResponse.json({ wishlist: rows });

    } catch (error) {
        console.error(`Error fetching wishlist for user ${userId}:`, error);
        return NextResponse.json({ message: 'Failed to fetch user wishlist.', error: error.message }, { status: 500 });
    }
}

/**
 * @swagger
 * /api/wishlist:
 *   post:
 *     summary: Add an item to the user's wishlist
 *     description: Adds a product to the user's wishlist.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: 'integer' }
 *               productId: { type: 'integer' }
 *     responses:
 *       201:
 *         description: Item added to wishlist successfully.
 *       400:
 *         description: Bad request, userId and productId are required.
 *       409:
 *         description: Item already in wishlist.
 *       500:
 *         description: Server error.
 */
export async function POST(request) {
    const { userId, productId } = await request.json();

    if (!userId || !productId) {
        return NextResponse.json({ message: 'User ID and Product ID are required.' }, { status: 400 });
    }

    try {
        const { rows } = await db.query('SELECT * FROM user_wishlists WHERE user_id = $1 AND product_id = $2', [userId, productId]);

        if (rows.length > 0) {
            return NextResponse.json({ message: 'Item already in wishlist.' }, { status: 409 });
        }

        await db.query('INSERT INTO user_wishlists (user_id, product_id) VALUES ($1, $2)', [userId, productId]);
        return NextResponse.json({ message: 'Item added to wishlist successfully.' }, { status: 201 });

    } catch (error) {
        console.error(`Error adding item to wishlist for user ${userId}, product ${productId}:`, error);
        return NextResponse.json({ message: 'Failed to add item to wishlist.', error: error.message }, { status: 500 });
    }
}

/**
 * @swagger
 * /api/wishlist:
 *   delete:
 *     summary: Remove an item from the user's wishlist
 *     description: Removes a product from the user's wishlist.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: 'integer' }
 *               productId: { type: 'integer' }
 *     responses:
 *       200:
 *         description: Item removed from wishlist successfully.
 *       400:
 *         description: Bad request, userId and productId are required.
 *       404:
 *         description: Item not found in wishlist.
 *       500:
 *         description: Server error.
 */
export async function DELETE(request) {
    const { userId, productId } = await request.json();

    if (!userId || !productId) {
        return NextResponse.json({ message: 'User ID and Product ID are required.' }, { status: 400 });
    }

    try {
        const result = await db.query('DELETE FROM user_wishlists WHERE user_id = $1 AND product_id = $2', [userId, productId]);

        if (result.rowCount === 0) {
            return NextResponse.json({ message: 'Item not found in wishlist.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Item removed from wishlist successfully.' });

    } catch (error) {
        console.error(`Error removing item from wishlist for user ${userId}, product ${productId}:`, error);
        return NextResponse.json({ message: 'Failed to remove item from wishlist.', error: error.message }, { status: 500 });
    }
}