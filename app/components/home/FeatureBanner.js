'use client';

import Image from 'next/image';
import { Container } from '../ui/Container';
import { useAppContext } from '../../context/AppContext';
import { useHomepageImage } from '../../hooks/useHomepageImages';
import { headingFont, Pill } from './SectionHeading';
import { slugify } from '@/lib/slugify';

const LAVENDER = 'rgb(147,104,236)';

function Copy({ eyebrow, title, text, cta, dark }) {
  return (
    <div className="grid gap-3 md:gap-3.5 max-w-[520px]">
      {eyebrow && (
        <span className="text-[11.5px] font-semibold tracking-[0.14em] uppercase" style={{ color: dark ? '#d8c8ff' : LAVENDER }}>
          {eyebrow}
        </span>
      )}
      <h2 className={`${headingFont} text-[25px] md:text-[42px] font-medium uppercase leading-[1.1] text-balance ${dark ? 'text-white' : 'text-[#111114]'}`}>
        {title}
      </h2>
      {text && <p className={`max-w-[40ch] text-[14px] md:text-[15px] leading-relaxed ${dark ? 'text-white/80' : 'text-[#4a4a52]'}`}>{text}</p>}
      {cta && <Pill href={cta.href} variant={dark ? 'light' : 'solid'} className="mt-1.5">{cta.label}</Pill>}
    </div>
  );
}

/**
 * A full-width campaign photo shown whole (never cropped), with the copy on
 * its empty side: over the photo on desktop, in a matching panel above it on
 * phones. Photos come from Admin → Homepage images (`desktopSlot` / `mobileSlot`),
 * so they can be replaced without a deploy; `bg` / `mobileBg` match each photo's
 * empty edge so the copy panel blends in.
 */
export function FeatureBanner({ desktopSlot, mobileSlot, tone = 'light', bg, mobileBg, mobileTrimTop = 0, ...copy }) {
  const desktop = useHomepageImage(desktopSlot);
  const mobile = useHomepageImage(mobileSlot);
  const dark = tone === 'dark';

  return (
    <section aria-label={copy.title} className="relative">
      {/* Desktop: the photo, with the copy on its empty left side */}
      <div className="hidden md:block relative" style={{ background: bg }}>
        <Image src={desktop.src} alt={desktop.alt} width={1584} height={672} sizes="100vw" className="w-full h-auto" />
        <div className="absolute inset-0 flex items-center">
          <Container wide className="w-full"><Copy {...copy} dark={dark} /></Container>
        </div>
      </div>
      {/* Phones: copy panel, then the photo */}
      <div className="md:hidden" style={{ background: mobileBg || bg }}>
        {/* The panel carries its own background, so a gradient ends exactly where the photo starts */}
        <div style={{ background: mobileBg || bg }}>
          <Container wide className="pt-9 pb-6"><Copy {...copy} dark={dark} /></Container>
        </div>
        {mobileTrimTop > 0 ? (
          // Drop the photo's empty top (a fraction of its height) so it sits close to the copy
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: `928 / ${Math.round(1152 * (1 - mobileTrimTop))}` }}>
            <Image src={mobile.src} alt={mobile.alt} fill sizes="100vw" className="object-cover object-bottom" />
          </div>
        ) : (
          <Image src={mobile.src} alt={mobile.alt} width={928} height={1152} sizes="100vw" className="w-full h-auto" />
        )}
      </div>
    </section>
  );
}

/**
 * A brand photo (Admin → Brands) as a full-bleed banner, the copy on the
 * right over a soft light wash; on phones the photo sits above the copy.
 */
export function BrandPhotoBanner({ brand: slugStart, eyebrow, title, text, ctaLabel }) {
  const { brands } = useAppContext();
  const brand = brands.find((b) => (b.slug || slugify(b.name)).startsWith(slugStart));
  if (!brand?.imageurl) return null;
  const href = `/brand/${brand.slug || slugify(brand.name)}`;
  const copy = { eyebrow, title, text, cta: { label: ctaLabel, href } };

  return (
    <section aria-label={title} className="relative">
      <div className="hidden md:flex relative min-h-[620px] items-center overflow-hidden">
        <Image src={brand.imageurl} alt={brand.name} fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(270deg,rgba(255,250,244,0.92)_0%,rgba(255,250,244,0.6)_38%,rgba(255,250,244,0)_62%)]" />
        <Container wide className="relative w-full flex justify-end"><Copy {...copy} /></Container>
      </div>
      <div className="md:hidden bg-[#fbf6ef]">
        <div className="relative aspect-[4/3]">
          <Image src={brand.imageurl} alt={brand.name} fill sizes="100vw" className="object-cover" />
        </div>
        <Container wide className="pt-7 pb-10"><Copy {...copy} /></Container>
      </div>
    </section>
  );
}
