import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { slugify } from '@/lib/slugify';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * @swagger
 * /api/brands:
 *   get:
 *     summary: Get all brands
 *     description: Retrieves a list of all brands from the database.
 *     responses:
 *       200:
 *         description: A list of brands.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   imageUrl:
 *                     type: string
 *       500:
 *         description: Server error while fetching brands.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const isAdmin = searchParams.get('admin') === 'true';
  try {
    const sql = isAdmin
      ? 'SELECT b.id, b.name, b.imageurl, b.is_active, (SELECT COUNT(*)::int FROM products p WHERE p.brand_id = b.id) AS "productsCount" FROM brands b ORDER BY b.name ASC'
      : 'SELECT id, name, imageurl FROM brands WHERE is_active = true ORDER BY name ASC';
    let rows;
    try {
      const result = await db.query(sql);
      rows = result.rows;
    } catch (dbError) {
      if (dbError.message.includes('is_active')) {
        const fallbackSql = isAdmin
          ? 'SELECT id, name, imageurl FROM brands ORDER BY name ASC'
          : 'SELECT id, name, imageurl FROM brands ORDER BY name ASC';
        const result = await db.query(fallbackSql);
        rows = result.rows.map(r => ({ ...r, is_active: true }));
      } else {
        throw dbError;
      }
    }
    const withSlugs = rows.map((row) => ({ ...row, slug: slugify(row.name) }));
    const headers = !isAdmin ? { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } : {};
    return NextResponse.json(withSlugs, { headers });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ message: 'Error fetching brands from database' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/brands:
 *   post:
 *     summary: Add a new brand
 *     description: Creates a new brand and optionally uploads an image to Cloudinary.
 *     requestBody:
 *       required: true
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
 *     responses:
 *       201:
 *         description: Brand added successfully.
 *       400:
 *         description: Bad request, e.g., brand name is missing.
 *       409:
 *         description: Another brand already uses this name.
 *       500:
 *         description: Server error while adding the brand.
 */
export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const formData = await request.formData();
    const name = String(formData.get('name') || '').trim();
    const imageFile = formData.get('image');

    if (!name) {
      return NextResponse.json({ message: 'Brand name is required.' }, { status: 400 });
    }

    // Brand pages are found by a slug made from the name, so two brands can't share one
    const slug = slugify(name);
    const { rows: existing } = await db.query('SELECT name FROM brands');
    if (existing.some(b => slugify(b.name) === slug)) {
      return NextResponse.json({ message: 'Another brand already uses this name.' }, { status: 409 });
    }

    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadResult = await uploadImageToCloudinary(imageBuffer);
      imageUrl = uploadResult.secure_url;
    }

    const { rows } = await db.query(
      'INSERT INTO brands (name, imageurl, slug) VALUES ($1, $2, $3) RETURNING id, name, imageurl, is_active',
      [name, imageUrl, slug]
    );

    return NextResponse.json({ message: 'Brand added successfully', brand: rows[0] }, { status: 201 });

  } catch (error) {
    console.error('Error adding brand:', error);
    return NextResponse.json({ message: 'Error adding brand to database', error: error.message }, { status: 500 });
  }
}
