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
 * `tone="dark"` recolours those facts for the black best-sellers band.
 */
export function HomeProductCard({ product, tone = 'light' }) {
  const { addToCart } = useContext(CartContext);
  const [added, setAdded] = useState(false);
  const dark = tone === 'dark';

  const price = Number(product.price) || 0;
  const was = Number(product.originalPrice) || 0;
  const onSale = was > price;
  const saving = onSale ? Math.round(((was - price) / was) * 100) : 0;
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

  const tag = !canBuy ? 'Sold out' : preorder ? 'Pre-order' : onSale ? `−${saving}%` : null;

  return (
    <Link href={href} className="group block h-full min-w-0">
      <div className="relative aspect-[2/3] md:aspect-[3/4] bg-[#f6f5f2] flex flex-col p-3 md:p-[18px]">
        <p className="pr-12 text-[13.5px] md:text-[15px] font-semibold leading-[1.25] text-[#111114] line-clamp-2">
          {cardName(product.name)}
        </p>
        <p className="mt-[3px] flex items-center gap-1.5 text-[11.5px] md:text-[12px] text-[#6b6b73] min-w-0">
          <span className="truncate">{shortBrand(brand)}</span>
          {isFrench && <FranceFlag title="Made in France" />}
          {isEmirati && <UAEFlag title="Made in the UAE" />}
        </p>
        {tag && (
          <span
            className={`absolute top-3 right-3 md:top-4 md:right-4 rounded-full px-2 py-[3px] text-[10.5px] font-semibold text-white ${!canBuy ? 'bg-gray-500' : ''}`}
            style={canBuy ? { background: LAVENDER } : undefined}
          >
            {tag}
          </span>
        )}

        <div className="relative flex-1 min-h-0 mx-[8%] mt-3.5 mb-3">
          <Image
            src={product.imageUrl || '/placeholder-image.jpg'}
            alt={product.altText || `${product.name} - ${shortBrand(brand)}`}
            fill
            sizes="(max-width: 768px) 45vw, (max-width: 1280px) 22vw, 280px"
            className={`object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.04] ${canBuy ? '' : 'opacity-55'}`}
          />
        </div>

        <div className="flex items-end justify-between gap-2">
          {canBuy ? (
            <button
              type="button"
              onClick={onAdd}
              aria-label={preorder ? `Pre-order ${product.name}` : `Add ${product.name} to bag`}
              className="w-8 h-8 shrink-0 rounded-full border-[1.2px] border-[#111114] text-[#111114] flex items-center justify-center transition-colors hover:bg-[#111114] hover:text-white group-hover:bg-[#111114] group-hover:text-white"
            >
              {added ? <Check size={15} strokeWidth={2} /> : <ShoppingBag size={14} strokeWidth={1.75} />}
            </button>
          ) : <span />}
          <p className="text-right text-[14px] font-semibold text-[#111114] leading-tight">
            {formatAED(price)}
            {onSale && <span className="block text-[11.5px] font-normal text-[#9a9aa2] line-through">{formatAED(was)}</span>}
          </p>
        </div>
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
