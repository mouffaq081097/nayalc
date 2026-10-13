import crypto from 'node:crypto';
import db from './db.js';
import { parsePhone } from './phone.js';
import { updateOrderStatus } from './orderStatus.js';
import { ensureBackorderColumns } from './backorders.js';

// OTO (tryoto.com) books the courier for an order. The admin sends an order with
// "Ship with OTO"; OTO creates the shipment from our pickup location and reports
// back on /api/oto/webhook as it moves, which fills in the tracking details and
// moves the order to Shipped and then Delivered.
//
// Environment:
//   OTO_REFRESH_TOKEN         OTO dashboard → Settings → Developers → API Integrations
//   OTO_PICKUP_LOCATION_CODE  the pickup location (warehouse) code set up in OTO
//   OTO_DELIVERY_OPTION_ID    optional — a specific delivery company; otherwise OTO's own rules pick one
//   OTO_WEBHOOK_SECRET        the secretKey the webhook was registered with (scripts/oto-register-webhook.mjs)
//   OTO_PACKAGE_WEIGHT_KG     optional, default 0.5
//   OTO_BOX_CM                optional "length x width x height", default 20x15x10

const OTO_API_BASE = process.env.OTO_API_BASE || 'https://api.tryoto.com/rest/v2';
const STORE_NAME = 'Naya Lumière Cosmetics';

export const isOtoConfigured = () => !!(process.env.OTO_REFRESH_TOKEN && process.env.OTO_PICKUP_LOCATION_CODE);

// OTO returns its error text under different keys depending on the endpoint
const otoError = (data, fallback) =>
  data?.otoErrorMessage || data?.errorMsg || data?.message || data?.error || fallback;

// The refresh token only buys an access token, which lasts about an hour. Keep it
// for the life of the server instance and get a new one a minute before it runs out.
let accessToken = null;

async function getAccessToken() {
  if (accessToken && accessToken.expiresAt > Date.now() + 60_000) return accessToken.token;
  const res = await fetch(`${OTO_API_BASE}/refreshToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: process.env.OTO_REFRESH_TOKEN }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error(otoError(data, `OTO sign-in failed (${res.status})`));
  accessToken = { token: data.access_token, expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000 };
  return accessToken.token;
}

export async function otoFetch(path, options = {}, retried = false) {
  const res = await fetch(`${OTO_API_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${await getAccessToken()}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  // A token OTO has revoked early: get a fresh one and try once more
  if (res.status === 401 && !retried) {
    accessToken = null;
    return otoFetch(path, options, true);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(otoError(data, `OTO API error ${res.status}`));
  return data;
}

// Checks the catalog first: ALTER TABLE locks the table even when the column already exists.
const OTO_COLUMNS = { oto_id: 'TEXT', oto_status: 'TEXT', oto_awb_url: 'TEXT', oto_updated_at: 'TIMESTAMPTZ' };
let columnsReady = null;
export function ensureOtoColumns() {
  columnsReady ??= (async () => {
    const { rows } = await db.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' AND column_name = ANY($1)",
      [Object.keys(OTO_COLUMNS)]
    );
    for (const [column, type] of Object.entries(OTO_COLUMNS)) {
      if (!rows.some(r => r.column_name === column)) {
        await db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS ${column} ${type}`);
      }
    }
  })().catch(error => {
    columnsReady = null;
    throw error;
  });
  return columnsReady;
}

const money = (value) => Math.round((parseFloat(value) || 0) * 100) / 100;

function packageSize() {
  const [length, width, height] = String(process.env.OTO_BOX_CM || '20x15x10').split(/\s*x\s*/i).map(Number);
  return { boxLength: length || 20, boxWidth: width || 15, boxHeight: height || 10 };
}

/**
 * Sends an open order to OTO and asks it to book the shipment.
 * Returns { status, body } — the HTTP status and JSON body for the caller.
 */
export async function createOtoShipment(orderId) {
  if (!isOtoConfigured()) {
    return { status: 503, body: { message: 'OTO is not set up yet. Add OTO_REFRESH_TOKEN and OTO_PICKUP_LOCATION_CODE to the environment.' } };
  }
  await ensureOtoColumns();
  await ensureBackorderColumns();

  const { rows } = await db.query(`
    SELECT o.id, o.awaiting_stock, o.payment_method, o.total_amount, o.subtotal, o.shipping_cost, o.created_at, o.oto_id, o.user_id,
           COALESCE(NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''), 'Customer') AS customer_name,
           u.email, ua.customer_phone, ua.address_line1, ua.address_line2, ua.shipping_address, ua.city, ua.state, ua.zip_code
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN user_addresses ua ON o.user_address_id = ua.id
    WHERE o.id = $1
  `, [orderId]);
  const order = rows[0];
  if (!order) return { status: 404, body: { message: 'Only open orders can be shipped. This order is not open.' } };
  if (order.awaiting_stock) return { status: 409, body: { message: 'This order is awaiting stock for a pre-order. It can be shipped once the stock is in.' } };
  if (order.oto_id) return { status: 409, body: { message: `This order is already with OTO (OTO ID ${order.oto_id}).` } };

  // The courier calls the customer, so a number they can't dial is worth stopping for
  const phone = parsePhone(order.customer_phone);
  if (!phone.ok) return { status: 400, body: { message: `The customer's phone number needs fixing before shipping: ${phone.reason}` } };
  const address = [order.address_line1 || order.shipping_address, order.address_line2].filter(Boolean).join(', ');
  if (!address || !order.city) return { status: 400, body: { message: 'This order has no complete shipping address.' } };

  const { rows: items } = await db.query(`
    SELECT oi.product_id, oi.quantity, oi.price, p.name, pi.image_url
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE
    WHERE oi.order_id = $1
  `, [orderId]);

  const total = money(order.total_amount);
  const isCod = order.payment_method === 'cashOnDelivery';

  const data = await otoFetch('/createOrder', {
    method: 'POST',
    body: JSON.stringify({
      orderId: String(order.id),
      createShipment: true,
      pickupLocationCode: process.env.OTO_PICKUP_LOCATION_CODE,
      ...(process.env.OTO_DELIVERY_OPTION_ID && { deliveryOptionId: process.env.OTO_DELIVERY_OPTION_ID }),
      payment_method: isCod ? 'cod' : 'paid',
      amount: total,
      // What the courier collects at the door
      amount_due: isCod ? total : 0,
      currency: 'AED',
      subtotal: money(order.subtotal),
      shippingAmount: money(order.shipping_cost),
      storeName: STORE_NAME,
      senderName: STORE_NAME,
      packageCount: 1,
      packageWeight: Number(process.env.OTO_PACKAGE_WEIGHT_KG) || 0.5,
      ...packageSize(),
      customer: {
        name: order.customer_name,
        email: order.email || '',
        mobile: phone.e164,
        address,
        district: order.state || '',
        city: order.city,
        country: 'AE',
        postcode: order.zip_code || '',
        refID: String(order.user_id),
      },
      items: items.map(item => ({
        productId: String(item.product_id),
        sku: String(item.product_id),
        name: item.name,
        price: money(item.price),
        rowTotal: money(item.price * item.quantity),
        quantity: item.quantity,
        image: item.image_url || '',
      })),
    }),
  });

  const otoId = data.otoId != null ? String(data.otoId) : null;
  await db.query(
    "UPDATE orders SET oto_id = $1, oto_status = 'sent', oto_updated_at = NOW(), updated_at = NOW() WHERE id = $2",
    [otoId, orderId]
  );
  return { status: 200, body: { message: 'Sent to OTO', otoId } };
}

// --- Webhook ---------------------------------------------------------------

// OTO statuses that mean the parcel has left us, and the one that means it arrived.
// Compared lowercase with anything but letters removed, so "outForDelivery",
// "out_for_delivery" and "Out For Delivery" are the same. Anything else (new,
// cancelled, returned…) is recorded on the order but changes nothing — a
// cancellation refunds the customer, so that stays an admin decision.
const SHIPPED = new Set(['pickedup', 'shipmentpickedup', 'intransit', 'shipmentintransit', 'shipmentinprogress', 'outfordelivery', 'arrivedatdestination', 'arrivedathub', 'atdestinationhub']);
const DELIVERED = new Set(['delivered', 'shipmentdelivered']);

const statusKey = (status) => String(status || '').toLowerCase().replace(/[^a-z]/g, '');

export function siteStatusFor(otoStatus) {
  const key = statusKey(otoStatus);
  if (DELIVERED.has(key)) return 'Delivered';
  if (SHIPPED.has(key)) return 'Shipped';
  return null;
}

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

/**
 * OTO signs "orderId:status:timestamp" with HMAC-SHA256 using the secretKey the
 * webhook was registered with, Base64-encoded, and puts it in the body.
 * Fails closed: this endpoint can mark orders delivered and pay out loyalty points.
 */
export function verifyOtoSignature(payload) {
  const secret = process.env.OTO_WEBHOOK_SECRET;
  if (!secret || !payload?.signature) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${payload.orderId}:${payload.status}:${payload.timestamp}`)
    .digest('base64');
  return safeEqual(expected, payload.signature);
}

/**
 * Applies an orderStatus webhook: records OTO's status and tracking details on the
 * order, then moves it to Shipped or Delivered when OTO says so.
 */
export async function handleOtoStatusUpdate(payload) {
  const orderId = parseInt(payload.orderId, 10);
  if (!Number.isInteger(orderId)) return { status: 200, body: { ignored: 'not one of our orders' } };
  await ensureOtoColumns();

  const trackingNumber = payload.trackingNumber || payload.dcTrackingNumber || null;
  const courierName = payload.deliveryCompany || null;
  const courierWebsite = payload.trackingUrl || null;

  const { rows } = await db.query(`
    UPDATE orders SET
      oto_status = $2,
      oto_awb_url = COALESCE($3, oto_awb_url),
      tracking_number = COALESCE($4, tracking_number),
      courier_name = COALESCE($5, courier_name),
      courier_website = COALESCE($6, courier_website),
      oto_updated_at = NOW()
    WHERE id = $1
    RETURNING order_status, tracking_number, courier_name, courier_website
  `, [orderId, payload.status || null, payload.printAWBURL || null, trackingNumber, courierName, courierWebsite]);

  // Already delivered or cancelled (and archived), or not an order of ours
  if (rows.length === 0) return { status: 200, body: { ignored: 'order is not open' } };

  const current = rows[0];
  const target = siteStatusFor(payload.status);
  if (!target) {
    if (!['new', 'sent', 'cancelled', 'canceled', 'returned'].includes(statusKey(payload.status))) {
      console.info(`OTO status "${payload.status}" for order ${orderId} has no site status — recorded only`);
    }
    return { status: 200, body: { recorded: payload.status } };
  }
  // OTO reports several steps between pickup and delivery; email the customer once per site status
  if (current.order_status === target) return { status: 200, body: { recorded: payload.status } };

  return updateOrderStatus(orderId, {
    status: target,
    trackingNumber: current.tracking_number,
    courierName: current.courier_name,
    courierWebsite: current.courier_website,
  });
}
