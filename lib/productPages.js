import { revalidatePath } from 'next/cache';

/**
 * Product pages are kept ready for an hour (app/product/[productId]/page.js). After
 * a change in Admin (or a new review), rebuild them on their next visit instead
 * of waiting. All of them, since a product also appears on others' pages (sizes,
 * recommendations). Also after an order or a restock, so stock ("Only 2 left",
 * sold out) never waits for the hour.
 */
export function refreshProductPages() {
  try {
    revalidatePath('/product/[productId]', 'page');
  } catch {
    // Outside a request (a script) there is no page cache to refresh
  }
}

/**
 * The homepage is kept ready for 10 minutes (app/page.js). After an admin change
 * to what it shows (hero slides, campaigns), rebuild it on its next visit.
 */
export function refreshHomepage() {
  try {
    revalidatePath('/');
  } catch {
    // Outside a request (a script) there is no page cache to refresh
  }
}
