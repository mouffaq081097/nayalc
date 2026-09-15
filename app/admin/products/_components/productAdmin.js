// Shared helpers for the admin product list and product editor

// Matches the storefront, which shows "Only N left" below this many units
export const LOW_STOCK_THRESHOLD = 5;

export const fmtAed = (value) => `AED ${Number(value || 0).toFixed(2)}`;

export const brandName = (product) => (!product.brandName || product.brandName === 'null' ? '' : product.brandName);

export function productStatus(product) {
  if (product.is_active === false) return { id: 'hidden', label: 'Hidden', cls: 'sp-badge-neutral' };
  if (product.status === 'draft') return { id: 'draft', label: 'Draft', cls: 'sp-badge-info' };
  return { id: 'active', label: 'Active', cls: 'sp-badge-success' };
}

export function stockState(quantity) {
  const units = Number(quantity) || 0;
  if (units <= 0) {
    return { id: 'out', label: 'Out of stock', color: '#b42318', hint: "Out of stock — customers can't buy it." };
  }
  if (units < LOW_STOCK_THRESHOLD) {
    return { id: 'low', label: `${units} in stock`, color: '#8a6100', hint: `Low stock — the store shows "Only ${units} left".` };
  }
  return { id: 'ok', label: `${units} in stock`, color: 'var(--sp-text-secondary)', hint: 'In stock.' };
}

// fetchWithAuth throws "Request failed with status: 500, Body: {...}" — pull out the API's own message
export function apiErrorMessage(error, fallback) {
  const body = /Body: ([\s\S]*)$/.exec(error?.message || '')?.[1];
  try {
    return JSON.parse(body).message || fallback;
  } catch {
    return fallback;
  }
}
