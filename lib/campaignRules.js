// Campaign rules shared by the browser (admin form, countdown) and the server.
// No database access here — see lib/campaigns.js for that.

/** Live / Scheduled / Ended / Off — the admin list's status pill. */
export function campaignStatus(c, now = Date.now()) {
  if (!c.isActive) return 'Off';
  if (new Date(c.startsAt).getTime() > now) return 'Scheduled';
  if (new Date(c.endsAt).getTime() <= now) return 'Ended';
  return 'Live';
}

// The admin types Dubai wall-clock times ("2026-11-27T00:00" from a
// datetime-local input). The UAE has no daylight saving, so +04:00 is exact.
export const dubaiInputToDate = (value) => new Date(`${value}:00+04:00`);
export const dateToDubaiInput = (iso) =>
  new Date(new Date(iso).getTime() + 4 * 3600 * 1000).toISOString().slice(0, 16);

/** Validates an admin's campaign form; returns { ok, values } or { ok: false, message }. */
export function parseCampaignInput(body) {
  const title = String(body.title || '').trim();
  const link = String(body.link || '').trim();
  if (!title) return { ok: false, message: 'Add a title.' };
  // Site paths only ("/sales"), or a full https link
  if (!/^\/(?!\/)/.test(link) && !/^https:\/\//.test(link)) {
    return { ok: false, message: 'The link must be a page on the site (starting with /) or an https:// address.' };
  }
  if (!body.startsAt || !body.endsAt) return { ok: false, message: 'Choose a start and an end time.' };
  const startsAt = dubaiInputToDate(body.startsAt);
  const endsAt = dubaiInputToDate(body.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) return { ok: false, message: 'Those dates are not valid.' };
  if (endsAt <= startsAt) return { ok: false, message: 'The end must be after the start.' };
  return {
    ok: true,
    values: {
      title,
      subtitle: String(body.subtitle || '').trim() || null,
      ctaLabel: String(body.ctaLabel || '').trim() || 'Shop now',
      link,
      imageUrl: body.imageUrl || null,
      startsAt,
      endsAt,
      showCountdown: body.showCountdown !== false && body.showCountdown !== 'false',
      isActive: body.isActive !== false && body.isActive !== 'false',
    },
  };
}
