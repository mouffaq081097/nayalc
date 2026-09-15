import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { slugify } from '@/lib/slugify';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * @swagger
 * /api/brands/{id}:
 *   get:
 *     summary: Get a single brand by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A single brand.
 *       404:
 *         description: Brand not found.
 *       500:
 *         description: Server error.
 */
export async function GET(request, context) {
  const { id } = await context.params;
  try {
    const { rows } = await db.query('SELECT id, name, imageurl, is_active FROM brands WHERE id = $1', [id]);

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json({ ...rows[0], slug: slugify(rows[0].name) });
  } catch (error) {
    console.error(`Error fetching brand with ID ${id}:`, error);
    return NextResponse.json({ message: 'Error fetching brand from database' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/brands/{id}:
 *   put:
 *     summary: Update an existing brand
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               image_url:
 *                 type: string
 *                 description: Send "null" to remove the brand photo.
 *     responses:
 *       200:
 *         description: Brand updated successfully.
 *       404:
 *         description: Brand not found.
 *       409:
 *         description: Another brand already uses this name.
 *       500:
 *         description: Server error.
 */
export async function PUT(request, context) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const client = await db.connect();
  try {
    const formData = await request.formData();
    const name = String(formData.get('name') || '').trim();
    const imageFile = formData.get('image');
    const imageUrlField = formData.get('image_url');

    if (!name) {
      return NextResponse.json({ message: 'Brand name is required.' }, { status: 400 });
    }

    const { rows: existingRows } = await client.query('SELECT imageurl FROM brands WHERE id = $1', [id]);
    if (existingRows.length === 0) {
      return NextResponse.json({ message: 'Brand not found' }, { status: 404 });
    }

    // Brand pages are found by a slug made from the name, so two brands can't share one
    const slug = slugify(name);
    const { rows: others } = await client.query('SELECT name FROM brands WHERE id <> $1', [id]);
    if (others.some(b => slugify(b.name) === slug)) {
      return NextResponse.json({ message: 'Another brand already uses this name.' }, { status: 409 });
    }

    let imageUrl = existingRows[0].imageurl;
    if (imageFile && imageFile.size > 0) {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadResult = await uploadImageToCloudinary(imageBuffer);
      imageUrl = uploadResult.secure_url;
    } else if (imageUrlField === 'null') {
      imageUrl = null;
    }

    await client.query('BEGIN');
    const { rows } = await client.query(
      'UPDATE brands SET name = $1, imageurl = $2, slug = $3 WHERE id = $4 RETURNING *',
      [name, imageUrl, slug, id]
    );
    // Products keep a copy of their brand name (used in carts and campaigns), so keep it in step
    await client.query('UPDATE products SET vendor = $1 WHERE brand_id = $2', [name, id]);
    await client.query('COMMIT');

    return NextResponse.json({ message: 'Brand updated successfully', brand: rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(`Error updating brand with ID ${id}:`, error);
    return NextResponse.json({ message: 'Error updating brand in database', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PATCH(request, context) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  try {
    const { is_active } = await request.json();
    const { rowCount } = await db.query(
      'UPDATE brands SET is_active = $1 WHERE id = $2',
      [is_active, id]
    );
    if (rowCount === 0) return NextResponse.json({ message: 'Brand not found' }, { status: 404 });
    return NextResponse.json({ message: 'Brand status updated', is_active });
  } catch (error) {
    console.error(`Error toggling brand ${id}:`, error);
    return NextResponse.json({ message: 'Error updating brand status', error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/brands/{id}:
 *   delete:
 *     summary: Delete a brand that has no products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Brand deleted successfully.
 *       404:
 *         description: Brand not found.
 *       409:
 *         description: The brand still has products.
 *       500:
 *         description: Server error.
 */
export async function DELETE(request, context) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  try {
    // Products point at their brand without a database constraint, so deleting a brand in use would orphan them
    const { rows: [{ count }] } = await db.query('SELECT COUNT(*)::int AS count FROM products WHERE brand_id = $1', [id]);
    if (count > 0) {
      return NextResponse.json({
        message: `This brand still has ${count} product${count !== 1 ? 's' : ''}. Move them to another brand first, or hide the brand instead.`,
      }, { status: 409 });
    }

    const { rowCount } = await db.query('DELETE FROM brands WHERE id = $1 RETURNING id', [id]);
    if (rowCount === 0) {
      return NextResponse.json({ message: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error(`Error deleting brand with ID ${id}:`, error);
    return NextResponse.json({ message: 'Error deleting brand from database', error: error.message }, { status: 500 });
  }
}
