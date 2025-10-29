import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

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
export async function GET() {
  try {
    // Note: In Postgres, column names with capitals might need to be quoted.
    const { rows } = await db.query('SELECT id, name, imageurl FROM brands');
    return NextResponse.json(rows);
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
 *               status:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Brand added successfully.
 *       400:
 *         description: Bad request, e.g., brand name is missing.
 *       500:
 *         description: Server error while adding the brand.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const status = formData.get('status');
    const imageFile = formData.get('image');

    if (!name) {
      return NextResponse.json({ message: 'Brand name is required.' }, { status: 400 });
    }

    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      // Convert the image file to a buffer
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      
      // Upload buffer to Cloudinary
      const uploadResult = await uploadImageToCloudinary(imageBuffer);
      imageUrl = uploadResult.secure_url;
    }

    // Note the change from ? to $1, $2, etc., for Postgres
    const sql = 'INSERT INTO brands (name, status, imageurl) VALUES ($1, $2, $3) RETURNING id, name, status, imageurl';
    const values = [name, status, imageUrl];
    
    const { rows } = await db.query(sql, values);

    return NextResponse.json({ message: 'Brand added successfully', brand: rows[0] }, { status: 201 });

  } catch (error) {
    console.error('Error adding brand:', error);
    return NextResponse.json({ message: 'Error adding brand to database', error: error.message }, { status: 500 });
  }
}