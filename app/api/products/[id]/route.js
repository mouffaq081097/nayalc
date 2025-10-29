import { NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a single product by ID
 *     description: Retrieves a single product by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the product to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The requested product.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Server error.
 */
export async function GET(request, context) {
    const params = await context.params;
    const { id } = params;
    const client = await db.connect();
    try {
        const productSql = `
            SELECT
                id,
                name,
                description,
                price,
                vendor as "brand",
                stock_quantity as "stockQuantity",
                long_description,
                benefits,
                how_to_use,
                ingredients
            FROM products
            WHERE id = $1;
        `;
        const { rows: productRows } = await client.query(productSql, [id]);

        if (productRows.length === 0) {
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }

        const product = productRows[0];

        const imagesSql = `
            SELECT image_url
            FROM product_images
            WHERE product_id = $1
            ORDER BY display_order ASC, id ASC;
        `;
        const { rows: imageRows } = await client.query(imagesSql, [id]);

        product.images = imageRows.map(row => row.image_url);

        return NextResponse.json(product);

    } catch (error) {
        console.error(`Error fetching product ${id}:`, error);
        return NextResponse.json({ message: 'Error fetching product from database', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}