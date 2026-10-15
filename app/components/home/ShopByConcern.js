'use client';

import Link from 'next/link';
import { Container } from '../ui/Container';
import { useAppContext } from '../../context/AppContext';
import { SectionHeading, headingFont } from './SectionHeading';

/**
 * The skin concerns from Admin → Concerns, each with how many products treat
 * it. A concern opens All products already filtered (`?concern=slug`).
 * Concerns no product is tagged with are left out; a skin-quiz tile ends the grid.
 */
export function ShopByConcern() {
  const { concerns, products } = useAppContext();

  const counts = {};
  products.forEach((p) => (p.concern_ids || []).forEach((id) => { counts[id] = (counts[id] || 0) + 1; }));
  const shown = concerns.filter((c) => counts[c.id] > 0);
  if (shown.length < 3) return null;

  return (
    <section className="py-8 md:py-12 bg-white">
      <Container>
        <SectionHeading eyebrow="Find your match" title="Shop by Concern" href="/all-products" linkLabel="All products →" />
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-3">
          {shown.map((c) => (
            <li key={c.id}>
              <Link
                href={`/all-products?concern=${encodeURIComponent(c.slug || c.id)}`}
                className="group flex h-full flex-col justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 md:px-5 md:py-5 transition-colors hover:border-gray-400"
              >
                <span className={`${headingFont} text-[19px] md:text-[22px] font-medium leading-[1.1] text-[#1f1235]`}>{c.name}</span>
                <span className="text-[12px] text-gray-500 group-hover:text-[rgb(147,104,236)] transition-colors">
                  {/* A count only once it says "a choice", not "one item" */}
                  {counts[c.id] >= 3 ? `${counts[c.id]} products →` : 'Shop now →'}
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/skin-quiz"
              className="flex h-full flex-col justify-between gap-3 rounded-2xl px-4 py-4 md:px-5 md:py-5 text-white bg-gray-900 transition-colors hover:bg-gray-700"
            >
              <span className={`${headingFont} text-[19px] md:text-[22px] font-medium leading-[1.1]`}>Not sure?</span>
              <span className="text-[12px] text-[rgb(196,167,254)]">Three questions to your match →</span>
            </Link>
          </li>
        </ul>
      </Container>
    </section>
  );
}
