import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadMediaToCloudinary } from '@/lib/cloudinary';

export async function GET() {
  try {
    const { rows } = await db.query('SELECT * FROM hero_slides ORDER BY sort_order ASC, created_at DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching hero slides:', error);
    return NextResponse.json({ message: 'Error fetching hero slides', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const client = await db.connect();
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());

    const {
      eyebrow, headline, body, cta_text, cta_href,
      image_position, text_position, cta_style, scrim_direction, text_theme,
      sort_order, is_active
    } = data;

    if (!headline) {
      return NextResponse.json({ message: 'Headline is required' }, { status: 400 });
    }

    const mobileFile = formData.get('mobileMedia');
    const desktopFile = formData.get('desktopMedia');

    if (!mobileFile || !desktopFile) {
      return NextResponse.json({ message: 'Both mobile and desktop media are required' }, { status: 400 });
    }

    await client.query('BEGIN');

    // Upload Mobile Media
    const mobileBuffer = Buffer.from(await mobileFile.arrayBuffer());
    const mobileUpload = await uploadMediaToCloudinary(mobileBuffer);
    const isVideoMobile = mobileUpload.resource_type === 'video';

    // Upload Desktop Media
    const desktopBuffer = Buffer.from(await desktopFile.arrayBuffer());
    const desktopUpload = await uploadMediaToCloudinary(desktopBuffer);
    const isVideoDesktop = desktopUpload.resource_type === 'video';

    const sql = `
      INSERT INTO hero_slides (
        eyebrow, headline, body, cta_text, cta_href,
        image_src_mobile, image_src_desktop, is_video_mobile, is_video_desktop,
        image_position, text_position, cta_style, scrim_direction, text_theme,
        sort_order, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id;
    `;

    const values = [
      eyebrow, headline, body, cta_text, cta_href,
      mobileUpload.secure_url, desktopUpload.secure_url, isVideoMobile, isVideoDesktop,
      image_position || 'object-center', text_position || 'left', cta_style || 'lavender-cloud',
      scrim_direction || 'none', text_theme || 'light',
      parseInt(sort_order) || 0, is_active === 'true'
    ];

    const { rows } = await client.query(sql, values);

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Hero slide created', id: rows[0].id }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating hero slide:', error);
    return NextResponse.json({ message: 'Error creating hero slide', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
