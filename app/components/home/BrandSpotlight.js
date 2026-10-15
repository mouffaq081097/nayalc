'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Container } from '../ui/Container';
import { useAppContext } from '../../context/AppContext';
import { headingFont } from './SectionHeading';
import { HomeProductCard } from './HomeProductCard';
import { ProductRow } from './ProductRow';
import { slugify } from '@/lib/slugify';
import { orderableQty } from '@/lib/backorderRules';

const LAVENDER = 'rgb(147,104,236)';

/**
 * A brand as a magazine spread on a light grey band: a tall photo on one
 * side, the brand's story and its three leading products on the other. `align`
 * puts the photo left or right, so consecutive spreads alternate. The photo is
 * the brand's own image from Admin → Brands, swappable without a deploy.
 *
 * `brand` is the start of the brand's slug ("gernetic" → gernetic-international).
 * The whole active range is listed, buyable products first and sold-out ones
 * last (their cards say so). The section hides itself under three products.
 */
export function BrandSpotlight({ brand: slugStart, eyebrow, title, text, cta, align = 'left' }) {
  const { brands, products } = useAppContext();
  const brand = brands.find((b) => (b.slug || slugify(b.name)).startsWith(slugStart));
  if (!brand) return null;

  const items = products
    .filter((p) => Number(p.brand_id) === Number(brand.id))
    .sort((a, b) => (Number(orderableQty(b) > 0) - Number(orderableQty(a) > 0)) || (Number(b.totalSold || 0) - Number(a.totalSold || 0)));
  if (items.length < 3) return null;

  const href = `/brand/${brand.slug || slugify(brand.name)}`;
  const photoRight = align === 'right';

  return (
    <section className="py-10 md:py-16 bg-[#f7f7f8]">
      <Container>
        <div className={`grid gap-6 md:gap-10 lg:gap-14 items-stretch ${photoRight ? 'md:grid-cols-[7fr_5fr]' : 'md:grid-cols-[5fr_7fr]'}`}>
          {/* Photo */}
          <div className={`relative aspect-[4/3] md:aspect-auto md:min-h-[560px] rounded-[28px] overflow-hidden bg-gray-200 ${photoRight ? 'md:order-2' : ''}`}>
            {brand.imageurl && (
              <Image src={brand.imageurl} alt={brand.name} fill sizes="(max-width: 768px) 100vw, 42vw" className="object-cover" />
            )}
            <span className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-gray-900">
              {eyebrow}
            </span>
          </div>

          {/* Story + products */}
          <div className="flex flex-col justify-center min-w-0">
            <h2 className={`${headingFont} text-[34px] md:text-[46px] font-medium leading-[1.02] text-[#1f1235]`}>{title}</h2>
            <p className="mt-3 max-w-lg text-[14.5px] md:text-[15.5px] leading-relaxed text-gray-600">{text}</p>
            <Link
              href={href}
              className="mt-5 inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 text-[13px] font-medium text-white bg-gray-900 transition-colors hover:bg-gray-700"
            >
              {cta} <ArrowRight size={15} />
            </Link>

            {/* Phones: swipe the whole range */}
            <div className="mt-7 md:hidden">
              <ProductRow products={items} onTint />
            </div>
            {/* Desktop: the three leading products */}
            <div className="hidden md:grid mt-9 grid-cols-3 gap-4 lg:gap-5">
              {items.slice(0, 3).map((p) => (
                <HomeProductCard key={p.id} product={p} onTint />
              ))}
            </div>
            {items.length > 3 && (
              <Link href={href} className="hidden md:inline-flex mt-6 w-fit items-center gap-1.5 text-[13px] font-medium transition-opacity hover:opacity-70" style={{ color: LAVENDER }}>
                See all {items.length} products <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
