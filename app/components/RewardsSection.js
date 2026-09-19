'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Container } from './ui/Container';

// The photo is a render of the real Silver membership card (the same card the
// loyalty page renders in CSS) — so the copy panel is near-black (#0b0b0d)
// rather than white: the pale set in the photo and the dark panel read as one
// surface instead of a picture pasted next to a box.
//
// Below md the split would stack into two tall halves, so the photo goes
// full-bleed behind the card and the copy rides a near-black scrim at the
// bottom — the mirror of the signature banner's aubergine one higher up the
// page. Colours are literal classes, not interpolated constants, because
// Tailwind extracts class names by scanning this file as plain text.

export function RewardsSection() {
  return (
    <section className="py-4 bg-white">
      <Container>
        <div className="relative min-h-[360px] md:min-h-0 rounded-3xl md:rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

          {/* Photo — full-bleed behind the card on mobile, left half on desktop */}
          <div className="absolute inset-0 md:relative md:inset-auto md:aspect-auto md:min-h-[380px]">
            <Image
              src="/Gemini_Generated_Image_j5k32uj5k32uj5k3.jpg"
              alt="The Naya Lumière Silver membership card"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          {/* Copy — over the photo on mobile, right panel on desktop */}
          <div className="relative z-10 flex flex-col justify-end md:justify-center px-5 pt-20 pb-6 md:px-10 lg:px-14 md:py-12 bg-[linear-gradient(to_top,rgba(11,11,13,0.96)_0%,rgba(11,11,13,0.80)_46%,rgba(11,11,13,0)_100%)] md:bg-none md:bg-[#0b0b0d]">
            <p className="text-[10px] md:text-[11px] font-medium tracking-[0.18em] uppercase text-[rgb(196,167,254)]">
              Naya Rewards
            </p>
            <h2 className="mt-2 md:mt-3 text-[24px] md:text-[32px] lg:text-[38px] font-bold leading-tight text-white">
              Every Order Earns You More
            </h2>
            <p className="mt-2 md:mt-3 max-w-md text-[13px] md:text-[15px] leading-[1.5] md:leading-relaxed text-white/70">
              Collect points on everything you love — then rise from Silver to Diamond for faster points,
              free shipping and early access.
            </p>
            <Link
              href="/account/loyalty"
              className="mt-5 md:mt-7 inline-flex w-full md:w-fit items-center justify-center rounded-full md:rounded-none border border-white/60 bg-white/10 md:bg-transparent px-6 md:px-9 py-3 md:py-3.5 text-[13px] font-medium text-white transition-colors duration-300 hover:bg-white hover:text-black"
            >
              Explore Rewards
            </Link>
          </div>

        </div>
      </Container>
    </section>
  );
}
