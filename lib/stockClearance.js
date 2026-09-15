import db from './db.js';

export const CLEARANCE_DEFAULTS = {
  code: 'LASTPIECES5',
  discountPercent: 5,
  validDays: 14,
  productLimit: 6,
  // A still (6s in) from the homepage hero video, cropped for email by Cloudinary
  heroImage: 'https://res.cloudinary.com/dhjmoqu2n/video/upload/so_6,w_1200,h_800,c_fill,g_auto,q_auto,f_jpg/v1777187281/ip98dxpnujcntzybohxy.jpg',
};

// Active, in-stock products — highest remaining stock first, since that's what we most need to move
export async function fetchClearanceProducts(limit = CLEARANCE_DEFAULTS.productLimit) {
  const { rows } = await db.query(`
    SELECT p.id, p.name, p.price, p.stock_quantity,
           COALESCE(b.name, 'Naya Lumière') AS brand_name,
           (SELECT pi.image_url FROM product_images pi
            WHERE pi.product_id = p.id AND pi.is_main = TRUE LIMIT 1) AS image_url
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE p.stock_quantity > 0
      AND p.is_active = true
      AND (p.status = 'active' OR p.status IS NULL)
    ORDER BY p.stock_quantity DESC, p.id
    LIMIT $1
  `, [limit]);
  return rows;
}

// Creates the campaign coupon, or reuses it if it already exists with the same discount.
// Refuses to reuse a coupon that is inactive, expired, or has a different discount —
// otherwise the email would promote a code that doesn't work at checkout.
export async function ensureClearanceCoupon({ code, discountPercent, validDays }) {
  const normalizedCode = code.trim().toUpperCase();
  const { rows: existing } = await db.query('SELECT * FROM coupons WHERE UPPER(code) = $1', [normalizedCode]);

  if (existing.length > 0) {
    const coupon = existing[0];
    if (coupon.discount_type !== 'percentage' || Number(coupon.discount_value) !== Number(discountPercent)) {
      throw new Error(`Coupon ${coupon.code} already exists with a different discount. Choose another code.`);
    }
    if (!coupon.is_active || (coupon.expiration_date && new Date(coupon.expiration_date) < new Date())) {
      throw new Error(`Coupon ${coupon.code} already exists but is inactive or expired. Choose another code.`);
    }
    return { coupon, created: false };
  }

  const expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);
  const { rows } = await db.query(`
    INSERT INTO coupons (code, discount_type, discount_value, expiration_date, usage_limit, minimum_purchase_amount, is_active)
    VALUES ($1, 'percentage', $2, $3, NULL, NULL, true)
    RETURNING *
  `, [normalizedCode, discountPercent, expiresAt]);
  return { coupon: rows[0], created: true };
}
