/**
 * The returns facts the storefront repeats (product page promise, Shipping &
 * returns, FAQ). The binding wording is section 8 of the Terms (app/terms),
 * which reads these too, so the numbers can't drift apart.
 */

/** Unopened, sealed products can come back within this many days of delivery. */
export const RETURN_WINDOW_DAYS = 14;

/** Refunds go back to the original payment method within this many days of the return arriving. */
export const REFUND_WITHIN_DAYS = 14;
