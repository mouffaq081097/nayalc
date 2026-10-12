// Product page palette — taken from the homepage sections (BestSellers,
// Categories, BuildYourRoutine, HeroSection) so the two read as one store:
// white sections, gray-900 headings, gray-50 image wells, one lavender accent.
// Literal values rather than var(--cl-*) so a scoped override (admin) can never
// leak into the storefront.
export const LAVENDER = 'rgb(147,104,236)';        // homepage accent: links, active states, buttons
export const LAVENDER_HOVER = '#7e69e6';           // hero button hover tone
export const LAVENDER_LIGHT = 'rgba(147,104,236,0.10)';
export const LAVENDER_SOFT = 'rgb(216,180,254)';   // hero dots / highlights
export const INK = '#111827';                      // gray-900, homepage headings
export const BORDER = '#e5e7eb';                   // gray-200, homepage card borders
export const DIVIDER = '#f3f4f6';                  // gray-100
export const WELL = '#f9fafb';                     // gray-50, homepage image wells

/** Whole dirhams render bare, anything else keeps its fils: AED 120, AED 89.50. */
export function aed(value) {
  const n = Number(value) || 0;
  return `AED ${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

/** Primary button — the homepage lavender, deepening to the hero's hover tone. */
export const BUTTON = 'text-white bg-[rgb(147,104,236)] hover:bg-[#7e69e6] disabled:hover:bg-[rgb(147,104,236)]';

/** Section heading pair used on every homepage section (BestSellers, Categories…). */
export const EYEBROW = 'text-[11px] font-medium tracking-[0.18em] uppercase text-gray-400';
export const SECTION_TITLE = 'text-[28px] md:text-[32px] font-bold text-gray-900 leading-tight';
