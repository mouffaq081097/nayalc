'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Container } from '../ui/Container';
import { useAppContext } from '../../context/AppContext';
import { SectionHeading } from './SectionHeading';
import { orderableQty } from '@/lib/backorderRules';
import { byBest } from '@/lib/ritualRules';
import { useT } from '../../context/LocaleContext';

/**
 * The skin concerns from Admin → Concerns as round photo tiles, like the
 * collection strip: each shows its best-selling product and how many products
 * it has, and opens All products filtered to it (`?concern=slug`). Concerns no
 * product is tagged with are left out; the skin quiz ends the row. Swipes on
 * phones, centred on desktop.
 */
export function ShopByConcern() {
  const { concerns, products } = useAppContext();
  const t = useT();

  const tiles = concerns
    .map((c) => {
      const tagged = products.filter((p) => (p.concern_ids || []).map(Number).includes(Number(c.id)));
      const lead = [...tagged].filter((p) => p.imageUrl).sort((a, b) => (Number(orderableQty(b) > 0) - Number(orderableQty(a) > 0)) || byBest(a, b))[0];
      return { ...c, count: tagged.length, image: lead?.imageUrl || c.image_url };
    })
    .filter((c) => c.count > 0);
  if (tiles.length < 3) return null;

  const tile = 'group flex w-[84px] md:w-[112px] flex-col items-center text-center';
  const circle = 'relative w-[72px] h-[72px] md:w-[96px] md:h-[96px] rounded-full overflow-hidden ring-1 ring-transparent transition-all duration-300 group-hover:ring-[#111114]';

  return (
    <section className="py-8 md:py-12 bg-white">
      <Container wide>
        <SectionHeading title="Shop by concern" />
        <ul className="flex gap-3 md:gap-6 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:justify-center">
          {tiles.map((c) => (
            <li key={c.id} className="snap-start shrink-0">
              <Link href={`/all-products?concern=${encodeURIComponent(c.slug || c.id)}`} className={tile}>
                <span className={`${circle} bg-[#f6f5f2]`}>
                  {c.image && (
                    <Image src={c.image} alt="" fill sizes="(min-width: 768px) 96px, 72px"
                      className="object-contain p-2.5 md:p-3 mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.08]" />
                  )}
                </span>
                <span className="mt-2.5 text-[12.5px] md:text-[13.5px] leading-tight text-[#111114] line-clamp-2">{t(c.name)}</span>
                <span className="mt-1 text-[11px] md:text-[11.5px] text-[#6b6b73]">{t(c.count === 1 ? '{n} product' : '{n} products', { n: c.count })}</span>
              </Link>
            </li>
          ))}
          <li className="snap-start shrink-0">
            <Link href="/skin-quiz" className={tile}>
              <span className={`${circle} bg-[#111114] text-white flex items-center justify-center px-2 text-[11.5px] md:text-[13px] font-semibold leading-tight`}>
                {t('Skin quiz')}
              </span>
              <span className="mt-2.5 text-[12.5px] md:text-[13.5px] leading-tight text-[#111114]">{t('Not sure?')}</span>
              <span className="mt-1 text-[11px] md:text-[11.5px] text-[#6b6b73]">{t('Find your routine')}</span>
            </Link>
          </li>
        </ul>
      </Container>
    </section>
  );
}
