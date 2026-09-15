'use client';

import Link from 'next/link';
import { Plus, Check } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const fmtAED = (n) =>
  `AED ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9869f7]/40';

export default function CartSuggestionCard({ product, inBag, onAdd, meta }) {
  const stock = product.stockQuantity ?? product.stock_quantity ?? 0;
  const soldOut = stock <= 0;
  const href = `/product/${product.id}`;

  let buttonLabel = `Add ${product.name} to bag`;
  if (inBag) buttonLabel = `${product.name} is in your bag`;
  else if (soldOut) buttonLabel = `${product.name} is sold out`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#e5e5ea] bg-white transition-[border-color,box-shadow] duration-200 hover:border-[#d6d6dd] hover:shadow-[0_10px_24px_-16px_rgba(17,17,20,0.35)]">
      {/* overflow-hidden + an absolutely positioned image stop tall product photos
          from growing the aspect-square box past a square */}
      <Link href={href} className={`relative block aspect-square overflow-hidden bg-[#f7f7f9] ${focusRing} focus-visible:ring-inset`}>
        <ImageWithFallback
          src={product.imageUrl}
          alt={product.name}
          className={`absolute inset-0 h-full w-full object-contain p-3 mix-blend-multiply transition-transform duration-300 group-hover:scale-[1.04] ${soldOut ? 'opacity-50' : ''}`}
        />
        {soldOut && (
          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10.5px] font-semibold text-[#5a5a64] shadow-sm">
            Sold out
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        {/* min-height keeps rows aligned when a product has no brand */}
        <p className="min-h-[1.35em] truncate text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#8a8a93]">
          {product.brand || ' '}
        </p>
        <Link
          href={href}
          className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug text-[#111114] underline-offset-2 hover:underline"
        >
          {product.name}
        </Link>
        {meta && <p className="mt-1 text-[11.5px] text-[#8a8a93]">{meta}</p>}

        <p className="mt-auto pt-2 text-[14px] font-semibold tabular-nums text-[#111114]">{fmtAED(product.price)}</p>

        <button
          type="button"
          onClick={() => onAdd(product)}
          disabled={soldOut || inBag}
          aria-label={buttonLabel}
          className={`mt-2.5 flex h-11 w-full items-center justify-center gap-1.5 rounded-full border text-[12.5px] font-semibold transition-colors lg:h-9 ${focusRing} ${
            inBag
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : soldOut
                ? 'cursor-not-allowed border-[#ececf0] bg-[#f3f3f5] text-[#a1a1aa]'
                : 'border-[#d9c8fb] text-[#7c3aed] hover:bg-[#f5f0fd] active:bg-[#ede3fd]'
          }`}
        >
          {inBag ? (
            <><Check size={14} strokeWidth={2.5} /> In your bag</>
          ) : soldOut ? (
            'Sold out'
          ) : (
            <><Plus size={14} strokeWidth={2.5} /> Add to bag</>
          )}
        </button>
      </div>
    </article>
  );
}
