/**
 * The wishlist of a shopper who isn't signed in: product ids kept in this
 * browser, like the signed-out bag (nayalc_guest_cart). GuestWishlistSync
 * (app/components/GuestWishlist.js) moves them into the account at sign-in.
 * Browser only.
 */
const KEY = 'nayalc_guest_wishlist';
const MAX = 100;
export const GUEST_WISHLIST_EVENT = 'nayalc:guest-wishlist';

export function readGuestWishlist() {
  try {
    const ids = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(ids) ? ids.map(Number).filter((n) => n > 0) : [];
  } catch {
    return [];
  }
}

function write(ids) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* private window: the hearts still work until the tab closes */ }
  window.dispatchEvent(new CustomEvent(GUEST_WISHLIST_EVENT, { detail: ids }));
}

export const isInGuestWishlist = (id) => readGuestWishlist().includes(Number(id));

/** Saves or removes a product; returns whether it is saved now. Newest first. */
export function toggleGuestWishlist(id) {
  const n = Number(id);
  const ids = readGuestWishlist();
  const next = ids.includes(n) ? ids.filter((x) => x !== n) : [n, ...ids].slice(0, MAX);
  write(next);
  return next.includes(n);
}

export const clearGuestWishlist = () => write([]);
