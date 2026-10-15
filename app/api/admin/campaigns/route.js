import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { ensureCampaignsTable, listCampaigns, parseCampaignInput, isOwnCloudinaryUrl } from '@/lib/campaigns';

/** GET /api/admin/campaigns — admin only (middleware). Every campaign, newest start first. */
export async function GET() {
  try {
    return NextResponse.json(await listCampaigns());
  } catch (error) {
    console.error('Error listing campaigns:', error);
    return NextResponse.json({ message: 'Could not load campaigns.' }, { status: 500 });
  }
}

/** POST /api/admin/campaigns — creates a campaign. Times arrive as Dubai wall-clock "YYYY-MM-DDTHH:mm". */
export async function POST(request) {
  try {
    const parsed = parseCampaignInput(await request.json());
    if (!parsed.ok) return NextResponse.json({ message: parsed.message }, { status: 400 });
    const v = parsed.values;
    if (v.imageUrl && !isOwnCloudinaryUrl(v.imageUrl)) {
      return NextResponse.json({ message: 'Upload the photo here or pick it from the store\'s Cloudinary library.' }, { status: 400 });
    }

    await ensureCampaignsTable();
    const { rows } = await db.query(
      `INSERT INTO homepage_campaigns (title, subtitle, cta_label, link, image_url, starts_at, ends_at, show_countdown, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [v.title, v.subtitle, v.ctaLabel, v.link, v.imageUrl, v.startsAt, v.endsAt, v.showCountdown, v.isActive]
    );
    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ message: 'Could not save the campaign.' }, { status: 500 });
  }
}
