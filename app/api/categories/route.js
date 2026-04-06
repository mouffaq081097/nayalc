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
    // Attempt query with new columns
    const sql = `
      SELECT c.id, c.name, c.slug, c.description, c.image_url as "imageUrl", c.banner_url as "bannerUrl", c.parent_id as "parentId", COUNT(cp.product_id) as "productsCount"
      FROM categories c
      LEFT JOIN category_products cp ON c.id = cp.category_id
      GROUP BY c.id, c.name, c.slug, c.description, c.image_url, c.banner_url, c.parent_id
      ORDER BY c.name ASC
    `;
    const { rows } = await db.query(sql);
    return NextResponse.json(rows);
  } catch (error) {
    // If it fails (likely missing columns), fallback to basic query
    if (error.message.includes('column') || error.message.includes('banner_url')) {
      try {
        const fallbackSql = `
          SELECT c.id, c.name, c.slug, c.image_url as "imageUrl", COUNT(cp.product_id) as "productsCount"
          FROM categories c
          LEFT JOIN category_products cp ON c.id = cp.category_id
          GROUP BY c.id, c.name, c.slug, c.image_url
          ORDER BY c.name ASC
        `;
        const { rows } = await db.query(fallbackSql);
        // Map null values for missing columns so frontend doesn't crash
        return NextResponse.json(rows.map(r => ({ ...r, description: '', bannerUrl: null, parentId: null })));
      } catch (fallbackError) {
        console.error('Fallback fetch error:', fallbackError);
      }
    }
    console.error('Error fetching categories:', error);
    return NextResponse.json({ message: 'Error fetching categories from database' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Add a new category
 *     description: Creates a new category, links it to products, and uploads an image and banner.
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
 *               banner:
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
    const bannerFile = formData.get('banner');
    const parentId = formData.get('parent_id');

    if (!name) {
      return NextResponse.json({ message: 'Category name is required.' }, { status: 400 });
    }

    await client.query('BEGIN');

    // Generate unique slug
    const slugify = (text) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
    let baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;
    while (true) {
        const { rows: existing } = await client.query('SELECT id FROM categories WHERE slug = $1', [slug]);
        if (existing.length === 0) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadResult = await uploadImageToCloudinary(imageBuffer);
      imageUrl = uploadResult.secure_url;
    }

    let bannerUrl = null;
    if (bannerFile && bannerFile.size > 0) {
      const bannerBuffer = Buffer.from(await bannerFile.arrayBuffer());
      const uploadResult = await uploadImageToCloudinary(bannerBuffer);
      bannerUrl = uploadResult.secure_url;
    }

    const categorySql = 'INSERT INTO categories (name, description, image_url, banner_url, slug, parent_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id';
    const { rows: categoryRows } = await client.query(categorySql, [name, description, imageUrl, bannerUrl, slug, parentId ? parseInt(parentId) : null]);
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