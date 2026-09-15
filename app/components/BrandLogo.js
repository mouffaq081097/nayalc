import Image from 'next/image';
import { Cormorant_Garamond } from 'next/font/google';

// Same options as the homepage so both share one set of font files
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const LOTUS_SRC = '/Adobe Express - file (5).png';
const TRACKING = '0.12em';

// "responsive" steps up at md; "sm" stays compact (e.g. the mobile menu)
const SIZES = {
  responsive: {
    gap: 'gap-[9px] md:gap-[11px]',
    lotus: 'w-[26px] h-[23px] md:w-[32px] md:h-[28px]',
    name: 'text-[16px] md:text-[19px]',
    sub: 'text-[7.5px] md:text-[8.5px]',
  },
  sm: {
    gap: 'gap-[9px]',
    lotus: 'w-[26px] h-[23px]',
    name: 'text-[16px]',
    sub: 'text-[7.5px]',
  },
};

/**
 * Naya Lumière Cosmetics lockup: the lotus mark at its true 405:352 proportions,
 * the name in Cormorant Garamond, and "COSMETICS" spread to exactly the name's width.
 * Wrap it in a Link for navigation; it carries its own accessible name.
 */
export default function BrandLogo({ size = 'responsive', priority = false, className = '' }) {
  const s = SIZES[size] || SIZES.responsive;
  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <span className="sr-only">Naya Lumière Cosmetics</span>
      <Image
        src={LOTUS_SRC}
        alt=""
        aria-hidden="true"
        width={32}
        height={28}
        priority={priority}
        draggable={false}
        className={`${s.lotus} shrink-0 object-contain select-none`}
      />
      <span aria-hidden="true" className="inline-grid gap-[3px] text-[#111114]">
        {/* Negative right margin cancels the trailing letter-spacing so both lines end together */}
        <span
          className={`${cormorant.className} ${s.name} font-medium leading-none whitespace-nowrap`}
          style={{ letterSpacing: TRACKING, marginRight: `-${TRACKING}` }}
        >
          NAYA LUMIÈRE
        </span>
        <span className={`${s.sub} flex justify-between font-medium leading-none text-[#6b6b75]`}>
          {'COSMETICS'.split('').map((letter, i) => <span key={i}>{letter}</span>)}
        </span>
      </span>
    </span>
  );
}
