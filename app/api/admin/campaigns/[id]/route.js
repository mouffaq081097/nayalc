import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { ensureCampaignsTable, parseCampaignInput, isOwnCloudinaryUrl } from '@/lib/campaigns';

/** PUT /api/admin/campaigns/[id] — admin only (middleware). Replaces the campaign's fields. */
export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const parsed = parseCampaignInput(await request.json());
    if (!parsed.ok) return NextResponse.json({ message: parsed.message }, { status: 400 });
    const v = parsed.values;
    if (v.imageUrl && !isOwnCloudinaryUrl(v.imageUrl)) {
      return NextResponse.json({ message: 'Upload the photo here or pick it from the store\'s Cloudinary library.' }, { status: 400 });
    }

    await ensureCampaignsTable();
    const { rowCount } = await db.query(
      `UPDATE homepage_campaigns SET title = $1, subtitle = $2, cta_label = $3, link = $4, image_url = $5,
         starts_at = $6, ends_at = $7, show_countdown = $8, is_active = $9, updated_at = NOW()
       WHERE id = $10`,
      [v.title, v.subtitle, v.ctaLabel, v.link, v.imageUrl, v.startsAt, v.endsAt, v.showCountdown, v.isActive, id]
    );
    if (!rowCount) return NextResponse.json({ message: 'Campaign not found.' }, { status: 404 });
    return NextResponse.json({ id: Number(id) });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ message: 'Could not save the campaign.' }, { status: 500 });
  }
}

/** DELETE /api/admin/campaigns/[id] */
export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await ensureCampaignsTable();
    await db.query('DELETE FROM homepage_campaigns WHERE id = $1', [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ message: 'Could not delete the campaign.' }, { status: 500 });
  }
}
