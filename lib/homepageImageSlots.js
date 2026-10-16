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
  {
    key: 'signature_banner',
    label: 'Signature banner — photo',
    section: 'Signature selection banner',
    fallbackUrl: '/engin-akyurt-g-m8EDc4X6Q-unsplash.jpg',
    alt: 'A professional facial treatment in progress',
  },
  {
    key: 'gernetic_range_desktop',
    label: 'GERnétic range banner — desktop (wide, about 2.4 : 1)',
    section: 'GERnétic range banner',
    fallbackUrl: '/home/gernetic-range-desktop.jpg',
    alt: 'The GERnétic range: Immuno, Glyco, Synchro, GER Lift, LIFT Crème and Melano 50+',
  },
  {
    key: 'gernetic_range_mobile',
    label: 'GERnétic range banner — phone (portrait, about 4 : 5)',
    section: 'GERnétic range banner',
    fallbackUrl: '/home/gernetic-range-mobile.jpg',
    alt: 'GERnétic Synchro, Glyco, Cold Cream and Démaquillant Douceur with their boxes',
  },
  {
    key: 'perfumes_banner_desktop',
    label: 'Perfumes banner — desktop (wide, about 2.4 : 1, dark left side)',
    section: 'Naya Lumière Perfumes banner',
    fallbackUrl: '/home/perfumes-desktop.jpg',
    alt: 'Ousaima, Timashki and DNA perfumes by Naya Lumière on a stone ledge',
  },
  {
    key: 'perfumes_banner_mobile',
    label: 'Perfumes banner — phone (portrait, about 4 : 5)',
    section: 'Naya Lumière Perfumes banner',
    fallbackUrl: '/home/perfumes-mobile.jpg',
    alt: 'DNA, Timashki and Ousaima perfumes by Naya Lumière',
  },
];

export function getSlot(key) {
  return HOMEPAGE_IMAGE_SLOTS.find((s) => s.key === key) || null;
}
