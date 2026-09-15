// Shared helpers for the admin brand list and brand editor

export function brandStatus(brand) {
  return brand?.is_active === false
    ? { id: 'hidden', label: 'Hidden', cls: 'sp-badge-neutral' }
    : { id: 'visible', label: 'Visible', cls: 'sp-badge-success' };
}

export const productCount = (brand) => Number(brand.productsCount) || 0;
