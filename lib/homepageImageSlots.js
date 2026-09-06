// Registry of homepage editorial images that aren't already sourced from an
// existing admin-managed table (products, categories, brands, hero slides,
// social posts all already have their own admin pages). Each slot has a
// stable `key`, a human label for the admin UI, the static asset the
// homepage falls back to when no override has been uploaded, and the alt
// text used on the homepage <Image>.
//
// Shared between app/api/homepage-images (public read), app/api/admin/homepage-images
// (admin read/write), app/admin/homepage/page.jsx, and
// app/components/home/NayaLumiereHome.js.
export const HOMEPAGE_IMAGE_SLOTS = [
  {
    key: 'routine_treat',
    label: 'Build-a-routine — "Treat" step photo',
    section: 'Build a routine',
    fallbackUrl: '/design-home/routine-treat.jpg',
    alt: 'Applying the eye treatment with a spatula',
  },
];

export function getSlot(key) {
  return HOMEPAGE_IMAGE_SLOTS.find((s) => s.key === key) || null;
}
