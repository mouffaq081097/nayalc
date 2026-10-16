import Link from 'next/link';
import { Montserrat } from 'next/font/google';

// The storefront's display face: uppercase Montserrat for section titles,
// banner headlines and the closing line, after Pitaka's clean wide sans.
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

// For banner headlines that sit outside SectionHeading but should match it
export const headingFont = montserrat.className;

const LAVENDER = 'rgb(147,104,236)';

/**
 * The header every homepage section shares: a big centred uppercase title,
 * an optional small lavender eyebrow above it and an optional text link (or
 * any `action`, e.g. a toggle) beneath. `tone="dark"` is for black bands.
 */
export function SectionHeading({ eyebrow, title, href, linkLabel, external = false, action, tone = 'light' }) {
  const dark = tone === 'dark';
  return (
    <div className="mb-8 md:mb-12 flex flex-col items-center text-center gap-3">
      {eyebrow && (
        <p className="text-[11.5px] font-semibold tracking-[0.14em] uppercase" style={{ color: dark ? '#d8c8ff' : LAVENDER }}>
          {eyebrow}
        </p>
      )}
      <h2 className={`${montserrat.className} text-[24px] md:text-[38px] font-medium uppercase tracking-[0.02em] leading-[1.15] text-balance ${dark ? 'text-white' : 'text-[#111114]'}`}>
        {title}
      </h2>
      {action}
      {!action && href && linkLabel && (
        <Link
          href={href}
          {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
          className={`text-[13px] font-medium underline underline-offset-4 transition-colors ${dark ? 'text-white/80 decoration-white/30 hover:decoration-white' : 'text-gray-700 decoration-gray-300 hover:decoration-gray-900'}`}
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

/**
 * The outlined pill button used across the homepage: `dark` (ink outline on
 * white), `light` (white outline on photos and black bands) or `solid` (ink fill).
 */
export function Pill({ href, children, variant = 'dark', external = false, className = '' }) {
  const styles = {
    dark: 'border-[#111114] text-[#111114] hover:bg-[#111114] hover:text-white',
    light: 'border-white text-white hover:bg-white hover:text-[#111114]',
    solid: 'border-[#111114] bg-[#111114] text-white hover:bg-[#2a2a31] hover:border-[#2a2a31]',
  };
  return (
    <Link
      href={href}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      className={`inline-flex w-fit items-center justify-center h-10 px-6 rounded-full border-[1.5px] text-[13px] font-semibold transition-colors ${styles[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
