import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     description: Retrieves a list of all products with filtering, sorting, and pagination.
 *     parameters:
 *       - in: query
 *         name: random
 *         schema:
 *           type: boolean
 *         description: Whether to return products in random order.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: The maximum number of products to return.
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: The name of a category to filter by.
 *     responses:
 *       200:
 *         description: A list of products.
 *       500:
 *         description: Server error.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const random = searchParams.get('random');
  const limit = searchParams.get('limit');
  const category = searchParams.get('category');
  const isNew = searchParams.get('isNew');

  try {
    let sql = `
      SELECT
        p.id, p.name, p.description, p.price, p.stock_quantity, p.status, p.product_type, p.vendor, p.long_description, p.benefits, p.how_to_use, p.specs, p.autoship_save, p.gtin, p.product_dimensions, p.item_weight, p.item_model_number, p.unit_count, p.brand_id, pi.created_at,
        b.name as "brandName",
        pi.image_url as "imageUrl"
      FROM
        products p
      LEFT JOIN
        brands b ON p.brand_id = b.id
      LEFT JOIN
        product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
    `;
    const params = [];
    let whereClauses = [];

    if (category) {
      sql += `
        JOIN category_products cp ON p.id = cp.product_id
        JOIN categories c ON cp.category_id = c.id
      `;
      whereClauses.push(`c.name = $${params.length + 1}`);
      params.push(category);
    }

    if (whereClauses.length > 0) {
      sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    sql += ` GROUP BY p.id, b.name, pi.image_url, pi.created_at`;

    if (isNew === 'true') {
      sql += ` ORDER BY pi.created_at DESC`;
    } else if (random === 'true') {
      sql += ` ORDER BY RANDOM()`;
    }

    if (limit) {
      sql += ` LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));
    }

    const { rows } = await db.query(sql, params.length > 0 ? params : undefined);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ message: 'Error fetching products from database', error: error }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Add a new product
 *     description: Creates a new product, links categories, and uploads images.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               // Add all product fields here
 *               mainImage: { type: 'string', format: 'binary' }
 *               additionalImages: { type: 'array', items: { type: 'string', format: 'binary' } }
 *     responses:
 *       201:
 *         description: Product added successfully.
 *       400:
 *         description: Bad request.
 *       500:
 *         description: Server error.
 */
export async function POST(request) {
  const client = await db.connect();
  try {
    const formData = await request.formData();
    const { name, description, price, stock_quantity, status, product_type, long_description, benefits, how_to_use, specs, autoship_save, gtin, product_dimensions, item_weight, item_model_number, unit_count, brand_id, categoryIds: categoryIdsString } = Object.fromEntries(formData.entries());

    if (!name || !price || !stock_quantity || !categoryIdsString) {
      return NextResponse.json({ message: 'Missing required fields (name, price, stock_quantity, categoryIds).' }, { status: 400 });
    }

    await client.query('BEGIN');

    let vendorName = null;
    if (brand_id) {
      const { rows: brandRows } = await client.query('SELECT name FROM brands WHERE id = $1', [brand_id]);
      if (brandRows.length > 0) vendorName = brandRows[0].name;
    }

    const productSql = `
      INSERT INTO products (name, description, price, stock_quantity, status, product_type, vendor, long_description, benefits, how_to_use, specs, autoship_save, gtin, product_dimensions, item_weight, item_model_number, unit_count, brand_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING id;
    `;
    const productValues = [name, description, price, stock_quantity, status, product_type, vendorName, long_description, benefits, how_to_use, specs, autoship_save, gtin, product_dimensions, item_weight, item_model_number, unit_count, brand_id];
    const { rows: productRows } = await client.query(productSql, productValues);
    const productId = productRows[0].id;

    const categoryIds = categoryIdsString.split(',').map(id => parseInt(id.trim()));
    if (categoryIds.length > 0) {
      const categoryProductValues = categoryIds.map(catId => `(${catId}, ${productId})`).join(',');
      await client.query(`INSERT INTO category_products (category_id, product_id) VALUES ${categoryProductValues}`);
    }

    // Handle image uploads
    const mainImageFile = formData.get('mainImage');
    if (mainImageFile && mainImageFile.size > 0) {
      const imageBuffer = Buffer.from(await mainImageFile.arrayBuffer());
      const uploadResult = await uploadImageToCloudinary(imageBuffer);
      await client.query('INSERT INTO product_images (product_id, image_url, is_main) VALUES ($1, $2, TRUE)', [productId, uploadResult.secure_url]);
    }

    const additionalImageFiles = formData.getAll('additionalImages');
    for (const imageFile of additionalImageFiles) {
      if (imageFile && imageFile.size > 0) {
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        const uploadResult = await uploadImageToCloudinary(imageBuffer);
        await client.query('INSERT INTO product_images (product_id, image_url, is_main) VALUES ($1, $2, FALSE)', [productId, uploadResult.secure_url]);
      }
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Product added successfully', productId }, { status: 201 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding product:', error);
    return NextResponse.json({ message: 'Error adding product to database', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
