import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '3', 10); // Default to 3 suggestions

        // Fetch random products from the database
        const productsSql = `
            SELECT 
                p.id, p.name, p.price, p.stock_quantity as "stockQuantity",
                (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_main = TRUE LIMIT 1) as "imageUrl",
                b.name as brand
            FROM products p
            JOIN brands b ON p.brand_id = b.id
            ORDER BY RANDOM()
            LIMIT $1;
        `;
        const { rows: suggestedProducts } = await db.query(productsSql, [limit]);
        
        return NextResponse.json(suggestedProducts);

    } catch (error) {
        console.error("Error fetching suggested products:", error);
        return NextResponse.json({ message: 'Error fetching suggested products.', error: error.message }, { status: 500 });
    }
}
