'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from './ui/Container';
import { getSlot } from '@/lib/homepageImageSlots';

// The photo is admin-chosen from /admin/homepage — either uploaded there or
// picked out of the Cloudinary library — and served through /api/homepage-images.
// Falls back to the shipped default asset until an admin sets one.
const SLOT_KEY = 'signature_banner';

// Deliberately the inverse of the rewards banner further down the page: copy on
// the left over a soft lavender (#f5f1fd) panel with a filled button, rather than
// copy on the right over near-black with an outlined one. Same block, mirrored —
// so the two read as one system instead of the same section twice.
//
// Below md that two-up split would stack into a tall photo sitting on an equally
// tall text box, so the photo goes full-bleed behind the card instead and the copy
// rides a scrim at the bottom — one editorial card rather than two slabs, and
// roughly a third less height. The scrim is deep aubergine here and near-black on
// the rewards banner, so the mirrored pairing survives the collapse. Because the
// photo is admin-swappable the scrim has to carry the contrast by itself: nearly
// opaque under the text, clearing only in the top third.
//
// Every colour is written out as a literal class (not an interpolated constant)
// because Tailwind extracts class names by scanning this file as plain text.

export function SignatureBanner() {
  const slot = getSlot(SLOT_KEY);
  const [override, setOverride] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/homepage-images')
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (!cancelled && data?.[SLOT_KEY]) setOverride(data[SLOT_KEY]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const imageSrc = override?.imageUrl || slot.fallbackUrl;
  const imageAlt = override?.altText || slot.alt;

  return (
    <section className="py-4 bg-white">
      <Container>
        <div className="relative min-h-[360px] md:min-h-0 rounded-3xl md:rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_1.15fr]">

          {/* Copy — over the photo on mobile, left panel on desktop */}
          <div className="relative z-10 flex flex-col justify-end md:justify-center px-5 pt-20 pb-6 md:px-10 lg:px-14 md:py-12 bg-[linear-gradient(to_top,rgba(59,7,100,0.96)_0%,rgba(59,7,100,0.82)_46%,rgba(59,7,100,0)_100%)] md:bg-none md:bg-[#f5f1fd]">
            <div className="flex items-center gap-2.5 md:gap-3">
              <span className="h-px w-5 md:w-7 bg-[rgb(216,180,254)] md:bg-[rgb(147,104,236)]" />
              <p className="text-[10px] md:text-[11px] font-medium tracking-[0.18em] uppercase text-[rgb(216,180,254)] md:text-[rgb(147,104,236)]">
                Professional skincare
              </p>
            </div>
            <h2 className="mt-2 md:mt-3 text-[24px] md:text-[32px] lg:text-[38px] font-bold leading-tight text-white md:text-gray-900">
              Salon Results, At Home
            </h2>
            <p className="mt-2 md:mt-3 max-w-md text-[13px] md:text-[15px] leading-[1.5] md:leading-relaxed text-white/75 md:text-gray-600">
              The GERnétic and Zorah formulas therapists reach for — clinical care,
              made simple enough for your everyday ritual.
            </p>
            <Link
              href="/SkinCare"
              className="mt-5 md:mt-7 inline-flex w-full md:w-fit items-center justify-center rounded-full md:rounded-none px-6 md:px-9 py-3 md:py-3.5 text-[13px] font-medium text-white bg-[rgb(147,104,236)] transition-opacity duration-300 hover:opacity-90"
            >
              Shop Skincare
            </Link>
          </div>

          {/* Photo — full-bleed behind the card on mobile, right half on desktop */}
          <div className="absolute inset-0 md:relative md:inset-auto md:aspect-auto md:min-h-[380px]">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 55vw"
              className="object-cover"
            />
          </div>

        </div>
      </Container>
    </section>
  );
}
