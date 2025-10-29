import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories with product counts
 *     description: Retrieves a list of all categories along with the count of products in each.
 *     responses:
 *       200:
 *         description: A list of categories.
 *       500:
 *         description: Server error.
 */
export async function GET() {
  try {
    const sql = `
      SELECT c.id, c.name, c.image_url as "imageUrl", COUNT(cp.product_id) as "productsCount"
      FROM categories c
      LEFT JOIN category_products cp ON c.id = cp.category_id
      GROUP BY c.id, c.name, c.image_url
      ORDER BY c.name ASC
    `;
    const { rows } = await db.query(sql);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ message: 'Error fetching categories from database' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Add a new category
 *     description: Creates a new category, links it to products, and uploads an image.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               product_ids:
 *                 type: string
 *                 description: A comma-separated string of product IDs.
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Category added successfully.
 *       400:
 *         description: Bad request.
 *       500:
 *         description: Server error.
 */
export async function POST(request) {
  const client = await db.connect();
  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const description = formData.get('description');
    const productIdsString = formData.get('product_ids');
    const imageFile = formData.get('image');

    if (!name) {
      return NextResponse.json({ message: 'Category name is required.' }, { status: 400 });
    }

    await client.query('BEGIN');

    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadResult = await uploadImageToCloudinary(imageBuffer);
      imageUrl = uploadResult.secure_url;
    }

    const categorySql = 'INSERT INTO categories (name, description, image_url) VALUES ($1, $2, $3) RETURNING id';
    const { rows: categoryRows } = await client.query(categorySql, [name, description, imageUrl]);
    const newCategoryId = categoryRows[0].id;

    if (productIdsString) {
      const product_ids = productIdsString.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id) && id > 0);
      if (product_ids.length > 0) {
        const values = [newCategoryId];
        const placeholders = product_ids.map((id, index) => {
            values.push(id);
            return `($1, $${index + 2})`;
        }).join(',');
        
        const categoryProductsSql = `INSERT INTO category_products (category_id, product_id) VALUES ${placeholders}`;
        await client.query(categoryProductsSql, values);
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({ message: 'Category added successfully', categoryId: newCategoryId }, { status: 201 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding category:', error);
    return NextResponse.json({ message: 'Error adding category to database', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}