import ExcelJS from 'exceljs';
import db from './db.js';

// Product performance report: page views (product_views, written by the storefront's
// view beacon) next to what was ordered, for a date range in Dubai time.
// getProductReport() gathers the numbers; buildProductReportWorkbook() turns them into .xlsx.

const TZ = 'Asia/Dubai';

// Orders that count as sales: open and delivered orders, not cancelled or failed payments
const SALES_LINES = `
  SELECT o.id AS order_id, oi.product_id, oi.quantity, oi.price
    FROM orders o JOIN order_items oi ON oi.order_id = o.id
   WHERE o.created_at >= $1 AND o.created_at < $2
     AND LOWER(COALESCE(o.order_status, '')) NOT IN ('cancelled', 'payment failed')
  UNION ALL
  SELECT o.id, oi.product_id, oi.quantity, oi.price
    FROM delivered_orders o JOIN delivered_order_items oi ON oi.order_id = o.id
   WHERE o.created_at >= $1 AND o.created_at < $2`;

const CANCELLED_LINES = `
  SELECT o.id AS order_id, oi.product_id, oi.quantity
    FROM cancelled_orders o JOIN cancelled_order_items oi ON oi.order_id = o.id
   WHERE o.created_at >= $1 AND o.created_at < $2`;

const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));

/**
 * `from` and `to` are 'YYYY-MM-DD' days in Dubai time, both included.
 * Returns { from, to, viewsTrackedSince, totals, products } with one row per product.
 */
export async function getProductReport({ from, to }) {
  if (!isDate(from) || !isDate(to) || from > to) throw new Error('Choose a valid date range.');

  // Day boundaries in Dubai time, as instants
  const { rows: [range] } = await db.query(
    `SELECT ($1::date)::timestamp AT TIME ZONE '${TZ}' AS start, ($2::date + 1)::timestamp AT TIME ZONE '${TZ}' AS "end"`,
    [from, to]
  );
  const params = [range.start, range.end];

  // The storefront beacon creates this table on first use
  await db.query(`
    CREATE TABLE IF NOT EXISTS product_views (
      id BIGSERIAL PRIMARY KEY, product_id INTEGER NOT NULL, visitor_id TEXT NOT NULL,
      session_id TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);

  const [products, views, sales, cancelled, totals, tracking] = await Promise.all([
    db.query(`
      SELECT p.id, p.name, p.price, p.stock_quantity, p.is_active,
             COALESCE(b.name, '') AS brand,
             COALESCE((SELECT string_agg(c.name, ', ' ORDER BY c.name)
                         FROM category_products cp JOIN categories c ON c.id = cp.category_id
                        WHERE cp.product_id = p.id), '') AS categories
        FROM products p LEFT JOIN brands b ON b.id = p.brand_id`),
    db.query(`
      SELECT product_id, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors
        FROM product_views WHERE created_at >= $1 AND created_at < $2
       GROUP BY product_id`, params),
    db.query(`
      SELECT product_id, COUNT(DISTINCT order_id) AS orders, SUM(quantity) AS units, SUM(quantity * price) AS sales
        FROM (${SALES_LINES}) l GROUP BY product_id`, params),
    db.query(`
      SELECT product_id, SUM(quantity) AS units FROM (${CANCELLED_LINES}) l GROUP BY product_id`, params),
    db.query(`
      SELECT (SELECT COUNT(*) FROM product_views WHERE created_at >= $1 AND created_at < $2) AS views,
             (SELECT COUNT(DISTINCT visitor_id) FROM product_views WHERE created_at >= $1 AND created_at < $2) AS visitors,
             (SELECT COUNT(DISTINCT order_id) FROM (${SALES_LINES}) l) AS orders,
             (SELECT COALESCE(SUM(quantity), 0) FROM (${SALES_LINES}) l) AS units,
             (SELECT COALESCE(SUM(quantity * price), 0) FROM (${SALES_LINES}) l) AS sales,
             (SELECT COUNT(DISTINCT order_id) FROM (${CANCELLED_LINES}) l) AS cancelled_orders`, params),
    db.query(`SELECT MIN(created_at) AS since FROM product_views`),
  ]);

  const byId = (rows) => new Map(rows.map((r) => [Number(r.product_id), r]));
  const viewMap = byId(views.rows);
  const salesMap = byId(sales.rows);
  const cancelMap = byId(cancelled.rows);

  const rows = products.rows.map((p) => {
    const v = viewMap.get(p.id) || {};
    const s = salesMap.get(p.id) || {};
    const visitors = Number(v.visitors || 0);
    const orders = Number(s.orders || 0);
    return {
      id: p.id,
      name: p.name,
      brand: p.brand,
      categories: p.categories,
      active: p.is_active !== false,
      price: Number(p.price || 0),
      stock: Number(p.stock_quantity || 0),
      views: Number(v.views || 0),
      visitors,
      orders,
      units: Number(s.units || 0),
      sales: Math.round(Number(s.sales || 0) * 100) / 100,
      cancelledUnits: Number(cancelMap.get(p.id)?.units || 0),
      // Share of people who viewed it that went on to order it; null when nobody viewed it
      conversion: visitors > 0 ? Math.min(orders / visitors, 1) : null,
    };
  });

  const t = totals.rows[0];
  return {
    from,
    to,
    viewsTrackedSince: tracking.rows[0]?.since || null,
    totals: {
      views: Number(t.views),
      visitors: Number(t.visitors),
      orders: Number(t.orders),
      units: Number(t.units),
      sales: Math.round(Number(t.sales) * 100) / 100,
      cancelledOrders: Number(t.cancelled_orders),
    },
    products: rows,
  };
}

/** Most viewed first, then most ordered: products with at least one view. */
export const mostViewed = (report) => report.products
  .filter((p) => p.views > 0)
  .sort((a, b) => b.views - a.views || b.visitors - a.visitors || b.units - a.units);

/** Most units first, then sales: products ordered at least once. */
export const mostOrdered = (report) => report.products
  .filter((p) => p.units > 0)
  .sort((a, b) => b.units - a.units || b.sales - a.sales || b.orders - a.orders);

// ── Excel ───────────────────────────────────────────────────────────────────

const PURPLE = 'FF9333EA';
const LAVENDER = 'FFF8F0FF';
const INK = 'FF1F1235';
const MUTED = 'FF6B7280';
const BORDER = 'FFE9D5FF';

const FMT = {
  int: '#,##0',
  aed: '"AED "#,##0.00',
  pct: '0.0%',
};

const dubaiDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ });
const dubaiDateTime = (d) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ });

// A product table: styled header, frozen header row, filters, formats per column
function addTable(wb, name, columns, rows, { note } = {}) {
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: note ? 3 : 1 }] });
  ws.columns = columns.map((c) => ({ key: c.key, width: c.width }));

  let headerRow = 1;
  if (note) {
    ws.getCell('A1').value = note;
    ws.getCell('A1').font = { italic: true, size: 10, color: { argb: MUTED } };
    ws.mergeCells(1, 1, 1, columns.length);
    headerRow = 3;
  }

  const header = ws.getRow(headerRow);
  columns.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PURPLE } };
    cell.alignment = { vertical: 'middle', horizontal: c.numeric ? 'right' : 'left', wrapText: true };
  });
  header.height = 30;

  rows.forEach((r, idx) => {
    const row = ws.getRow(headerRow + 1 + idx);
    columns.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      cell.value = c.value(r, idx);
      if (c.fmt) cell.numFmt = c.fmt;
      if (c.numeric) cell.alignment = { horizontal: 'right' };
      cell.border = { bottom: { style: 'thin', color: { argb: BORDER } } };
    });
    if (idx % 2 === 1) row.eachCell({ includeEmpty: true }, (cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LAVENDER } }; });
  });

  ws.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow + Math.max(rows.length, 1), column: columns.length } };
  return ws;
}

const COL = {
  rank: { header: 'Rank', key: 'rank', width: 7, numeric: true, value: (_, i) => i + 1 },
  product: { header: 'Product', key: 'name', width: 46, value: (r) => r.name },
  brand: { header: 'Brand', key: 'brand', width: 24, value: (r) => r.brand },
  categories: { header: 'Categories', key: 'categories', width: 30, value: (r) => r.categories },
  views: { header: 'Page views', key: 'views', width: 12, numeric: true, fmt: FMT.int, value: (r) => r.views },
  visitors: { header: 'Unique visitors', key: 'visitors', width: 14, numeric: true, fmt: FMT.int, value: (r) => r.visitors },
  orders: { header: 'Orders', key: 'orders', width: 10, numeric: true, fmt: FMT.int, value: (r) => r.orders },
  units: { header: 'Units sold', key: 'units', width: 11, numeric: true, fmt: FMT.int, value: (r) => r.units },
  sales: { header: 'Sales (item prices)', key: 'sales', width: 18, numeric: true, fmt: FMT.aed, value: (r) => r.sales },
  conversion: { header: 'Viewers who ordered', key: 'conversion', width: 15, numeric: true, fmt: FMT.pct, value: (r) => r.conversion },
  cancelled: { header: 'Units cancelled', key: 'cancelledUnits', width: 13, numeric: true, fmt: FMT.int, value: (r) => r.cancelledUnits },
  price: { header: 'Current price', key: 'price', width: 15, numeric: true, fmt: FMT.aed, value: (r) => r.price },
  stock: { header: 'In stock', key: 'stock', width: 10, numeric: true, fmt: FMT.int, value: (r) => r.stock },
  status: { header: 'Status', key: 'active', width: 10, value: (r) => (r.active ? 'Active' : 'Hidden') },
};

/** Resolves to the .xlsx file as a Buffer. */
export async function buildProductReportWorkbook(report) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Naya Lumière Cosmetics';
  wb.created = new Date();

  const viewed = mostViewed(report);
  const ordered = mostOrdered(report);
  const period = `${dubaiDate(`${report.from}T12:00:00Z`)} – ${dubaiDate(`${report.to}T12:00:00Z`)}`;
  const trackingNote = report.viewsTrackedSince
    ? `Page views are counted since ${dubaiDate(report.viewsTrackedSince)}; earlier days have no view data.`
    : 'No page views have been recorded yet.';

  // Summary
  const ws = wb.addWorksheet('Summary');
  ws.columns = [{ width: 34 }, { width: 22 }, { width: 4 }, { width: 46 }, { width: 14 }];
  ws.getCell('A1').value = 'Naya Lumière Cosmetics · Product performance';
  ws.getCell('A1').font = { bold: true, size: 16, color: { argb: INK } };
  ws.getCell('A2').value = `${period} (Dubai time)`;
  ws.getCell('A2').font = { size: 11, color: { argb: PURPLE } };
  ws.getCell('A3').value = `Generated ${dubaiDateTime(new Date())}`;
  ws.getCell('A3').font = { size: 10, color: { argb: MUTED } };

  const kpis = [
    ['Product page views', report.totals.views, FMT.int],
    ['Unique visitors to product pages', report.totals.visitors, FMT.int],
    ['Orders', report.totals.orders, FMT.int],
    ['Units sold', report.totals.units, FMT.int],
    ['Sales (item prices, before order discounts)', report.totals.sales, FMT.aed],
    ['Cancelled orders', report.totals.cancelledOrders, FMT.int],
    ['Products viewed', viewed.length, FMT.int],
    ['Products ordered', ordered.length, FMT.int],
  ];
  kpis.forEach(([label, value, fmt], i) => {
    const r = 5 + i;
    ws.getCell(`A${r}`).value = label;
    ws.getCell(`A${r}`).font = { color: { argb: MUTED } };
    ws.getCell(`B${r}`).value = value;
    ws.getCell(`B${r}`).numFmt = fmt;
    ws.getCell(`B${r}`).font = { bold: true, color: { argb: INK } };
    ws.getCell(`B${r}`).alignment = { horizontal: 'right' };
  });

  const topList = (startRow, title, list, valueOf, fmt) => {
    ws.getCell(`D${startRow}`).value = title;
    ws.getCell(`D${startRow}`).font = { bold: true, color: { argb: PURPLE } };
    if (!list.length) {
      ws.getCell(`D${startRow + 1}`).value = 'Nothing in this period';
      ws.getCell(`D${startRow + 1}`).font = { italic: true, color: { argb: MUTED } };
    }
    list.slice(0, 5).forEach((p, i) => {
      ws.getCell(`D${startRow + 1 + i}`).value = `${i + 1}. ${p.name}`;
      ws.getCell(`E${startRow + 1 + i}`).value = valueOf(p);
      ws.getCell(`E${startRow + 1 + i}`).numFmt = fmt;
      ws.getCell(`E${startRow + 1 + i}`).alignment = { horizontal: 'right' };
    });
  };
  topList(5, 'Top 5 most viewed (page views)', viewed, (p) => p.views, FMT.int);
  topList(12, 'Top 5 most ordered (units)', ordered, (p) => p.units, FMT.int);

  const notes = [
    trackingNote,
    'Orders include open and delivered orders. Cancelled orders and failed payments are left out of sales and shown separately.',
    '"Viewers who ordered" = orders ÷ unique visitors to that product page in the period.',
    'Sales use each item\'s price on the order, before order-level discount codes, so they can be higher than what was paid.',
  ];
  ws.getCell('A19').value = 'Notes';
  ws.getCell('A19').font = { bold: true, color: { argb: INK } };
  notes.forEach((n, i) => {
    const cell = ws.getCell(`A${20 + i}`);
    cell.value = `• ${n}`;
    cell.font = { size: 10, color: { argb: MUTED } };
    ws.mergeCells(20 + i, 1, 20 + i, 5);
  });

  addTable(wb, 'Most viewed',
    [COL.rank, COL.product, COL.brand, COL.categories, COL.views, COL.visitors, COL.orders, COL.units, COL.conversion, COL.price, COL.stock],
    viewed, { note: `${period}. ${trackingNote}` });

  addTable(wb, 'Most ordered',
    [COL.rank, COL.product, COL.brand, COL.categories, COL.units, COL.orders, COL.sales, COL.cancelled, COL.views, COL.conversion, COL.price, COL.stock],
    ordered, { note: `${period}. Open and delivered orders; sales at item prices before order discounts.` });

  addTable(wb, 'All products',
    [COL.product, COL.brand, COL.categories, COL.status, COL.views, COL.visitors, COL.orders, COL.units, COL.sales, COL.cancelled, COL.conversion, COL.price, COL.stock],
    [...report.products].sort((a, b) => b.units - a.units || b.views - a.views || a.name.localeCompare(b.name)),
    { note: `${period}. Every product, including those with no views or orders in the period.` });

  return Buffer.from(await wb.xlsx.writeBuffer());
}
