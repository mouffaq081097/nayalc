import db from '@/lib/db';

export { campaignStatus, dubaiInputToDate, dateToDubaiInput, parseCampaignInput } from '@/lib/campaignRules';

// Homepage campaign banners (White Friday, National Day, Ramadan…): an admin
// sets the copy, photo, link and a start/end time; the homepage shows the one
// that is live now and hides it by itself when it ends.

export const CAMPAIGNS_MIGRATION_SQL = `
  CREATE TABLE IF NOT EXISTS homepage_campaigns (
    id             SERIAL PRIMARY KEY,
    title          TEXT NOT NULL,
    subtitle       TEXT,
    cta_label      TEXT NOT NULL DEFAULT 'Shop now',
    link           TEXT NOT NULL,
    image_url      TEXT,
    starts_at      TIMESTAMPTZ NOT NULL,
    ends_at        TIMESTAMPTZ NOT NULL,
    show_countdown BOOLEAN NOT NULL DEFAULT true,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (ends_at > starts_at)
  );
`;

let ensured = false;
export async function ensureCampaignsTable() {
  if (ensured) return;
  await db.query(CAMPAIGNS_MIGRATION_SQL);
  ensured = true;
}

const COLUMNS = `id, title, subtitle, cta_label AS "ctaLabel", link, image_url AS "imageUrl",
  starts_at AS "startsAt", ends_at AS "endsAt", show_countdown AS "showCountdown", is_active AS "isActive"`;

/** The campaign live right now (the one ending soonest if several overlap), or null. */
export async function getActiveCampaign() {
  try {
    await ensureCampaignsTable();
    const { rows } = await db.query(
      `SELECT ${COLUMNS} FROM homepage_campaigns
       WHERE is_active AND starts_at <= NOW() AND ends_at > NOW()
       ORDER BY ends_at ASC LIMIT 1`
    );
    return rows[0] ? serialize(rows[0]) : null;
  } catch (error) {
    console.error('Error fetching the active campaign:', error);
    return null;
  }
}

export async function listCampaigns() {
  await ensureCampaignsTable();
  const { rows } = await db.query(`SELECT ${COLUMNS} FROM homepage_campaigns ORDER BY starts_at DESC`);
  return rows.map(serialize);
}

// Dates leave the server as ISO strings, so they pass from a server component to a client one
function serialize(row) {
  return { ...row, startsAt: new Date(row.startsAt).toISOString(), endsAt: new Date(row.endsAt).toISOString() };
}

// Only photos on this store's own Cloudinary cloud may be used, so a campaign
// can never be pointed at an arbitrary third-party asset.
export function isOwnCloudinaryUrl(url) {
  if (typeof url !== 'string') return false;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'res.cloudinary.com' && parsed.pathname.startsWith(`/${cloudName}/`);
  } catch {
    return false;
  }
}
