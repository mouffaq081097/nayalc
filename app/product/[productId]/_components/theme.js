import { headingFont } from '../../../components/home/SectionHeading';

// Product page palette — taken from the homepage sections (BestSellers,
// Categories, HeroSection) so the two read as one store:
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
export const WELL = '#f6f5f2';                     // the warm off-white product panel used across the store

/** Whole dirhams render bare, anything else keeps its fils: AED 120, AED 89.50. */
export function aed(value) {
  const n = Number(value) || 0;
  return `AED ${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

/** Primary button — ink black, like every primary button on the storefront. */
export const BUTTON = 'text-white bg-[#111114] hover:bg-[#2a2a31] disabled:hover:bg-[#111114]';

/** Section heading pair, matching the homepage's SectionHeading (uppercase Montserrat). */
export const EYEBROW = 'text-[11.5px] font-semibold tracking-[0.14em] uppercase text-[rgb(147,104,236)]';
export const SECTION_TITLE = `${headingFont} text-[22px] md:text-[30px] font-medium uppercase leading-[1.15] text-[#111114]`;
