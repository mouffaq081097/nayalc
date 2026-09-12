// Shared slug generation so URLs built from a name (brand cards, nav links)
// always match what page lookups compute against — no DB column required.
//
// Combining-diacritical-marks block is built from numeric code points
// (rather than a \uXXXX regex escape) to keep this file plain ASCII.
const COMBINING_MARKS = new RegExp(
  '[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']',
  'g'
);

export function slugify(value) {
  return (value ?? '')
    .toString()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
