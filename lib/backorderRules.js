// Pre-orders (backorders): the rules the storefront, the cart and the order API share.
// No dependencies, so it runs in the browser and on the server alike.
//
// A product with `allow_backorder` can be bought past its shelf stock, up to
// `backorder_limit` units owed to customers at once. Product APIs send
// `backorderable`: how many more units may be pre-ordered right now (0 when the
// product doesn't take pre-orders). Pre-ordered units leave the warehouse
// `backorder_lead_days` working days after the order, once the stock arrives.

export const DEFAULT_BACKORDER_LEAD_DAYS = 10; // working days, about two weeks
export const DEFAULT_BACKORDER_LIMIT = 10;

// Days added to a late pre-order's promised date when we tell the customer it slipped
export const BACKORDER_DELAY_DAYS = 5;

const count = (value) => Math.max(0, Math.floor(Number(value) || 0));

// Units on the shelf now
export const shelfStock = (product) => count(product?.stock_quantity ?? product?.stockQuantity);

// Units that may still be pre-ordered
export const backorderable = (product) => count(product?.backorderable);

// The most a customer can put in the bag
export const orderableQty = (product) => shelfStock(product) + backorderable(product);

// How many of `quantity` units would be pre-ordered rather than sent from the shelf
export const preorderUnits = (product, quantity) => Math.max(0, count(quantity) - shelfStock(product));

// Nothing on the shelf, but it can be pre-ordered
export const isPreorderOnly = (product) => shelfStock(product) === 0 && backorderable(product) > 0;

export const leadDays = (product) => count(product?.backorder_lead_days) || DEFAULT_BACKORDER_LEAD_DAYS;

// Pre-orders are paid up front: a customer who waited weeks is likelier to refuse a parcel at the door
export const COD_PREORDER_MESSAGE = 'Cash on delivery isn\'t available for pre-order items. Please pay by card or Tabby.';
