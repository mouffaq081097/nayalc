import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadMediaToCloudinary } from '@/lib/cloudinary';

export async function PUT(request, { params }) {
  const { id } = params;
  const client = await db.connect();
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());

    const {
      eyebrow, headline, body, cta_text, cta_href,
      image_position, text_position, cta_style, scrim_direction, text_theme,
      sort_order, is_active
    } = data;

    await client.query('BEGIN');

    // Get current slide to know existing URLs
    const { rows: current } = await client.query('SELECT * FROM hero_slides WHERE id = $1', [id]);
    if (current.length === 0) {
      return NextResponse.json({ message: 'Slide not found' }, { status: 404 });
    }

    let mobileSrc = current[0].image_src_mobile;
    let isVideoMobile = current[0].is_video_mobile;
    let desktopSrc = current[0].image_src_desktop;
    let isVideoDesktop = current[0].is_video_desktop;

    const mobileFile = formData.get('mobileMedia');
    const desktopFile = formData.get('desktopMedia');

    if (mobileFile && mobileFile.size > 0) {
      const mobileBuffer = Buffer.from(await mobileFile.arrayBuffer());
      const mobileUpload = await uploadMediaToCloudinary(mobileBuffer);
      mobileSrc = mobileUpload.secure_url;
      isVideoMobile = mobileUpload.resource_type === 'video';
    }

    if (desktopFile && desktopFile.size > 0) {
      const desktopBuffer = Buffer.from(await desktopFile.arrayBuffer());
      const desktopUpload = await uploadMediaToCloudinary(desktopBuffer);
      desktopSrc = desktopUpload.secure_url;
      isVideoDesktop = desktopUpload.resource_type === 'video';
    }

    const sql = `
      UPDATE hero_slides SET
        eyebrow = $1, headline = $2, body = $3, cta_text = $4, cta_href = $5,
        image_src_mobile = $6, image_src_desktop = $7, is_video_mobile = $8, is_video_desktop = $9,
        image_position = $10, text_position = $11, cta_style = $12, scrim_direction = $13, text_theme = $14,
        sort_order = $15, is_active = $16, updated_at = CURRENT_TIMESTAMP
      WHERE id = $17;
    `;

    const values = [
      eyebrow, headline, body, cta_text, cta_href,
      mobileSrc, desktopSrc, isVideoMobile, isVideoDesktop,
      image_position, text_position, cta_style, scrim_direction, text_theme,
      parseInt(sort_order) || 0, is_active === 'true',
      id
    ];

    await client.query(sql, values);
    await client.query('COMMIT');

    return NextResponse.json({ message: 'Hero slide updated' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating hero slide:', error);
    return NextResponse.json({ message: 'Error updating hero slide', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;
  try {
    await db.query('DELETE FROM hero_slides WHERE id = $1', [id]);
    return NextResponse.json({ message: 'Hero slide deleted' });
  } catch (error) {
    console.error('Error deleting hero slide:', error);
    return NextResponse.json({ message: 'Error deleting hero slide', error: error.message }, { status: 500 });
  }
}
