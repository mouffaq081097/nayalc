import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { Buffer } from 'buffer'; // Import Buffer for converting File to Buffer

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
                p.id, p.name, p.description, p.price, b.name as "brand", p.stock_quantity,
                p.long_description, p.benefits, p.how_to_use, p.ingredients, p.comparedprice,
                COALESCE(AVG(r.rating), 0)::numeric(10,1) as "averageRating",
                COUNT(r.id) as "reviewCount"
            FROM products p
            LEFT JOIN reviews r ON p.id = r.product_id
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE p.id = $1
            GROUP BY p.id, p.name, p.description, p.price, p.vendor, p.stock_quantity,
                     p.long_description, p.benefits, p.how_to_use, p.ingredients, p.comparedprice, b.name;
        `;
        const { rows: productRows } = await client.query(productSql, [id]);

        if (productRows.length === 0) {
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }

        const product = productRows[0];
        product.stock_quantity = parseInt(product.stock_quantity, 10);
        product.price = parseFloat(product.price);
        product.comparedprice = parseFloat(product.comparedprice);

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
export async function PUT(request, context) {
    const resolvedParams = await context.params;
    const { id } = resolvedParams;
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const formData = await request.formData();
        const name = formData.get('name');
        const description = formData.get('description');
        const price = parseFloat(formData.get('price')) || 0;
        const stock_quantity = parseInt(formData.get('stock_quantity'), 10) || 0;
        const categoryIds = formData.getAll('categoryIds')
            .map(Number)
            .filter(id => !isNaN(id)); // Filter out invalid category IDs

        const brand_idRaw = parseInt(formData.get('brand_id'), 10);
        const brand_id = isNaN(brand_idRaw) ? null : brand_idRaw;

        const comparedpriceRaw = parseFloat(formData.get('comparedprice'));
        const comparedprice = isNaN(comparedpriceRaw) ? null : comparedpriceRaw;

        const ingredients = formData.get('ingredients');
        const long_description = formData.get('long_description');
        const benefits = formData.get('benefits');
        const how_to_use = formData.get('how_to_use');
        const status = formData.get('status');
        const mainImageFile = formData.get('mainImage'); // This will be a File object if uploaded
        const existingImageUrl = formData.get('imageUrl'); // Existing image URL if no new file


        let imageUrl = existingImageUrl; // Start with existing image URL
        if (mainImageFile && mainImageFile.size > 0) { // Check if a new image file is provided
            const imageBuffer = Buffer.from(await mainImageFile.arrayBuffer());
            const uploadResult = await uploadImageToCloudinary(imageBuffer);
            imageUrl = uploadResult.secure_url;
            // TODO: Potentially delete old image from Cloudinary if desired
        }

        // 1. Update products table
        const updateProductSql = "UPDATE products SET name = $1, description = $2, price = $3, stock_quantity = $4, brand_id = $5, comparedprice = $6, ingredients = $7, long_description = $8, benefits = $9, how_to_use = $10, status = $11 WHERE id = $12 RETURNING id;";
        const updateProductValues = [
            name, description, price, stock_quantity, brand_id, comparedprice,
            ingredients, long_description, benefits, how_to_use, status, id
        ];
        const { rowCount } = await client.query(updateProductSql, updateProductValues);

        if (rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }

        // 2. Update product_images table (for main image)
        if (imageUrl) {
            // Delete old main image entry for this product
            await client.query("DELETE FROM product_images WHERE product_id = $1 AND is_main = TRUE", [id]);
            // Insert new main image entry
            await client.query(
                "INSERT INTO product_images (product_id, image_url, is_main, display_order) VALUES ($1, $2, TRUE, 0)",
                [id, imageUrl]
            );
        }

        // 3. Update category_products table
        await client.query("DELETE FROM category_products WHERE product_id = $1", [id]);
        if (categoryIds && categoryIds.length > 0) {
            const categoryProductValues = categoryIds.map(catId => `(${id}, ${catId})`).join(',');
            await client.query(`INSERT INTO category_products (product_id, category_id) VALUES ${categoryProductValues}`);
        }

        await client.query('COMMIT');
        return NextResponse.json({ message: 'Product updated successfully' }, { status: 200 });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error updating product ${id}:`, error);
        return NextResponse.json({ message: 'Error updating product', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
export async function DELETE(request, { params }) {
    const { id } = params;
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Delete from product_images
        await client.query('DELETE FROM product_images WHERE product_id = $1', [id]);

        // Delete from category_products
        await client.query('DELETE FROM category_products WHERE product_id = $1', [id]);

        // Delete from products
        const deleteProductResult = await client.query('DELETE FROM products WHERE id = $1', [id]);

        if (deleteProductResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }

        await client.query('COMMIT');
        return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error deleting product ${id}:`, error);
        return NextResponse.json({ message: 'Error deleting product', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}