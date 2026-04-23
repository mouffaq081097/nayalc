import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

/**
 * GET /api/social-posts/[id]
 */
export async function GET(request, context) {
  const id = context.params.id;
  try {
    const { rows } = await db.query('SELECT * FROM social_posts WHERE id = $1', [id]);
    if (rows.length === 0) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(`Error fetching social post ${id}:`, error);
    return NextResponse.json({ message: 'Error fetching social post' }, { status: 500 });
  }
}

/**
 * PUT /api/social-posts/[id]
 * Update a social post. Optionally replace the image.
 */
export async function PUT(request, context) {
  const id = context.params.id;
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image');
    const instagramUrl = formData.get('instagram_url') || '';
    const caption = formData.get('caption') || '';
    const likes = formData.get('likes') || '0';
    const sortOrder = formData.get('sort_order') || 0;

    // Get existing post
    const { rows: existing } = await db.query('SELECT image_url FROM social_posts WHERE id = $1', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    let imageUrl = existing[0].image_url;

    // If a new image is uploaded, replace it
    if (imageFile && imageFile.size > 0) {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadResult = await uploadImageToCloudinary(imageBuffer);
      imageUrl = uploadResult.secure_url;
    }

    const sql = `
      UPDATE social_posts
      SET image_url = $1, instagram_url = $2, caption = $3, likes = $4, sort_order = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `;
    const { rows } = await db.query(sql, [imageUrl, instagramUrl, caption, likes, sortOrder, id]);

    return NextResponse.json({ message: 'Post updated', post: rows[0] });
  } catch (error) {
    console.error(`Error updating social post ${id}:`, error);
    return NextResponse.json({ message: 'Error updating social post', error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/social-posts/[id]
 * Toggle active status.
 */
export async function PATCH(request, context) {
  const id = context.params.id;
  try {
    const { is_active } = await request.json();
    const { rowCount } = await db.query(
      'UPDATE social_posts SET is_active = $1, updated_at = NOW() WHERE id = $2',
      [is_active, id]
    );
    if (rowCount === 0) return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    return NextResponse.json({ message: 'Post status updated', is_active });
  } catch (error) {
    console.error(`Error toggling social post ${id}:`, error);
    return NextResponse.json({ message: 'Error updating post status', error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/social-posts/[id]
 */
export async function DELETE(request, context) {
  const id = context.params.id;
  try {
    const { rowCount } = await db.query('DELETE FROM social_posts WHERE id = $1 RETURNING id', [id]);
    if (rowCount === 0) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error(`Error deleting social post ${id}:`, error);
    return NextResponse.json({ message: 'Error deleting social post', error: error.message }, { status: 500 });
  }
}
