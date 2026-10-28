'use client';

import { useContext, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Star, ShoppingBag } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { FranceFlag } from '../MadeInFranceBadge';
import { UAEFlag } from '../MadeInUAEBadge';
import { formatAED, viewCountLabel } from '../../lib/utils';
import { getDeliveryInfo, getPreorderInfo } from '@/lib/shipping';
import { shortBrand } from '@/lib/seo';
import { orderableQty, isPreorderOnly, shelfStock, leadDays } from '@/lib/backorderRules';

const LAVENDER = 'rgb(147,104,236)';

// Catalogue names repeat the brand the card already shows
// ("GLYCO by Gernetic: Nourishing…" → "GLYCO Nourishing…"); the full name stays on the product page.
export const cardName = (name = '') => name.replace(/\s+by\s+gern[eé]tic\s*:?/i, '').trim();

/**
 * The homepage product panel (after Pitaka): a portrait off-white panel with
 * the name and brand top-left, the discount tag top-right, the photo centred,
 * the bag button bottom-left and the price bottom-right. Under it, the same
 * live facts as ProductCard: real views this month (from 5 up), the delivery
 * range or pre-order date, and "Only N left".
 * `tone="dark"` recolours those facts for a black band.
 * `variant="gallery"` (the GERnétic section, after Pitaka's Explore card): a large name
 * with the price under it and the origin flag top-right and a round black bag button bottom-right, inside the panel on
 * every screen size; from md up thin ( ) arrows on hover flip through the product's photos.
 * On phones the cards sit one at a time in GalleryCarousel (HomeShelves.js).
 */
export function HomeProductCard({ product, tone = 'light', variant = 'panel' }) {
  const { addToCart } = useContext(CartContext);
  const [added, setAdded] = useState(false);
  const [photo, setPhoto] = useState(0);
  const dark = tone === 'dark';
  const gallery = variant === 'gallery';
  const photos = (product.imageUrls?.length ? product.imageUrls : [product.imageUrl]).filter(Boolean);
  const shown = photos[photo % (photos.length || 1)] || product.imageUrl || '/placeholder-image.jpg';
  const flip = (step) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPhoto((i) => (i + step + photos.length) % photos.length);
  };

  const price = Number(product.price) || 0;
  const was = Number(product.originalPrice) || 0;
  const onSale = was > price;
  const preorder = isPreorderOnly(product);
  const canBuy = orderableQty(product) > 0;
  const brand = product.brandName || '';
  const isFrench = /gern[eé]t/i.test(brand);
  const isEmirati = /naya\s*lumi[eè]re\s*perfumes?/i.test(brand);
  const rating = Number(product.averageRating) || 0;
  const hasReviews = Number(product.reviewCount) > 0 && rating > 0;
  const href = `/product/${product.slug || product.id}`;
  const views = Number(product.viewCount) || 0;
  const stock = shelfStock(product);
  const lowStock = stock > 0 && stock < 5;
  // Cards only render once products load on the client, so the date can't mismatch the server HTML
  const arrives = stock > 0 ? getDeliveryInfo().rangeLabel : '';
  const shipsBy = preorder ? getPreorderInfo(leadDays(product)).shipByLabel : '';

  const onAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // CartContext reads snake_case stock
    const ok = addToCart({ ...product, stock_quantity: product.stock_quantity ?? product.stockQuantity }, 1);
    if (ok === false) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  // No discount badge — the struck-through old price shows the saving
  const tag = !canBuy ? 'Sold out' : preorder ? 'Pre-order' : null;

  // Everything sits inside the panel from md up; on phones the panel holds the
  // photo with the bag and price below it, and the name and brand sit underneath.

  const nameEl = (cls, color = 'text-[#111114]') => <p className={`${color} font-semibold leading-[1.25] line-clamp-2 ${cls}`}>{cardName(product.name)}</p>;
  const brandEl = (cls, color = 'text-[#6b6b73]') => (
    <p className={`flex items-center gap-1.5 ${color} min-w-0 ${cls}`}>
      <span className="truncate">{shortBrand(brand)}</span>
      {isFrench && <FranceFlag title="Made in France" />}
      {isEmirati && <UAEFlag title="Made in the UAE" />}
    </p>
  );
  const bagEl = canBuy ? (
    <button
      type="button"
      onClick={onAdd}
      aria-label={preorder ? `Pre-order ${product.name}` : `Add ${product.name} to bag`}
      className="relative after:absolute after:-inset-1 w-8 h-8 shrink-0 rounded-full border-[1.2px] border-[#111114] text-[#111114] bg-white/0 flex items-center justify-center transition-colors hover:bg-[#111114] hover:text-white md:group-hover:bg-[#111114] md:group-hover:text-white"
    >
      {added ? <Check size={15} strokeWidth={2} /> : <ShoppingBag size={14} strokeWidth={1.75} />}
    </button>
  ) : <span />;
  const priceEl = (
    <p className="text-right text-[14px] font-semibold leading-tight text-[#111114]">
      {formatAED(price)}
      {onSale && <span className="block text-[11.5px] font-normal text-[#6b6b73] line-through">{formatAED(was)}</span>}
    </p>
  );

  return (
    <Link href={href} className="group block h-full min-w-0">
      <div className={`relative bg-[#f6f5f2] flex flex-col ${gallery ? 'aspect-[3/4] p-5 md:p-[18px]' : 'md:aspect-[3/4] p-3 md:p-[18px]'}`}>
        {gallery ? (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[#111114] text-[24px] md:text-[20px] xl:text-[24px] leading-[1.2] tracking-tight line-clamp-2">{cardName(product.name)}</p>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] xl:text-[17px] text-[#111114]">
                {formatAED(price)}
                {onSale && <span className="text-[13px] text-[#6b6b73] line-through">{formatAED(was)}</span>}
                {tag && (
                  <span
                    className={`rounded-full px-2 py-[2px] text-[10.5px] font-semibold text-white ${!canBuy ? 'bg-gray-500' : ''}`}
                    style={canBuy ? { background: LAVENDER } : undefined}
                  >
                    {tag}
                  </span>
                )}
              </p>
            </div>
            {(isFrench || isEmirati) && (
              // Origin flag top-right, drawn larger than on the small cards
              <span className="shrink-0 mt-2 mr-2 scale-[1.6] origin-top-right">
                {isFrench ? <FranceFlag title="Made in France" /> : <UAEFlag title="Made in the UAE" />}
              </span>
            )}
          </div>
        ) : (
          <div className="hidden md:block">
            {nameEl('pr-14 text-[15px]')}
            {brandEl('mt-[3px] text-[12px]')}
          </div>
        )}
        {tag && (
          <span
            className={`absolute z-10 top-3 right-3 md:top-4 md:right-4 rounded-full px-2 py-[3px] text-[10.5px] font-semibold text-white ${!canBuy ? 'bg-gray-500' : ''} ${gallery ? 'hidden' : ''}`}
            style={canBuy ? { background: LAVENDER } : undefined}
          >
            {tag}
          </span>
        )}

        {/* On phones the photo keeps its own 3:4 box and the panel grows below it for the bag and price */}
        <div className={`relative ${gallery ? 'flex-1 min-h-0 mx-[12%] my-6 md:mx-[14%] md:my-8' : 'aspect-[3/4] mx-[6%] my-2 md:aspect-auto md:flex-1 md:min-h-0 md:mx-[8%] md:mt-3.5 md:mb-3'}`}>
          <Image
            src={gallery ? shown : product.imageUrl || '/placeholder-image.jpg'}
            alt={product.altText || `${product.name} - ${shortBrand(brand)}`}
            fill
            sizes="(max-width: 768px) 45vw, 23vw"
            className={`object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.04] ${canBuy ? '' : 'opacity-55'}`}
          />
        </div>

        {gallery && photos.length > 1 && (
          // Thin ( ) arrows, shown on hover, flip through the product's photos
          ['prev', 'next'].map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={flip(dir === 'prev' ? -1 : 1)}
              aria-label={dir === 'prev' ? 'Previous photo' : 'Next photo'}
              className={`hidden md:flex absolute top-1/2 -translate-y-1/2 ${dir === 'prev' ? 'left-3' : 'right-3'} w-9 h-14 items-center justify-center text-[#8a8a92] hover:text-[#111114] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity`}
            >
              <svg width="10" height="34" viewBox="0 0 10 34" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
                <path d={dir === 'prev' ? 'M8 1.5C2.5 8 2.5 26 8 32.5' : 'M2 1.5C7.5 8 7.5 26 2 32.5'} />
              </svg>
            </button>
          ))
        )}

        {gallery && canBuy && (
          // Bag button bottom-right
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onAdd}
              aria-label={preorder ? `Pre-order ${product.name}` : `Add ${product.name} to bag`}
              className="w-11 h-11 shrink-0 rounded-full bg-[#111114] text-white flex items-center justify-center transition-colors hover:bg-[#2a2a31]"
            >
              {added ? <Check size={18} strokeWidth={2} /> : <ShoppingBag size={17} strokeWidth={1.75} />}
            </button>
          </div>
        )}

        {!gallery && (
          <div className="flex items-end justify-between gap-2">
            {bagEl}
            {priceEl}
          </div>
        )}
      </div>

      {/* Phones: the text under the photo (the gallery card keeps it inside the panel) */}
      <div className={`${gallery ? 'hidden' : 'md:hidden'} pt-3 px-0.5`}>
        {nameEl('text-[13.5px]', dark ? 'text-white' : undefined)}
        {brandEl('mt-1 text-[12px]', dark ? 'text-[#a1a1aa]' : undefined)}
      </div>

      <div className={`pt-2.5 px-0.5 grid gap-0.5 text-[12px] ${dark ? 'text-[#a1a1aa]' : 'text-[#6b6b73]'}`}>
        {hasReviews && (
          <span className="flex items-center gap-1">
            <Star size={12} className="fill-[#f5b301] text-[#f5b301]" />
            {rating.toFixed(1)} <span className="opacity-70">({product.reviewCount})</span>
          </span>
        )}
        {views >= 5 && (
          <span className={`font-medium ${dark ? 'text-[#4ade80]' : 'text-[#15803d]'}`}>{viewCountLabel(views)} viewed this month</span>
        )}
        {(arrives || shipsBy) && (
          <span>
            {arrives ? 'Arrives ' : 'Ships by '}
            <b className={`font-semibold ${dark ? 'text-white' : 'text-[#111114]'}`}>{arrives || shipsBy}</b>
          </span>
        )}
        {lowStock && <span className={`font-semibold ${dark ? 'text-[#fbbf24]' : 'text-[#b45309]'}`}>Only {stock} left</span>}
      </div>
    </Link>
  );
}
