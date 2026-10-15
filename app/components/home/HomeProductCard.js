'use client';

import { useContext, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Check, Star, Truck } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { FranceFlag } from '../MadeInFranceBadge';
import { UAEFlag } from '../MadeInUAEBadge';
import { formatAED, viewCountLabel } from '../../lib/utils';
import { getDeliveryInfo, getPreorderInfo } from '@/lib/shipping';
import { shortBrand } from '@/lib/seo';
import { headingFont } from './SectionHeading';
import { orderableQty, isPreorderOnly, shelfStock, leadDays } from '@/lib/backorderRules';

const LAVENDER = 'rgb(147,104,236)';

/**
 * The homepage card: photo in a square, rounded frame, then a boutique-label stack
 * (lavender brand, serif name, price), then the same live facts as the full
 * ProductCard — real views this month, the delivery range (or pre-order ship
 * date) and stock when it's running low.
 */
// `onTint`: the card sits on a grey band, so its frame turns white to stay visible
export function HomeProductCard({ product, onTint = false }) {
  const { addToCart } = useContext(CartContext);
  const [added, setAdded] = useState(false);

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

  return (
    <Link href={href} className="group block h-full text-center">
      <div
        className={`relative aspect-square rounded-[20px] overflow-hidden ${onTint ? 'bg-white' : 'bg-[#f5f5f6]'} transition-shadow duration-300 group-hover:shadow-[0_14px_30px_-16px_rgba(17,17,24,0.30)]`}
      >
        <Image
          src={product.imageUrl || '/placeholder-image.jpg'}
          alt={product.altText || `${product.name} - ${shortBrand(brand)}`}
          fill
          sizes="(max-width: 768px) 46vw, (max-width: 1280px) 23vw, 240px"
          className={`object-contain p-5 md:p-6 mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.04] ${canBuy ? '' : 'opacity-60'}`}
        />

        {!canBuy ? (
          <span className="absolute top-3 left-3 rounded-full px-2 py-[3px] text-[10.5px] font-semibold text-white bg-gray-500">
            Sold out
          </span>
        ) : (onSale || preorder) && (
          <span
            className="absolute top-3 left-3 rounded-full px-2 py-[3px] text-[10.5px] font-semibold text-white"
            style={{ background: LAVENDER }}
          >
            {preorder ? 'Pre-order' : `−${saving}%`}
          </span>
        )}

        {canBuy && (
          <button
            type="button"
            onClick={onAdd}
            aria-label={preorder ? `Pre-order ${product.name}` : `Add ${product.name} to bag`}
            className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center text-white bg-gray-900 shadow-[0_4px_12px_rgba(17,17,24,0.25)] transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            {added ? <Check size={17} strokeWidth={2.25} /> : <Plus size={18} strokeWidth={2.25} />}
          </button>
        )}
      </div>

      <div className="pt-3.5 px-1 flex flex-col items-center">
        <p className="flex items-center justify-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-gray-500">
          <span className="truncate">{shortBrand(brand)}</span>
          {isFrench && <FranceFlag title="Made in France" />}
          {isEmirati && <UAEFlag title="Made in the UAE" />}
        </p>
        <p className={`${headingFont} mt-1 text-[17px] md:text-[18px] font-medium leading-[1.2] text-[#1f1235] line-clamp-2`}>
          {product.name}
        </p>
        <p className="mt-1.5 flex flex-wrap items-baseline justify-center gap-x-2">
          <span className="text-[14px] font-semibold text-gray-900">{formatAED(price)}</span>
          {onSale && <span className="text-[12px] text-gray-400 line-through">{formatAED(was)}</span>}
        </p>
        {hasReviews && (
          <p className="mt-1 flex items-center gap-1 text-[11.5px] text-gray-500">
            <Star size={12} className="fill-[#f5b301] text-[#f5b301]" />
            {rating.toFixed(1)} <span className="text-gray-400">({product.reviewCount})</span>
          </p>
        )}
        {views > 0 && (
          <p className="mt-1.5 text-[11.5px] font-medium text-emerald-700">{viewCountLabel(views)} viewed this month</p>
        )}
        {(arrives || shipsBy) && (
          <p className="mt-0.5 text-[11.5px] leading-snug text-gray-600">
            <Truck size={13} className="inline-block align-[-2px] mr-1 text-gray-400" />
            {arrives ? 'Arrives ' : 'Ships by '}
            <span className="font-semibold text-gray-900 whitespace-nowrap">{arrives || shipsBy}</span>
          </p>
        )}
        {lowStock && <p className="mt-0.5 text-[11px] font-semibold text-amber-700">Only {stock} left</p>}
      </div>
    </Link>
  );
}
