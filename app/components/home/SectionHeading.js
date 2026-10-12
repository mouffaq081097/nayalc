import Link from 'next/link';
import { Cormorant_Garamond } from 'next/font/google';

// Same options as BrandLogo and the homepage, so all three share one set of font files
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
});

// For banner headlines that sit outside SectionHeading but should match it
export const headingFont = cormorant.className;

const LAVENDER = 'rgb(147,104,236)';

/**
 * The header every homepage section shares: a lavender eyebrow, a Cormorant
 * serif title (the Cloud Luxe heading face) and an optional link on the right.
 */
export function SectionHeading({ eyebrow, title, href, linkLabel, external = false }) {
  return (
    <div className="mb-5 md:mb-6 flex flex-row justify-between items-end gap-4">
      <div className="space-y-1.5 min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase" style={{ color: LAVENDER }}>
            {eyebrow}
          </p>
        )}
        <h2 className={`${cormorant.className} text-[32px] md:text-[42px] font-medium leading-[1.05] text-[#1f1235]`}>
          {title}
        </h2>
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
          className="shrink-0 whitespace-nowrap text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: LAVENDER }}
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
