import db from './db.js';
import { reviewerName } from './reviewerName.js';

/**
 * The homepage's "What customers say": the newest 4 and 5-star reviews that
 * have a written comment, one per product, on products still on sale. Chosen
 * by rule, never edited; the section stays hidden under MIN_REVIEW_HIGHLIGHTS.
 */
export const MIN_REVIEW_HIGHLIGHTS = 3;

export async function getReviewHighlights(limit = 6) {
  const { rows } = await db.query(
    `SELECT * FROM (
       SELECT DISTINCT ON (r.product_id)
              r.id, r.rating, r.comment, r.created_at,
              u.first_name, u.last_name, u.username,
              p.id AS product_id, p.name AS product_name, p.slug AS product_slug,
              (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id
                ORDER BY pi.is_main DESC NULLS LAST, pi.display_order ASC, pi.id ASC LIMIT 1) AS image_url
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         JOIN products p ON p.id = r.product_id
        WHERE r.rating >= 4
          AND LENGTH(TRIM(COALESCE(r.comment, ''))) >= 20
          AND p.is_active = TRUE AND (p.status = 'active' OR p.status IS NULL)
        ORDER BY r.product_id, r.created_at DESC
     ) latest
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit],
  );
  return rows.map((r) => ({
    id: r.id,
    rating: Number(r.rating),
    comment: String(r.comment).trim().slice(0, 320),
    name: reviewerName(r),
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    product: { id: r.product_id, name: r.product_name, slug: r.product_slug, imageUrl: r.image_url },
  }));
}
