import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
    }

    try {
        const sql = `
            SELECT
                w.product_id as "productId",
                p.name,
                p.description,
                p.price,
                p.stock_quantity as "stockQuantity",
                b.name as "brandName",
                pi.image_url as "imageUrl"
            FROM wishlists w
            JOIN products p ON w.product_id = p.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
            WHERE w.user_id = $1
            ORDER BY w.added_at DESC;
        `;
        const { rows } = await db.query(sql, [userId]);
        
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        return NextResponse.json({ message: 'Error fetching wishlist from database.', error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { userId, productId } = await request.json();

        if (!userId || !productId) {
            return NextResponse.json({ message: 'User ID and Product ID are required.' }, { status: 400 });
        }

        const sql = 'INSERT INTO wishlists (user_id, product_id) VALUES ($1, $2) RETURNING user_id, product_id';
        const { rows } = await db.query(sql, [userId, productId]);

        return NextResponse.json({ message: 'Product added to wishlist', wishlist: rows[0] }, { status: 201 });

    } catch (error) {
        console.error('Error adding to wishlist:', error);
        // Handle unique constraint violation if product is already in wishlist
        if (error.code === '23505') {
            return NextResponse.json({ message: 'Product already in wishlist.' }, { status: 409 });
        }
        return NextResponse.json({ message: 'Error adding product to wishlist.', error: error.message }, { status: 500 });
    }
}
