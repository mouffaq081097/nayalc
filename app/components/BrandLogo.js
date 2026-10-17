import Image from 'next/image';

const LOTUS_SRC = '/Adobe Express - file (5).png';
// Cut from the old white logo: a light lotus with see-through lines, for dark backgrounds
const LOTUS_LIGHT_SRC = '/naya-lotus-white.png';
const TRACKING = '0.22em';

// "responsive" steps up at md; "sm" stays compact (e.g. the mobile menu)
const SIZES = {
  responsive: {
    gap: 'gap-[9px] md:gap-[11px]',
    lotus: 'w-[24px] h-[21px] md:w-[30px] md:h-[26px]',
    name: 'text-[15px] md:text-[18px]',
    sub: 'text-[7px] md:text-[8px]',
  },
  sm: {
    gap: 'gap-[9px]',
    lotus: 'w-[24px] h-[21px]',
    name: 'text-[15px]',
    sub: 'text-[7px]',
  },
};

/**
 * Naya Lumière Cosmetics lockup: the lotus mark at its true 405:352 proportions,
 * the name in the site's clean sans (Inter, regular, widely spaced capitals) and
 * "COSMETICS" spread to exactly the name's width. `tone="light"` draws it white
 * (the header over the homepage hero). Wrap it in a Link; it carries its own
 * accessible name.
 */
export default function BrandLogo({ size = 'responsive', tone = 'dark', priority = false, className = '' }) {
  const s = SIZES[size] || SIZES.responsive;
  const light = tone === 'light';
  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <span className="sr-only">Naya Lumière Cosmetics</span>
      <Image
        src={light ? LOTUS_LIGHT_SRC : LOTUS_SRC}
        alt=""
        aria-hidden="true"
        width={32}
        height={28}
        priority={priority}
        draggable={false}
        className={`${s.lotus} shrink-0 object-contain select-none`}
      />
      <span aria-hidden="true" className={`inline-grid gap-[4px] transition-colors duration-300 ${light ? 'text-white' : 'text-[#111114]'}`}>
        {/* Negative right margin cancels the trailing letter-spacing so both lines end together */}
        <span
          className={`font-sans ${s.name} font-normal leading-none whitespace-nowrap`}
          style={{ letterSpacing: TRACKING, marginRight: `-${TRACKING}` }}
        >
          NAYA LUMIÈRE
        </span>
        <span className={`font-sans ${s.sub} flex justify-between font-normal leading-none ${light ? 'text-white/70' : 'text-[#6b6b75]'}`}>
          {'COSMETICS'.split('').map((letter, i) => <span key={i}>{letter}</span>)}
        </span>
      </span>
    </span>
  );
}
