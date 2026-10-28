'use client';

import Link from 'next/link';
import { Container } from '../ui/Container';
import { useAppContext } from '../../context/AppContext';
import { SectionHeading } from './SectionHeading';
import { useT } from '../../context/LocaleContext';

/**
 * The skin concerns from Admin → Concerns as a centred row of chips; each opens
 * All products already filtered (`?concern=slug`). Concerns no product is
 * tagged with are left out; the skin quiz ends the row.
 */
export function ShopByConcern() {
  const { concerns, products } = useAppContext();
  const t = useT();

  const tagged = new Set();
  products.forEach((p) => (p.concern_ids || []).forEach((id) => tagged.add(Number(id))));
  const shown = concerns.filter((c) => tagged.has(Number(c.id)));
  if (shown.length < 3) return null;

  const chip = 'rounded-full px-5 py-3 text-[13.5px] md:text-[14px] font-medium transition-colors';

  return (
    <section className="py-8 md:py-12 bg-white">
      <Container wide>
        <SectionHeading title="Shop by concern" />
        <ul className="flex flex-wrap justify-center gap-2 md:gap-2.5">
          {shown.map((c) => (
            <li key={c.id}>
              <Link
                href={`/all-products?concern=${encodeURIComponent(c.slug || c.id)}`}
                className={`${chip} inline-block border border-[#e7e6e2] text-[#111114] hover:border-[#111114]`}
              >
                {t(c.name)}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/skin-quiz" className={`${chip} inline-block bg-[#111114] text-white hover:bg-[#2a2a31]`}>
              {t('Not sure? Take the skin quiz')}
            </Link>
          </li>
        </ul>
      </Container>
    </section>
  );
}
