'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Container } from '../ui/Container';
import { useAppContext } from '../../context/AppContext';
import { orderableQty } from '@/lib/backorderRules';
import { useT } from '../../context/LocaleContext';

const MAX = 10;
// The newest products in the shop (highest ids) mark their collections "New in"
const NEWEST = 3;

const byBest = (a, b) =>
  (Number(orderableQty(b) > 0) - Number(orderableQty(a) > 0)) ||
  (Number(!!b.isBestseller) - Number(!!a.isBestseller)) ||
  (Number(b.totalSold || 0) - Number(a.totalSold || 0));

/**
 * A quiet row of collections straight under the hero: each one shows its best
 * selling product's photo on a warm round tile, the name and how many products
 * it holds. Swipes sideways on phones; centred on desktop.
 */
// While the catalogue loads: the same row in grey, so the page doesn't move when it fills in
function StripPlaceholder() {
  return (
    <section aria-hidden="true" className="bg-white border-b border-[#ececec]">
      <Container wide>
        <ul className="flex gap-3 md:gap-6 overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0 py-5 md:py-7 md:justify-center animate-pulse motion-reduce:animate-none">
          {Array.from({ length: 7 }).map((_, i) => (
            <li key={i} className="shrink-0 flex w-[84px] md:w-[116px] flex-col items-center">
              <span className="w-[72px] h-[72px] md:w-[96px] md:h-[96px] rounded-full bg-[#f6f5f2]" />
              <span className="mt-2.5 h-3 w-14 bg-[#eeece8]" />
              <span className="mt-2 h-2.5 w-10 bg-[#f1efeb]" />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function CategoryStrip() {
  const { categories, products, loading } = useAppContext();
  const t = useT();
  if (loading && !products?.length) return <StripPlaceholder />;
  if (!categories?.length || !products?.length) return null;

  const newest = new Set(
    [...products].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, NEWEST).map((p) => Number(p.id))
  );

  const items = categories
    .filter((c) => !c.parentId && c.isActive !== false)
    .map((c) => {
      const inCat = products.filter((p) => (p.category_ids || []).map(Number).includes(Number(c.id)));
      const lead = [...inCat].filter((p) => p.imageUrl).sort(byBest)[0];
      return {
        id: c.id,
        name: c.name,
        href: `/collections/${c.slug || c.id}`,
        count: inCat.length,
        image: lead?.imageUrl || c.image_url,
        isNew: inCat.some((p) => newest.has(Number(p.id))),
      };
    })
    .filter((c) => c.count > 0 && c.image)
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX);

  if (items.length < 3) return null;

  return (
    <section aria-label={t('Shop by collection')} className="bg-white border-b border-[#ececec]">
      <Container wide>
        <ul className="flex gap-3 md:gap-6 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 py-5 md:py-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:justify-center-safe">
          {items.map((c) => (
            <li key={c.id} className="snap-start shrink-0">
              <Link href={c.href} className="group flex w-[84px] md:w-[116px] flex-col items-center text-center">
                <span className="relative w-[72px] h-[72px] md:w-[96px] md:h-[96px] rounded-full bg-[#f6f5f2] overflow-hidden ring-1 ring-transparent transition-all duration-300 group-hover:ring-[#111114]">
                  <Image
                    src={c.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 96px, 72px"
                    className="object-contain p-2.5 md:p-3 mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.08] group-hover:-translate-y-0.5"
                  />
                </span>
                <span className="mt-2.5 text-[12.5px] md:text-[13.5px] leading-tight text-[#111114] line-clamp-2">{t(c.name)}</span>
                {c.isNew ? (
                  <span className="mt-1 text-[10.5px] md:text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(147,104,236)]">{t('New in')}</span>
                ) : (
                  <span className="mt-1 text-[11px] md:text-[11.5px] text-[#6b6b73]">{t(c.count === 1 ? '{n} product' : '{n} products', { n: c.count })}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
