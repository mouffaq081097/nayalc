import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import { uploadMediaToCloudinary } from '@/lib/cloudinary';
import { requireAdmin } from '@/lib/adminAuth';
import { hasSeoColumns, parseAltText } from '@/lib/seoColumns';

// Text fields a save may change; one that isn't in the request stays as it is, so
// switching a slide on or off (which sends only is_active) no longer empties the rest
const TEXT_FIELDS = [
  'eyebrow', 'headline', 'body', 'cta_text', 'cta_href',
  'image_position', 'text_position', 'cta_style', 'scrim_direction', 'text_theme',
];

export async function PUT(request, { params }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const formData = await request.formData();
  // Before BEGIN: adding the column locks the table
  const saveAlt = formData.has('image_alt') && await hasSeoColumns();
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { rows: current } = await client.query('SELECT id FROM hero_slides WHERE id = $1 FOR UPDATE', [id]);
    if (current.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Slide not found' }, { status: 404 });
    }

    const sets = [];
    const values = [];
    const set = (column, value) => {
      values.push(value);
      sets.push(`${column} = $${values.length}`);
    };

    for (const field of TEXT_FIELDS) {
      if (formData.has(field)) set(field, formData.get(field));
    }
    if (formData.has('sort_order')) set('sort_order', parseInt(formData.get('sort_order'), 10) || 0);
    if (formData.has('is_active')) set('is_active', formData.get('is_active') === 'true');
    if (saveAlt) set('image_alt', parseAltText(formData.get('image_alt')));

    const mobileFile = formData.get('mobileMedia');
    if (mobileFile && mobileFile.size > 0) {
      const upload = await uploadMediaToCloudinary(Buffer.from(await mobileFile.arrayBuffer()));
      set('image_src_mobile', upload.secure_url);
      set('is_video_mobile', upload.resource_type === 'video');
    }
    const desktopFile = formData.get('desktopMedia');
    if (desktopFile && desktopFile.size > 0) {
      const upload = await uploadMediaToCloudinary(Buffer.from(await desktopFile.arrayBuffer()));
      set('image_src_desktop', upload.secure_url);
      set('is_video_desktop', upload.resource_type === 'video');
    }

    if (sets.length) {
      values.push(id);
      await client.query(`UPDATE hero_slides SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length}`, values);
    }
    await client.query('COMMIT');
    try { revalidatePath('/'); } catch { /* outside a request */ }

    return NextResponse.json({ message: 'Hero slide updated' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error updating hero slide:', error);
    return NextResponse.json({ message: 'Error updating hero slide', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request, { params }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    await db.query('DELETE FROM hero_slides WHERE id = $1', [id]);
    try { revalidatePath('/'); } catch { /* outside a request */ }
    return NextResponse.json({ message: 'Hero slide deleted' });
  } catch (error) {
    console.error('Error deleting hero slide:', error);
    return NextResponse.json({ message: 'Error deleting hero slide', error: error.message }, { status: 500 });
  }
}
