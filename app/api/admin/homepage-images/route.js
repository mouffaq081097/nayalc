import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { HOMEPAGE_IMAGE_SLOTS, getSlot } from '@/lib/homepageImageSlots';

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS homepage_images (
      key TEXT PRIMARY KEY,
      image_url TEXT NOT NULL,
      alt_text TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

/**
 * GET /api/admin/homepage-images
 * Admin only (gated by middleware). Every known slot, with its current
 * override (if any) and its default fallback asset.
 */
export async function GET() {
  try {
    await ensureTable();
    const { rows } = await db.query('SELECT key, image_url, alt_text, updated_at FROM homepage_images');
    const overrides = Object.fromEntries(rows.map((r) => [r.key, r]));

    const slots = HOMEPAGE_IMAGE_SLOTS.map((slot) => {
      const override = overrides[slot.key];
      return {
        key: slot.key,
        label: slot.label,
        section: slot.section,
        fallbackUrl: slot.fallbackUrl,
        alt: override?.alt_text || slot.alt,
        imageUrl: override?.image_url || slot.fallbackUrl,
        isCustom: !!override,
        updatedAt: override?.updated_at || null,
      };
    });

    return NextResponse.json(slots);
  } catch (error) {
    console.error('Error fetching homepage image slots:', error);
    return NextResponse.json({ message: 'Error fetching homepage image slots', error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/homepage-images
 * Admin only. multipart/form-data: `key` (must match a known slot), `image`.
 * Uploads to Cloudinary and upserts the override row.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const key = formData.get('key');
    const imageFile = formData.get('image');
    const altText = formData.get('alt_text') || '';

    const slot = getSlot(key);
    if (!slot) {
      return NextResponse.json({ message: 'Unknown homepage image slot.' }, { status: 400 });
    }
    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ message: 'Image is required.' }, { status: 400 });
    }

    await ensureTable();

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const uploadResult = await uploadImageToCloudinary(imageBuffer);

    const { rows } = await db.query(
      `INSERT INTO homepage_images (key, image_url, alt_text, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (key) DO UPDATE SET image_url = EXCLUDED.image_url, alt_text = EXCLUDED.alt_text, updated_at = NOW()
       RETURNING key, image_url, alt_text, updated_at`,
      [key, uploadResult.secure_url, altText || slot.alt]
    );

    return NextResponse.json({ message: 'Image updated', slot: rows[0] });
  } catch (error) {
    console.error('Error updating homepage image:', error);
    return NextResponse.json({ message: 'Error updating homepage image', error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/homepage-images?key=...
 * Admin only. Removes the override so the slot reverts to its default asset.
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const slot = getSlot(key);
    if (!slot) {
      return NextResponse.json({ message: 'Unknown homepage image slot.' }, { status: 400 });
    }

    await ensureTable();
    await db.query('DELETE FROM homepage_images WHERE key = $1', [key]);
    return NextResponse.json({ message: 'Reverted to default image' });
  } catch (error) {
    console.error('Error reverting homepage image:', error);
    return NextResponse.json({ message: 'Error reverting homepage image', error: error.message }, { status: 500 });
  }
}
