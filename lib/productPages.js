import { revalidatePath } from 'next/cache';

/**
 * Product pages are kept ready for 60 s (app/product/[productId]/page.js). After
 * a change in Admin (or a new review), rebuild them on their next visit instead
 * of waiting. All of them, since a product also appears on others' pages (sizes,
 * recommendations).
 */
export function refreshProductPages() {
  try {
    revalidatePath('/product/[productId]', 'page');
  } catch {
    // Outside a request (a script) there is no page cache to refresh
  }
}
