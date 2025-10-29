import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function DELETE(request, { params }) {
    const { userId, productId } = params;

    try {
        if (!userId || !productId) {
            return NextResponse.json({ message: 'User ID and Product ID are required.' }, { status: 400 });
        }

        const sql = 'DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2 RETURNING user_id, product_id';
        const { rows } = await db.query(sql, [userId, productId]);

        if (rows.length === 0) {
            return NextResponse.json({ message: 'Product not found in wishlist.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Product removed from wishlist', wishlist: rows[0] }, { status: 200 });

    } catch (error) {
        console.error('Error removing from wishlist:', error);
        return NextResponse.json({ message: 'Error removing product from wishlist.', error: error.message }, { status: 500 });
    }
}
