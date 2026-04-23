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
            WHERE p.is_active = true AND (p.status = 'active' OR p.status IS NULL)
            ORDER BY RANDOM()
            LIMIT $1;
        `;
        let suggestedProducts;
        try {
            const result = await db.query(productsSql, [limit]);
            suggestedProducts = result.rows;
        } catch (dbError) {
            if (dbError.message.includes('is_active')) {
                const fallbackSql = productsSql.replace('p.is_active = true AND ', '');
                const result = await db.query(fallbackSql, [limit]);
                suggestedProducts = result.rows;
            } else {
                throw dbError;
            }
        }
        
        return NextResponse.json(suggestedProducts);

    } catch (error) {
        console.error("Error fetching suggested products:", error);
        return NextResponse.json({ message: 'Error fetching suggested products.', error: error.message }, { status: 500 });
    }
}
