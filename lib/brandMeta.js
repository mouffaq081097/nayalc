// Editorial metadata for known brands — shown on the /brands listing and the
// brand detail page. Brands not listed here (e.g. newly added in admin) fall
// back to the generic defaults wherever this is consumed.
export const BRAND_META = {
  'Gernetic': {
    origin: 'France',
    year: '1976',
    category: 'Advanced Skincare',
    tags: ['Clinical', 'Bio-cellular', 'Professional'],
    filterCategory: 'Advanced Skincare',
  },
  'Zorah': {
    origin: 'Canada',
    year: '2008',
    category: 'Natural Beauty',
    tags: ['Vegan', 'Cruelty-free', 'Organic'],
    filterCategory: 'Skincare',
  },
  'Naya Lumière Perfumes': {
    origin: 'UAE',
    year: '2021',
    category: 'Fragrance & Body',
    tags: ['Artisan', 'Luxury', 'Hand-crafted'],
    filterCategory: 'Fragrance & Body',
  },
};

export const DEFAULT_BRAND_META = {
  origin: 'International',
  year: '',
  category: 'Beauty',
  tags: ['Premium', 'Curated'],
  filterCategory: 'All',
};

export function getBrandMeta(brandName) {
  return BRAND_META[brandName] || DEFAULT_BRAND_META;
}
