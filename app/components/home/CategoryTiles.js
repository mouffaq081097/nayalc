'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Percent, Sparkles, Gift, Gem, ScanFace, Crown } from 'lucide-react';
import { Container } from '../ui/Container';
import { useAppContext } from '../../context/AppContext';

const LAVENDER = 'rgb(147,104,236)';

// Store-wide shortcuts, a slim line of links under the circles
const SHORTCUTS = [
  { label: 'Offers', href: '/sales', Icon: Percent },
  { label: 'New arrivals', href: '/new-arrivals', Icon: Sparkles },
  { label: 'Gift sets', href: '/gift-sets', Icon: Gift },
  { label: 'All brands', href: '/brands', Icon: Gem },
  { label: 'Skin quiz', href: '/skin-quiz', Icon: ScanFace },
  { label: 'Naya Rewards', href: '/loyalty', Icon: Crown },
];

// "Makeup Removal / Cleansing" → "Makeup Removal": labels stay one or two short lines
const tileLabel = (name) => name.split(' / ')[0];

/**
 * Category photos in lavender-ringed circles, one swipeable row, with the
 * store-wide shortcuts as a quiet line of links beneath — every main route is
 * one tap from the top of the page.
 */
export function CategoryTiles() {
  const { categories } = useAppContext();
  const shown = categories.filter((c) => Number(c.productsCount) > 0 && !c.parentId);

  return (
    <section aria-label="Shop by category" className="pt-7 pb-3 md:pt-11 md:pb-5 bg-white">
      <Container>
        <ul className="flex gap-4 md:gap-8 overflow-x-auto md:justify-center -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {shown.map((c) => (
            <li key={c.id} className="shrink-0">
              <Link href={`/collections/${c.slug || c.id}`} className="group flex flex-col items-center gap-2.5 w-[84px] md:w-[112px]">
                <span className="relative w-[76px] h-[76px] md:w-[104px] md:h-[104px] rounded-full p-[2px] bg-gray-200 transition-all duration-300 group-hover:scale-[1.04] group-hover:bg-[rgb(147,104,236)]">
                  <span className="relative block w-full h-full rounded-full overflow-hidden border-[3px] border-white bg-[#f5f5f6]">
                    {c.imageUrl && <Image src={c.imageUrl} alt="" fill sizes="104px" className="object-cover" />}
                  </span>
                </span>
                <span className="text-[12px] md:text-[13px] font-medium leading-tight text-center text-gray-900 line-clamp-2">{tileLabel(c.name)}</span>
              </Link>
            </li>
          ))}
        </ul>

        <nav aria-label="Shortcuts" className="mt-6 md:mt-8 flex gap-2 overflow-x-auto md:flex-wrap md:justify-center -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SHORTCUTS.map(({ label, href, Icon }) => (
            <Link
              key={href}
              href={href}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-2 text-[12.5px] font-medium text-gray-800 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <Icon size={14} strokeWidth={1.75} style={{ color: LAVENDER }} />
              {label}
            </Link>
          ))}
        </nav>
      </Container>
    </section>
  );
}
