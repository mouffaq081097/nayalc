import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS journal_articles (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      tag TEXT,
      read_time TEXT,
      excerpt TEXT,
      body TEXT,
      cover_image_url TEXT,
      cta_label TEXT,
      cta_href TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

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
 * GET /api/admin/journal — admin only (gated by middleware). Every article,
 * active or not, for the admin list view.
 */
export async function GET() {
  try {
    await ensureTable();
    const { rows } = await db.query(
      `SELECT id, slug, title, tag, read_time as "readTime", excerpt, body, cover_image_url as "coverImageUrl",
              cta_label as "ctaLabel", cta_href as "ctaHref", is_active as "isActive", sort_order as "sortOrder",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM journal_articles
       ORDER BY sort_order ASC, created_at DESC`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching journal articles (admin):', error);
    return NextResponse.json({ message: 'Error fetching journal articles', error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/journal — admin only. multipart/form-data.
 * Required: title, body. Optional: slug (auto-generated from title if
 * omitted), tag, read_time, excerpt, cta_label, cta_href, sort_order,
 * is_active, image (uploaded to Cloudinary).
 */
export async function POST(request) {
  try {
    await ensureTable();
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
      `INSERT INTO journal_articles (slug, title, tag, read_time, excerpt, body, cover_image_url, cta_label, cta_href, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [slug, title, tag, readTime, excerpt, body, coverImageUrl, ctaLabel, ctaHref, isActive, sortOrder]
    );

    return NextResponse.json({ message: 'Article created', id: rows[0].id }, { status: 201 });
  } catch (error) {
    console.error('Error creating journal article:', error);
    if (error.code === '23505') {
      return NextResponse.json({ message: 'An article with that slug already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error creating journal article', error: error.message }, { status: 500 });
  }
}
