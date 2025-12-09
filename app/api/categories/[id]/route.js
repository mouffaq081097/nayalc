import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get a single category by ID with its products
 *     responses:
 *       200:
 *         description: A single category with a list of associated products.
 *       404:
 *         description: Category not found.
 *       500:
 *         description: Server error.
 */
export async function GET(request, { params }) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;
  try {
    const categorySql = 'SELECT id, name, image_url as "imageUrl" FROM categories WHERE id = $1';
    const { rows: categoryRows } = await db.query(categorySql, [id]);

    if (categoryRows.length === 0) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }
    const category = categoryRows[0];

        const productsSql = `
          SELECT
            p.id,
            p.name,
            p.description,
            p.price,
            b.name as "brandName",
            pi.image_url as "imageUrl",
            COALESCE(AVG(r.rating), 0)::numeric(10,1) as "averageRating",
            COUNT(r.id) as "reviewCount"
          FROM products p
          JOIN category_products cp ON p.id = cp.product_id
          JOIN brands b ON p.brand_id = b.id
          LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
          LEFT JOIN reviews r ON p.id = r.product_id
          WHERE cp.category_id = $1
          GROUP BY p.id, p.name, p.description, p.price, b.name, pi.image_url
        `;
        const { rows: productRows } = await db.query(productsSql, [id]);    
    category.products = productRows;

    return NextResponse.json(category);

  } catch (error) {
    console.error(`Error fetching category ${id}:`, error);
    return NextResponse.json({ message: 'Error fetching category from database' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update an existing category
 *     responses:
 *       200:
 *         description: Category updated successfully.
 *       400:
 *         description: Bad request.
 *       404:
 *         description: Category not found.
 *       500:
 *         description: Server error.
 */
export async function PUT(request, { params }) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;
  const client = await db.connect();
  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const description = formData.get('description');
    const productIdsString = formData.get('product_ids');
    const imageFile = formData.get('image');
    const image_url = formData.get('image_url'); // To handle image removal

    if (!name) {
      return NextResponse.json({ message: 'Category name is required.' }, { status: 400 });
    }

    await client.query('BEGIN');

    const { rows: existingRows } = await client.query('SELECT image_url FROM categories WHERE id = $1', [id]);
    if (existingRows.length === 0) {
        return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    let newImageUrl = existingRows[0].image_url;
    if (imageFile && imageFile.size > 0) {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadResult = await uploadImageToCloudinary(imageBuffer);
      newImageUrl = uploadResult.secure_url;
    } else if (image_url === 'null') {
      // Client can send 'null' string to indicate image removal
      newImageUrl = null;
    }

    const updateCategorySql = 'UPDATE categories SET name = $1, description = $2, image_url = $3 WHERE id = $4';
    await client.query(updateCategorySql, [name, description, newImageUrl, id]);

    // Update product associations
    await client.query('DELETE FROM category_products WHERE category_id = $1', [id]);
    if (productIdsString) {
      const product_ids = productIdsString.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id) && id > 0);
      if (product_ids.length > 0) {
        const values = [id]; // The category ID is param $1
        const placeholders = product_ids.map((productId, index) => {
            values.push(productId);
            return `($1, $${index + 2})`;
        }).join(',');
        
        const categoryProductsSql = `INSERT INTO category_products (category_id, product_id) VALUES ${placeholders}`;
        await client.query(categoryProductsSql, values);
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({ message: 'Category updated successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error updating category ${id}:`, error);
    return NextResponse.json({ message: 'Error updating category in database', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     responses:
 *       200:
 *         description: Category deleted successfully.
 *       404:
 *         description: Category not found.
 *       500:
 *         description: Server error.
 */
export async function DELETE(request, { params }) {
  const { id } = params;
  try {
    // The ON DELETE CASCADE constraint on the category_products table will handle deleting associations.
    const sql = 'DELETE FROM categories WHERE id = $1 RETURNING id';
    const { rowCount } = await db.query(sql, [id]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(`Error deleting category ${id}:`, error);
    return NextResponse.json({ message: 'Error deleting category from database', error: error.message }, { status: 500 });
  }
}