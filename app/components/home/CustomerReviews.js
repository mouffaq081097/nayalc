'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Container } from '../ui/Container';
import { SectionHeading } from './SectionHeading';
import { cardName } from './HomeProductCard';
import { useT } from '../../context/LocaleContext';

/**
 * "What customers say": real 4 and 5-star reviews with a comment, newest first,
 * one per product (lib/reviewHighlights.js, read by app/page.js, which passes
 * none until there are MIN_REVIEW_HIGHLIGHTS, so it never looks empty). Each
 * links to its product. Three across on desktop; phones swipe the cards.
 */
export function CustomerReviews({ reviews = [] }) {
  const t = useT();
  if (!reviews.length) return null;

  return (
    <section className="py-8 md:py-12 bg-white">
      <Container wide>
        <SectionHeading eyebrow="Real reviews" title="What customers say" />
        <ul className="grid grid-flow-col auto-cols-[85%] sm:auto-cols-[60%] md:grid-flow-row md:grid-cols-3 md:auto-cols-auto gap-3 md:gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory scroll-px-4 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {reviews.map((r, i) => {
            const href = `/product/${r.product.slug || r.product.id}#reviews`;
            // Desktop shows full rows of three (phones swipe them all)
            const extra = i >= Math.floor(reviews.length / 3) * 3;
            return (
              <li key={r.id} className={`snap-start min-w-0 ${extra ? 'md:hidden' : ''}`}>
                <figure className="h-full flex flex-col gap-4 bg-[#f6f5f2] p-5 md:p-6">
                  <span className="text-[16px] tracking-[2px] text-[#111114]" aria-label={t('{rating} out of 5 stars', { rating: r.rating })}>
                    {'★'.repeat(r.rating)}<span className="text-[#d6d6db]">{'★'.repeat(5 - r.rating)}</span>
                  </span>
                  <blockquote dir="auto" className="text-[15px] leading-relaxed text-[#111114] line-clamp-5">“{r.comment}”</blockquote>
                  <figcaption className="mt-auto grid gap-3">
                    <span className="text-[13px] text-[#6b6b73]"><bdi>{t(r.name)}</bdi></span>
                    <Link href={href} className="group flex items-center gap-3 border-t border-[#e6e4df] pt-3">
                      <span className="relative w-11 h-11 shrink-0 bg-white">
                        {r.product.imageUrl && <Image src={r.product.imageUrl} alt="" fill sizes="44px" className="object-contain p-1 mix-blend-multiply" />}
                      </span>
                      <span className="min-w-0 text-[13px] leading-snug text-[#111114] line-clamp-2 group-hover:underline underline-offset-2">
                        <bdi>{cardName(r.product.name)}</bdi>
                      </span>
                    </Link>
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
