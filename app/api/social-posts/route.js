import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

/**
 * GET /api/social-posts
 * Returns all social posts, ordered by sort_order then created_at.
 * ?admin=true includes inactive posts.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const isAdmin = searchParams.get('admin') === 'true';

  try {
    // Auto-create table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS social_posts (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        instagram_url TEXT,
        caption TEXT,
        likes TEXT DEFAULT '0',
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const sql = isAdmin
      ? 'SELECT * FROM social_posts ORDER BY sort_order ASC, created_at DESC'
      : 'SELECT * FROM social_posts WHERE is_active = true ORDER BY sort_order ASC, created_at DESC';

    const { rows } = await db.query(sql);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching social posts:', error);
    return NextResponse.json({ message: 'Error fetching social posts', error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/social-posts
 * Create a new social post. Accepts multipart form data with image upload.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image');
    const instagramUrl = formData.get('instagram_url') || '';
    const caption = formData.get('caption') || '';
    const likes = formData.get('likes') || '0';
    const sortOrder = formData.get('sort_order') || 0;

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ message: 'Image is required.' }, { status: 400 });
    }

    // Upload to Cloudinary
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const uploadResult = await uploadImageToCloudinary(imageBuffer);
    const imageUrl = uploadResult.secure_url;

    const sql = `
      INSERT INTO social_posts (image_url, instagram_url, caption, likes, sort_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const { rows } = await db.query(sql, [imageUrl, instagramUrl, caption, likes, sortOrder]);

    return NextResponse.json({ message: 'Social post created', post: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating social post:', error);
    return NextResponse.json({ message: 'Error creating social post', error: error.message }, { status: 500 });
  }
}
