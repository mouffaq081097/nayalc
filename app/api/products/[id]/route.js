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
                p.id, p.name, p.description, p.price, b.name as "brand", b.name as "brandName", b.id as "brand_id", b.imageurl as "brandImageUrl", p.stock_quantity,
                p.long_description, p.benefits, p.how_to_use, p.how_to_use_video, p.ingredients, p.comparedprice, p.size, p.form, p.status, p.is_active,
                pi.image_url as "imageUrl",
                pi.alt_text as "altText",
                COALESCE(AVG(r.rating), 0)::numeric(10,1) as "averageRating",
                COUNT(r.id) as "reviewCount"
            FROM products p
            LEFT JOIN reviews r ON p.id = r.product_id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
            WHERE p.id = $1
            GROUP BY p.id, p.name, p.description, p.price, p.vendor, p.stock_quantity,
                     p.long_description, p.benefits, p.how_to_use, p.how_to_use_video, p.ingredients, p.comparedprice, b.name, b.id, b.imageurl, pi.image_url, pi.alt_text, p.size, p.form;
        `;
        let productRows;
        try {
            const result = await client.query(productSql, [id]);
            productRows = result.rows;
        } catch (dbError) {
            console.error('DB error fetching product:', dbError.message);
            // Fallback for missing columns/tables
            let fallbackSql = productSql;
            if (dbError.message.includes('is_active')) {
                fallbackSql = fallbackSql.replace('p.is_active,', 'TRUE as "is_active",');
            }
            const result = await client.query(fallbackSql, [id]);
            productRows = result.rows;
        }

        if (productRows.length === 0) {
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }

        const product = productRows[0];
        product.stock_quantity = product.stock_quantity ? parseInt(product.stock_quantity, 10) : 0;
        product.price = product.price ? parseFloat(product.price) : 0;
        product.comparedprice = product.comparedprice ? parseFloat(product.comparedprice) : null;
        product.averageRating = product.averageRating ? parseFloat(product.averageRating) : 0;

        // Fetch related data in separate queries to avoid complexity/errors in main query
        try {
            const { rows: concernRows } = await client.query('SELECT concern_id FROM product_concerns WHERE product_id = $1', [id]);
            product.concern_ids = concernRows.map(r => r.concern_id);
        } catch (e) { product.concern_ids = []; }

        try {
            const { rows: categoryRows } = await client.query('SELECT category_id FROM category_products WHERE product_id = $1', [id]);
            product.category_ids = categoryRows.map(r => r.category_id);
        } catch (e) { product.category_ids = []; }

        try {
            const { rows: categoryNameRows } = await client.query('SELECT c.name FROM categories c JOIN category_products cp ON c.id = cp.category_id WHERE cp.product_id = $1', [id]);
            product.categoryNames = categoryNameRows.map(r => r.name).join(', ');
        } catch (e) { product.categoryNames = ''; }

        const imagesSql = `
            SELECT image_url, alt_text
            FROM product_images
            WHERE product_id = $1
            ORDER BY display_order ASC, id ASC;
        `;
        const { rows: imageRows } = await client.query(imagesSql, [id]);

        product.images = imageRows.map(row => row.image_url);
        product.imagesData = imageRows.map(row => ({ url: row.image_url, alt: row.alt_text }));
        product.additionalImagesData = imageRows.filter(row => row.image_url !== product.imageUrl).map(row => ({ url: row.image_url, alt: row.alt_text }));

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
        const categoryIds = (formData.get('categoryIds') || '').split(',').map(Number).filter(id => !isNaN(id) && id > 0);
        const concernIds = (formData.get('concernIds') || '').split(',').map(Number).filter(id => !isNaN(id) && id > 0);

        const brand_idRaw = parseInt(formData.get('brand_id'), 10);
        const brand_id = isNaN(brand_idRaw) ? null : brand_idRaw;

        // Fetch brand name to update vendor column
        let vendorName = null;
        if (brand_id) {
            const { rows: brandRows } = await client.query('SELECT name FROM brands WHERE id = $1', [brand_id]);
            if (brandRows.length > 0) vendorName = brandRows[0].name;
        }

        const comparedpriceRaw = parseFloat(formData.get('comparedprice'));
        const comparedprice = isNaN(comparedpriceRaw) ? null : comparedpriceRaw;

        const ingredients = formData.get('ingredients');
        const long_description = formData.get('long_description');
        const benefits = formData.get('benefits');
        const how_to_use = formData.get('how_to_use');
        const how_to_use_video = formData.get('how_to_use_video') || null;
        const size = formData.get('size');
        const form = formData.get('form');
        const status = formData.get('status');
        const mainImageFile = formData.get('mainImage'); // This will be a File object if uploaded
        const mainAltText = formData.get('mainAltText') || '';
        const existingImageUrl = formData.get('imageUrl'); // Existing image URL if no new file


        let imageUrl = existingImageUrl; // Start with existing image URL
        if (mainImageFile && mainImageFile.size > 0) { // Check if a new image file is provided
            const imageBuffer = Buffer.from(await mainImageFile.arrayBuffer());
            const uploadResult = await uploadImageToCloudinary(imageBuffer);
            imageUrl = uploadResult.secure_url;
            // TODO: Potentially delete old image from Cloudinary if desired
        }

        // 1. Update products table
        const updateProductSql = "UPDATE products SET name = $1, description = $2, price = $3, stock_quantity = $4, brand_id = $5, comparedprice = $6, ingredients = $7, long_description = $8, benefits = $9, how_to_use = $10, how_to_use_video = $11, status = $12, size = $13, vendor = $14, form = $15 WHERE id = $16 RETURNING id;";
        const updateProductValues = [
            name, description, price, stock_quantity, brand_id, comparedprice,
            ingredients, long_description, benefits, how_to_use, how_to_use_video, status, size, vendorName, form, id
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
                "INSERT INTO product_images (product_id, image_url, is_main, display_order, alt_text) VALUES ($1, $2, TRUE, 0, $3)",
                [id, imageUrl, mainAltText]
            );
        }

        // 2.5 Update additional images
        const existingAdditionalImages = formData.getAll('existingAdditionalImages');
        const existingAdditionalAlts = formData.getAll('existingAdditionalAlts');
        
        // Delete all non-main images that are not in the list of existing images to keep
        if (existingAdditionalImages.length > 0) {
            await client.query(
                "DELETE FROM product_images WHERE product_id = $1 AND is_main = FALSE AND image_url NOT IN (" + 
                existingAdditionalImages.map((_, i) => `$${i + 2}`).join(',') + ")",
                [id, ...existingAdditionalImages]
            );
            
            // Update alt text for the images we kept
            for (let i = 0; i < existingAdditionalImages.length; i++) {
                await client.query(
                    "UPDATE product_images SET alt_text = $1 WHERE product_id = $2 AND image_url = $3",
                    [existingAdditionalAlts[i] || '', id, existingAdditionalImages[i]]
                );
            }
        } else {
            await client.query("DELETE FROM product_images WHERE product_id = $1 AND is_main = FALSE", [id]);
        }

        // Upload and insert new additional images
        const additionalImageFiles = formData.getAll('additionalImages');
        const additionalAlts = formData.getAll('additionalAlts');
        for (let i = 0; i < additionalImageFiles.length; i++) {
            const imageFile = additionalImageFiles[i];
            const altText = additionalAlts[i] || '';
            if (imageFile && imageFile.size > 0) {
                const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
                const uploadResult = await uploadImageToCloudinary(imageBuffer);
                await client.query(
                    'INSERT INTO product_images (product_id, image_url, is_main, alt_text) VALUES ($1, $2, FALSE, $3)',
                    [id, uploadResult.secure_url, altText]
                );
            }
        }

        // 3. Update category_products table
        await client.query("DELETE FROM category_products WHERE product_id = $1", [id]);
        if (categoryIds && categoryIds.length > 0) {
            const categoryProductValues = categoryIds.map(catId => `(${id}, ${catId})`).join(',');
            await client.query(`INSERT INTO category_products (product_id, category_id) VALUES ${categoryProductValues}`);
        }

        // 4. Update product_concerns table
        try {
            await client.query("DELETE FROM product_concerns WHERE product_id = $1", [id]);
            if (concernIds && concernIds.length > 0) {
                const concernProductValues = concernIds.map(conId => `(${id}, ${conId})`).join(',');
                await client.query(`INSERT INTO product_concerns (product_id, concern_id) VALUES ${concernProductValues}`);
            }
        } catch (e) {
            console.warn('Could not update product concerns, table might be missing.');
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
export async function PATCH(request, context) {
    const params = await context.params;
    const { id } = params;
    try {
        const { is_active } = await request.json();
        try {
            const { rowCount } = await db.query(
                'UPDATE products SET is_active = $1 WHERE id = $2',
                [is_active, id]
            );
            if (rowCount === 0) return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        } catch (dbErr) {
            if (dbErr.message.includes('is_active')) {
                return NextResponse.json({ message: 'is_active column missing in database' }, { status: 400 });
            }
            throw dbErr;
        }
        return NextResponse.json({ message: 'Product status updated', is_active });
    } catch (error) {
        console.error(`Error toggling product ${id}:`, error);
        return NextResponse.json({ message: 'Error updating product status', error: error.message }, { status: 500 });
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