import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadImageToCloudinary, cloudinary } from '@/lib/cloudinary';

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a single product by ID
 *     responses:
 *       200:
 *         description: A single product with images and category IDs.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Server error.
 */
export async function GET(request, { params }) {
  const { id } = params;
  try {
    const productSql = `
      SELECT p.*, b.name as "brandName"
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = $1
    `;
    const { rows: productRows } = await db.query(productSql, [id]);

    if (productRows.length === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    const product = productRows[0];

    const imagesSql = 'SELECT id, image_url as "imageUrl", is_main as "isMain" FROM product_images WHERE product_id = $1';
    const { rows: imageRows } = await db.query(imagesSql, [id]);
    product.images = imageRows;

    const categoriesSql = 'SELECT category_id FROM category_products WHERE product_id = $1';
    const { rows: categoryRows } = await db.query(categoriesSql, [id]);
    product.categoryIds = categoryRows.map(row => row.category_id);

    return NextResponse.json(product);

  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return NextResponse.json({ message: 'Error fetching product from database' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update an existing product
 *     responses:
 *       200:
 *         description: Product updated successfully.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Server error.
 */
export async function PUT(request, { params }) {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    const client = await db.connect();
    try {
        const formData = await request.formData();
        const { name, description, status, product_type, long_description, benefits, how_to_use, specs, gtin, product_dimensions, item_model_number, categoryIds: categoryIdsString } = Object.fromEntries(formData.entries());

        const price = parseFloat(formData.get('price')) || null;
        const stock_quantity = parseInt(formData.get('stock_quantity')) || null;
        const autoship_save = parseFloat(formData.get('autoship_save')) || null;
        const item_weight = parseFloat(formData.get('item_weight')) || null;
        const unit_count = parseInt(formData.get('unit_count')) || null;
        const brand_id = parseInt(formData.get('brand_id')) || null;

        await client.query('BEGIN');

        let vendorName = null;
        if (brand_id) {
            const { rows: brandRows } = await client.query('SELECT name FROM brands WHERE id = $1', [brand_id]);
            if (brandRows.length > 0) vendorName = brandRows[0].name;
        }

        const productSql = `
            UPDATE products
            SET name = $1, description = $2, price = $3, stock_quantity = $4, status = $5, product_type = $6, vendor = $7, long_description = $8, benefits = $9, how_to_use = $10, specs = $11, autoship_save = $12, gtin = $13, product_dimensions = $14, item_weight = $15, item_model_number = $16, unit_count = $17, brand_id = $18
            WHERE id = $19 RETURNING id;
        `;
        const productValues = [name, description, price, stock_quantity, status, product_type, vendorName, long_description, benefits, how_to_use, specs, autoship_save, gtin, product_dimensions, item_weight, item_model_number, unit_count, brand_id, id];
        const { rowCount } = await client.query(productSql, productValues);

        if (rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }

        // WARNING: This is a simple but destructive way to handle image updates.
        // It deletes all old images and uploads the new ones.
        const { rows: existingImages } = await client.query('SELECT image_url FROM product_images WHERE product_id = $1', [id]);
        for (const image of existingImages) {
            const publicId = image.image_url.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }
        await client.query('DELETE FROM product_images WHERE product_id = $1', [id]);

        const mainImageFile = formData.get('mainImage');
        if (mainImageFile && mainImageFile.size > 0) {
            const imageBuffer = Buffer.from(await mainImageFile.arrayBuffer());
            const uploadResult = await uploadImageToCloudinary(imageBuffer);
            await client.query('INSERT INTO product_images (product_id, image_url, is_main) VALUES ($1, $2, TRUE)', [id, uploadResult.secure_url]);
        }

        const additionalImageFiles = formData.getAll('additionalImages');
        for (const imageFile of additionalImageFiles) {
            if (imageFile && imageFile.size > 0) {
                const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
                const uploadResult = await uploadImageToCloudinary(imageBuffer);
                await client.query('INSERT INTO product_images (product_id, image_url, is_main) VALUES ($1, $2, FALSE)', [id, uploadResult.secure_url]);
            }
        }

        await client.query('DELETE FROM category_products WHERE product_id = $1', [id]);
        if (categoryIdsString) {
            const categoryIds = categoryIdsString.split(',').map(catId => parseInt(catId.trim()));
            if (categoryIds.length > 0) {
                const categoryProductValues = categoryIds.map(catId => `(${catId}, ${id})`).join(',');
                await client.query(`INSERT INTO category_products (category_id, product_id) VALUES ${categoryProductValues}`);
            }
        }

        await client.query('COMMIT');
        return NextResponse.json({ message: 'Product updated successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error updating product ${id}:`, error);
        return NextResponse.json({ message: 'Error updating product', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     responses:
 *       200:
 *         description: Product deleted successfully.
 *       404:
 *         description: Product not found.
 *       500:
 *         description: Server error.
 */
export async function DELETE(request, { params }) {
    const { id } = params;
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const { rows: images } = await client.query('SELECT image_url FROM product_images WHERE product_id = $1', [id]);
        
        // Delete images from Cloudinary
        for (const image of images) {
            const publicId = image.image_url.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }

        // Delete from db (product_images and category_products will be cascaded)
        const { rowCount } = await client.query('DELETE FROM products WHERE id = $1', [id]);

        if (rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }

        await client.query('COMMIT');
        return NextResponse.json({ message: 'Product and associated images deleted successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error deleting product ${id}:`, error);
        return NextResponse.json({ message: 'Error deleting product', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
