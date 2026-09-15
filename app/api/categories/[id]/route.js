import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { requireAdmin } from '@/lib/adminAuth';

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
  const idOrSlug = resolvedParams.id;
  // The admin editor needs every product in the category, including hidden ones and ones without a brand
  const isAdmin = new URL(request.url).searchParams.get('admin') === 'true';
  try {
    // Try to find by ID first, then by slug
    let categorySql, categoryValues;
    if (!isNaN(parseInt(idOrSlug))) {
        categorySql = 'SELECT id, name, slug, description, image_url as "imageUrl", banner_url as "bannerUrl", parent_id as "parentId", is_active as "isActive" FROM categories WHERE id = $1';
        categoryValues = [parseInt(idOrSlug)];
    } else {
        categorySql = 'SELECT id, name, slug, description, image_url as "imageUrl", banner_url as "bannerUrl", parent_id as "parentId", is_active as "isActive" FROM categories WHERE slug = $1';
        categoryValues = [idOrSlug];
    }

    let categoryRows;
    try {
        const result = await db.query(categorySql, categoryValues);
        categoryRows = result.rows;
    } catch (dbError) {
        if (dbError.message.includes('column') || dbError.message.includes('banner_url')) {
            // Fallback for old schema
            const fallbackSql = !isNaN(parseInt(idOrSlug))
                ? 'SELECT id, name, slug, image_url as "imageUrl" FROM categories WHERE id = $1'
                : 'SELECT id, name, slug, image_url as "imageUrl" FROM categories WHERE slug = $1';
            const result = await db.query(fallbackSql, categoryValues);
            categoryRows = result.rows.map(r => ({ ...r, description: '', bannerUrl: null, parentId: null, isActive: true }));
        } else {
            throw dbError;
        }
    }

    if (categoryRows.length === 0) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }
    const category = categoryRows[0];
    const id = category.id;

    if (isAdmin) {
        const { rows } = await db.query(`
          SELECT p.id, p.name, p.slug, p.price, p.stock_quantity, p.status, p.is_active,
                 b.name as "brandName", pi.image_url as "imageUrl"
          FROM products p
          JOIN category_products cp ON p.id = cp.product_id
          LEFT JOIN brands b ON p.brand_id = b.id
          LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
          WHERE cp.category_id = $1
          ORDER BY p.name
        `, [id]);
        category.products = rows.map(p => ({ ...p, price: parseFloat(p.price) }));
        return NextResponse.json(category);
    }

        const productsSql = `
          SELECT
            p.id,
            p.name,
            p.slug,
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
          WHERE cp.category_id = $1 AND p.is_active = true
          GROUP BY p.id, p.name, p.slug, p.description, p.price, b.name, pi.image_url
        `;
        let productRows;
        try {
            const result = await db.query(productsSql, [id]);
            productRows = result.rows;
        } catch (prodError) {
            if (prodError.message.includes('is_active')) {
                const fallbackProdSql = productsSql.replace('AND p.is_active = true', '');
                const result = await db.query(fallbackProdSql, [id]);
                productRows = result.rows;
            } else {
                throw prodError;
            }
        }
    category.products = productRows;

    return NextResponse.json(category);

  } catch (error) {
    console.error(`Error fetching category ${idOrSlug}:`, error);
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
 *       409:
 *         description: The URL handle is already used by another category.
 *       500:
 *         description: Server error.
 */
export async function PUT(request, { params }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;
  const client = await db.connect();
  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const description = formData.get('description');
    const customSlug = formData.get('slug');
    const imageFile = formData.get('image');
    const image_url = formData.get('image_url');
    const bannerFile = formData.get('banner');
    const banner_url = formData.get('banner_url');
    const parentId = formData.get('parent_id');

    if (!name) {
      return NextResponse.json({ message: 'Category name is required.' }, { status: 400 });
    }

    await client.query('BEGIN');

    const { rows: existingRows } = await client.query('SELECT name, slug, image_url, banner_url, parent_id FROM categories WHERE id = $1', [id]);
    if (existingRows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    // Handle slug update
    const slugify = (text) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
    let slug = existingRows[0].slug;

    if (customSlug) {
        slug = slugify(customSlug);
        const { rows: taken } = await client.query('SELECT id FROM categories WHERE slug = $1 AND id != $2', [slug, id]);
        if (taken.length > 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'Another category already uses this URL handle.' }, { status: 409 });
        }
    } else if (name !== existingRows[0].name || !slug) {
        let baseSlug = slugify(name);
        slug = baseSlug;
        let counter = 1;
        while (true) {
            const { rows: existing } = await client.query('SELECT id FROM categories WHERE slug = $1 AND id != $2', [slug, id]);
            if (existing.length === 0) break;
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
    }

    let newImageUrl = existingRows[0].image_url;
    if (imageFile && imageFile.size > 0) {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadResult = await uploadImageToCloudinary(imageBuffer);
      newImageUrl = uploadResult.secure_url;
    } else if (image_url === 'null') {
      newImageUrl = null;
    }

    let newBannerUrl = existingRows[0].banner_url;
    if (bannerFile && bannerFile.size > 0) {
      const bannerBuffer = Buffer.from(await bannerFile.arrayBuffer());
      const uploadResult = await uploadImageToCloudinary(bannerBuffer);
      newBannerUrl = uploadResult.secure_url;
    } else if (banner_url === 'null') {
      newBannerUrl = null;
    }

    const updateCategorySql = 'UPDATE categories SET name = $1, description = $2, image_url = $3, banner_url = $4, slug = $5, parent_id = $6 WHERE id = $7';
    await client.query(updateCategorySql, [name, description, newImageUrl, newBannerUrl, slug, parentId ? parseInt(parentId) : null, id]);

    // Replace product associations only when the request says which products belong here.
    // Without this check, saving from a form that doesn't send product_ids emptied the category.
    if (formData.has('product_ids')) {
      await client.query('DELETE FROM category_products WHERE category_id = $1', [id]);
      const product_ids = (formData.get('product_ids') || '').split(',').map(pid => parseInt(pid.trim())).filter(pid => !isNaN(pid) && pid > 0);
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

export async function PATCH(request, { params }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;
  try {
    const { is_active } = await request.json();
    const { rowCount } = await db.query(
      'UPDATE categories SET is_active = $1 WHERE id = $2',
      [is_active, id]
    );
    if (rowCount === 0) return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    return NextResponse.json({ message: 'Category status updated', is_active });
  } catch (error) {
    console.error(`Error toggling category ${id}:`, error);
    return NextResponse.json({ message: 'Error updating category status', error: error.message }, { status: 500 });
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
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await Promise.resolve(params);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    // Products stay in the catalogue; only their link to this category is removed
    await client.query('DELETE FROM category_products WHERE category_id = $1', [id]);
    await client.query('UPDATE categories SET parent_id = NULL WHERE parent_id = $1', [id]);
    const { rowCount } = await client.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);

    if (rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error deleting category ${id}:`, error);
    return NextResponse.json({ message: 'Error deleting category from database', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
