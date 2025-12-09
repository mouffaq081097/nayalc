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
 *   post:
 *     summary: Add an item to the user's cart
 *     description: Adds a new item to the user's cart. If the item already exists, it updates the quantity.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: { type: 'integer' }
 *               quantity: { type: 'integer' }
 *     responses:
 *       201:
 *         description: Item added/updated successfully.
 *       400:
 *         description: Bad request, productId and quantity are required.
 *       500:
 *         description: Server error.
 */
export async function POST(request, context) {
    const params = await context.params;
    const { userId } = params;
    const { productId, quantity } = await request.json();

    if (!productId || !quantity) {
        return NextResponse.json({ message: 'Product ID and quantity are required.' }, { status: 400 });
    }

    try {
        const { rows } = await db.query('SELECT * FROM user_carts WHERE user_id = $1 AND product_id = $2', [userId, productId]);

        if (rows.length > 0) {
            // Update quantity if item exists
            const newQuantity = rows[0].quantity + quantity;
            await db.query('UPDATE user_carts SET quantity = $1 WHERE user_id = $2 AND product_id = $3', [newQuantity, userId, productId]);
        } else {
            // Insert new item if it does not exist
            await db.query('INSERT INTO user_carts (user_id, product_id, quantity) VALUES ($1, $2, $3)', [userId, productId, quantity]);
        }

        return NextResponse.json({ message: 'Item added to cart successfully.' }, { status: 201 });

    } catch (error) {
        console.error(`Error adding item to cart for user ${userId}:`, error);
        return NextResponse.json({ message: 'Failed to add item to cart.', error: error.message }, { status: 500 });
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
        const { cart: incomingCart } = await request.json(); // Rename to avoid confusion
        console.log('Backend received cart for user', userId, ':', incomingCart);

        if (!Array.isArray(incomingCart)) {
            return NextResponse.json({ message: 'Cart data must be an array.' }, { status: 400 });
        }

        await client.query('BEGIN');

        // Get current cart items for the user from the database
        const { rows: currentDbCart } = await client.query('SELECT product_id FROM user_carts WHERE user_id = $1', [userIdInt]);
        const currentDbProductIds = new Set(currentDbCart.map(item => item.product_id));
        const incomingProductIds = new Set(incomingCart.map(item => parseInt(item.id, 10)));

        // 1. Delete items that are in the database but no longer in the incoming cart
        const productIdsToDelete = [...currentDbProductIds].filter(dbProductId => !incomingProductIds.has(dbProductId));
        if (productIdsToDelete.length > 0) {
            await client.query(
                `DELETE FROM user_carts WHERE user_id = $1 AND product_id = ANY($2::int[])`,
                [userIdInt, productIdsToDelete]
            );
        }

        // 2. Insert new items or update quantities of existing items using ON CONFLICT (UPSERT)
        if (incomingCart.length > 0) {
            const upsertPromises = incomingCart.map(item => {
                const productIdInt = parseInt(item.id, 10);
                return client.query(
                    `INSERT INTO user_carts (user_id, product_id, quantity)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (user_id, product_id) DO UPDATE
                     SET quantity = EXCLUDED.quantity;`,
                    [userIdInt, productIdInt, item.quantity]
                );
            });
            await Promise.all(upsertPromises);
        }

        await client.query('COMMIT');
        return NextResponse.json({ message: 'Cart updated successfully' }, { status: 200 });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving cart (UPSERT method):', error);
        console.error('Error details:', error); // Log the full error object
        return NextResponse.json({ message: 'Failed to update cart.', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

/**
 * @swagger
 * /api/users/{userId}/cart:
 *   delete:
 *     summary: Remove an item from the cart or clear the cart
 *     description: Deletes a specific item from the user's cart if a productId is provided, otherwise clears the entire cart.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: { type: 'integer' }
 *     responses:
 *       200:
 *         description: Item(s) removed successfully.
 *       500:
 *         description: Server error.
 */
export async function DELETE(request, context) {
    const params = await context.params;
    const { userId } = params;
    
    try {
        const { productId } = await request.json();

        if (productId) {
            // Delete a specific item
            await db.query('DELETE FROM user_carts WHERE user_id = $1 AND product_id = $2', [userId, productId]);
            return NextResponse.json({ message: 'Item removed from cart successfully.' });
        } else {
            // Clear the entire cart for the user
            await db.query('DELETE FROM user_carts WHERE user_id = $1', [userId]);
            return NextResponse.json({ message: 'Cart cleared successfully.' });
        }
    } catch (error) {
        // If request body is empty, clear the cart
        if (error instanceof SyntaxError) {
             await db.query('DELETE FROM user_carts WHERE user_id = $1', [userId]);
            return NextResponse.json({ message: 'Cart cleared successfully.' });
        }
        console.error(`Error removing item(s) from cart for user ${userId}:`, error);
        return NextResponse.json({ message: 'Failed to remove item(s) from cart.', error: error.message }, { status: 500 });
    }
}
