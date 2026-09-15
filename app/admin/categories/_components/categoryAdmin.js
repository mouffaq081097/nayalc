// Shared helpers for the admin category list and category editor

// Lowercase letters, numbers and single hyphens — accents are dropped (Lumière → lumiere)
export const slugify = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .trim()
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

export const isValidSlug = (slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);

export function categoryStatus(category) {
  return category?.isActive === false
    ? { id: 'hidden', label: 'Hidden', cls: 'sp-badge-neutral' }
    : { id: 'visible', label: 'Visible', cls: 'sp-badge-success' };
}

export const productCount = (category) => Number(category.productsCount) || 0;
