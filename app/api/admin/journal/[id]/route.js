import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

/**
 * PUT /api/admin/journal/[id] — admin only. multipart/form-data, same fields
 * as POST /api/admin/journal. Image is only replaced if a new file is sent.
 */
export async function PUT(request, context) {
  const { id } = await context.params;
  try {
    const formData = await request.formData();

    const title = formData.get('title');
    const body = formData.get('body');
    if (!title || !body) {
      return NextResponse.json({ message: 'Title and body are required.' }, { status: 400 });
    }

    let slug = (formData.get('slug') || '').toString().trim();
    slug = slug ? slugify(slug) : slugify(title);

    let coverImageUrl = (formData.get('coverImageUrl') || '').toString().trim() || null;
    const imageFile = formData.get('image');
    if (imageFile && typeof imageFile === 'object' && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadResult = await uploadImageToCloudinary(buffer);
      coverImageUrl = uploadResult.secure_url;
    }

    const tag = formData.get('tag') || null;
    const readTime = formData.get('readTime') || null;
    const excerpt = formData.get('excerpt') || null;
    const ctaLabel = formData.get('ctaLabel') || null;
    const ctaHref = formData.get('ctaHref') || null;
    const sortOrder = parseInt(formData.get('sortOrder'), 10) || 0;
    const isActive = formData.get('isActive') !== 'false';

    const { rows } = await db.query(
      `UPDATE journal_articles
       SET slug = $1, title = $2, tag = $3, read_time = $4, excerpt = $5, body = $6,
           cover_image_url = $7, cta_label = $8, cta_href = $9, is_active = $10, sort_order = $11,
           updated_at = NOW()
       WHERE id = $12
       RETURNING id`,
      [slug, title, tag, readTime, excerpt, body, coverImageUrl, ctaLabel, ctaHref, isActive, sortOrder, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Article not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Article updated' });
  } catch (error) {
    console.error('Error updating journal article:', error);
    if (error.code === '23505') {
      return NextResponse.json({ message: 'An article with that slug already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error updating journal article', error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/journal/[id] — admin only.
 */
export async function DELETE(request, context) {
  const { id } = await context.params;
  try {
    await db.query('DELETE FROM journal_articles WHERE id = $1', [id]);
    return NextResponse.json({ message: 'Article deleted' });
  } catch (error) {
    console.error('Error deleting journal article:', error);
    return NextResponse.json({ message: 'Error deleting journal article', error: error.message }, { status: 500 });
  }
}
