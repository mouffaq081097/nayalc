import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

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
  const id = context.params.id;
  try {
    const { rows } = await db.query('SELECT id, name, imageurl FROM brands WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      return NextResponse.json({ message: 'Brand not found' }, { status: 404 });
    }
    
    return NextResponse.json(rows[0]);
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
 *               status:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Brand updated successfully.
 *       404:
 *         description: Brand not found.
 *       500:
 *         description: Server error.
 */
export async function PUT(request, context) {
  const id = context.params.id;
  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const status = formData.get('status');
    const imageFile = formData.get('image');

    // First, get the existing brand data
    const { rows: existingRows } = await db.query('SELECT imageurl FROM brands WHERE id = $1', [id]);
    if (existingRows.length === 0) {
        return NextResponse.json({ message: 'Brand not found' }, { status: 404 });
    }

    let imageUrl = existingRows[0].imageUrl;

    // If a new image is uploaded, upload it to Cloudinary
    if (imageFile && imageFile.size > 0) {
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        const uploadResult = await uploadImageToCloudinary(imageBuffer);
        imageUrl = uploadResult.secure_url;
        // TODO: Optionally delete the old image from Cloudinary
    }

    const sql = 'UPDATE brands SET name = $1, status = $2, imageurl = $3 WHERE id = $4 RETURNING *;';
    const { rows } = await db.query(sql, [name, status, imageUrl, id]);

    if (rows.length === 0) {
        return NextResponse.json({ message: 'Brand not found or no changes made' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Brand updated successfully', brand: rows[0] });
  } catch (error) {
    console.error(`Error updating brand with ID ${id}:`, error);
    return NextResponse.json({ message: 'Error updating brand in database', error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/brands/{id}:
 *   delete:
 *     summary: Delete a brand
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
 *       500:
 *         description: Server error.
 */
export async function DELETE(request, context) {
  const id = context.params.id;
  try {
    const sql = 'DELETE FROM brands WHERE id = $1 RETURNING id';
    const { rowCount } = await db.query(sql, [id]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error(`Error deleting brand with ID ${id}:`, error);
    return NextResponse.json({ message: 'Error deleting brand from database', error: error.message }, { status: 500 });
  }
}