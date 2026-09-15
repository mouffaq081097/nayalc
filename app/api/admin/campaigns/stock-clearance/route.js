import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { buildStockClearanceEmail, sendStockClearanceEmail } from '@/lib/mail';
import { CLEARANCE_DEFAULTS, ensureClearanceCoupon, fetchClearanceProducts } from '@/lib/stockClearance';

// Emails are sent one by one, so give large audiences time to finish
export const maxDuration = 300;

function readOptions(source) {
  const code = String(source.code || CLEARANCE_DEFAULTS.code).trim().toUpperCase();
  const days = parseInt(source.validDays, 10);
  return {
    code,
    discountPercent: CLEARANCE_DEFAULTS.discountPercent,
    validDays: Number.isFinite(days) ? Math.min(Math.max(days, 1), 90) : CLEARANCE_DEFAULTS.validDays,
    heroImage: String(source.heroImage || '').trim() || CLEARANCE_DEFAULTS.heroImage,
  };
}

function validateOptions(options) {
  if (!/^[A-Z0-9_-]{3,32}$/.test(options.code)) {
    return 'Coupon code must be 3–32 letters, numbers, dashes or underscores.';
  }
  // The URL is placed inside HTML attributes and CSS url(), so reject quotes, brackets and whitespace
  if (!/^https:\/\/[^\s"'<>()\\]+$/.test(options.heroImage)) {
    return 'Hero image must be an https:// image URL.';
  }
  return null;
}

async function fetchRecipients() {
  const sql = `
    SELECT DISTINCT ON (LOWER(email)) email, first_name
    FROM users
    WHERE email IS NOT NULL AND email <> '' AND COALESCE(is_suspended, false) = false
    ORDER BY LOWER(email)
  `;
  try {
    const { rows } = await db.query(sql);
    return rows;
  } catch (error) {
    if (error.code !== '42703') throw error; // is_suspended column not migrated yet
    const { rows } = await db.query(sql.replace(' AND COALESCE(is_suspended, false) = false', ''));
    return rows;
  }
}

// Preview only — no coupon is created and nothing is sent
export async function GET(request) {
  try {
    const options = readOptions(Object.fromEntries(new URL(request.url).searchParams));
    const invalid = validateOptions(options);
    if (invalid) return NextResponse.json({ message: invalid }, { status: 400 });

    const [products, recipients] = await Promise.all([fetchClearanceProducts(), fetchRecipients()]);
    const expiresAt = new Date(Date.now() + options.validDays * 24 * 60 * 60 * 1000);
    const { subject, html } = buildStockClearanceEmail({ ...options, firstName: 'Layla', expiresAt, products });

    return NextResponse.json({ subject, html, ...options, expiresAt, products, recipientCount: recipients.length });
  } catch (error) {
    console.error('Stock clearance preview error:', error);
    return NextResponse.json({ message: 'Failed to build preview', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { mode, testEmail } = body;
    const options = readOptions(body);

    if (mode !== 'test' && mode !== 'send') {
      return NextResponse.json({ message: 'mode must be "test" or "send".' }, { status: 400 });
    }
    const invalid = validateOptions(options);
    if (invalid) return NextResponse.json({ message: invalid }, { status: 400 });
    if (mode === 'test' && !testEmail) {
      return NextResponse.json({ message: 'Test email is required.' }, { status: 400 });
    }

    const products = await fetchClearanceProducts();
    if (products.length === 0) {
      return NextResponse.json({ message: 'There are no active in-stock products to promote.' }, { status: 400 });
    }

    let coupon, created;
    try {
      ({ coupon, created } = await ensureClearanceCoupon(options));
    } catch (error) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    const emailOptions = {
      code: coupon.code,
      discountPercent: Number(coupon.discount_value),
      expiresAt: coupon.expiration_date,
      heroImage: options.heroImage,
      products,
    };
    const couponNote = created ? `Coupon ${coupon.code} created.` : `Using existing coupon ${coupon.code}.`;

    if (mode === 'test') {
      const result = await sendStockClearanceEmail(testEmail, { ...emailOptions, subjectPrefix: '[TEST]' });
      if (!result.success) {
        return NextResponse.json({ message: `Test email failed: ${result.error}` }, { status: 502 });
      }
      return NextResponse.json({ message: `${couponNote} Test email sent to ${testEmail}.` });
    }

    const recipients = await fetchRecipients();
    if (recipients.length === 0) {
      return NextResponse.json({ message: 'No registered customers found.' }, { status: 404 });
    }

    const failed = [];
    for (const recipient of recipients) {
      const result = await sendStockClearanceEmail(recipient.email, { ...emailOptions, firstName: recipient.first_name });
      if (!result.success) failed.push(recipient.email);
    }

    const sent = recipients.length - failed.length;
    return NextResponse.json({
      message: `${couponNote} Sent to ${sent} of ${recipients.length} customer(s)${failed.length ? `, ${failed.length} failed` : ''}.`,
      sent,
      failed,
    }, { status: sent === 0 ? 502 : 200 });
  } catch (error) {
    console.error('Stock clearance campaign error:', error);
    return NextResponse.json({ message: 'Failed to send stock clearance campaign', error: error.message }, { status: 500 });
  }
}
