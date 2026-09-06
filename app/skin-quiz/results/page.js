'use client';

import React, { useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppContext } from '../../context/AppContext';
import ProductCard from '../../components/ProductCard';
import Link from 'next/link';
import { RotateCcw, ArrowRight, SearchX } from 'lucide-react';

const LAVENDER = 'rgb(147,104,236)';

/* ============================================================================
 * Real recommendation engine — replaces the old placeholder that grepped
 * product.description for substrings. Matches on real data instead:
 *  - concernIds come straight from the live `concerns` table (picked on the
 *    quiz itself), matched against each product's real product.concern_ids.
 *  - skin type adds one more real concern into the mix by name (Oily → any
 *    concern named "Oil Control", Dry → "Hydration", Sensitive →
 *    "Sensitivity & Redness"), rather than guessing from free text.
 *  - texture matches the real product.form field (Serum / Cream / Lotion).
 * Every in-stock product gets a score (0 if nothing matched) and the list is
 * sorted best-first, so there is always a ranked, real result — never a dead
 * "no products" page unless the whole catalog is empty.
 * ==========================================================================*/

const SKIN_TYPE_CONCERN_HINT = {
  Oily: /oil/i,
  Dry: /hydrat/i,
  Sensitive: /sensitiv|redness/i,
};

function useRecommendations(answers) {
  const { products, concerns } = useAppContext();

  return useMemo(() => {
    if (!products.length) return [];

    const targetConcernIds = new Set(answers.concernIds);
    const hint = SKIN_TYPE_CONCERN_HINT[answers.skinType];
    if (hint) {
      const match = concerns.find((c) => hint.test(c.name));
      if (match) targetConcernIds.add(match.id);
    }

    const inStock = products.filter((p) => Number(p.stock_quantity) > 0);
    const pool = inStock.length > 0 ? inStock : products;

    const scored = pool.map((p) => {
      const productConcernIds = (p.concern_ids || []).map(Number);
      const concernMatches = productConcernIds.filter((id) => targetConcernIds.has(id)).length;
      const textureMatch = answers.texture && p.form && p.form.toLowerCase().includes(answers.texture.toLowerCase());
      const score = concernMatches * 2 + (textureMatch ? 1 : 0);
      return { product: p, score };
    });

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ratingDiff = Number(b.product.averageRating || 0) - Number(a.product.averageRating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return Number(b.product.reviewCount || 0) - Number(a.product.reviewCount || 0);
    });

    return scored.slice(0, 8).map((s) => s.product);
  }, [products, concerns, answers]);
}

function SkinQuizResults() {
  const searchParams = useSearchParams();
  const { concerns, fetchProducts, products } = useAppContext();
  const router = useRouter();

  const answers = useMemo(() => {
    const concernIdsParam = searchParams.get('concernIds');
    return {
      skinType: searchParams.get('skinType'),
      concernIds: concernIdsParam ? concernIdsParam.split(',').map(Number).filter(Boolean) : [],
      texture: searchParams.get('texture'),
    };
  }, [searchParams]);

  useEffect(() => {
    if (products.length === 0) fetchProducts();
  }, [products.length, fetchProducts]);

  const concernLabels = useMemo(
    () => answers.concernIds.map((id) => concerns.find((c) => c.id === id)?.name).filter(Boolean),
    [answers.concernIds, concerns]
  );

  const isLoading = products.length === 0;
  const recommended = useRecommendations(answers);
  const hasAnyAnswer = answers.skinType || concernLabels.length > 0 || answers.texture;

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-2">Your consultation is ready</p>
          <h1 className="text-[28px] md:text-[32px] font-bold text-gray-900 leading-tight">Your personalized routine</h1>
          <p className="text-[14px] text-gray-500 mt-2 max-w-md mx-auto">
            Matched from our real catalog against what you told us — ranked by best fit first.
          </p>
        </div>

        {hasAnyAnswer && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {answers.skinType && (
              <span
                className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold text-white"
                style={{ background: LAVENDER }}
              >
                {answers.skinType} skin
              </span>
            )}
            {concernLabels.map((label) => (
              <span key={label} className="px-3.5 py-1.5 rounded-full text-[12px] font-medium text-gray-600 border border-gray-200">
                {label}
              </span>
            ))}
            {answers.texture && (
              <span className="px-3.5 py-1.5 rounded-full text-[12px] font-medium text-gray-600 border border-gray-200">
                Prefers {answers.texture.toLowerCase()}
              </span>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4.4] rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />
            ))}
          </div>
        ) : recommended.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommended.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                slug={product.slug}
                name={product.name}
                price={product.price}
                originalPrice={product.originalPrice}
                image={product.imageUrl}
                averageRating={product.averageRating}
                reviewCount={product.reviewCount}
                viewCount={product.viewCount}
                brandName={product.brandName}
                stock_quantity={product.stock_quantity}
                isBestseller={product.isBestseller}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center py-16 px-8 rounded-2xl border border-gray-200">
            <SearchX size={36} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">Nothing in stock just yet</h2>
            <p className="text-[13px] text-gray-500">Our catalog is being restocked — check back soon, or retake the quiz.</p>
          </div>
        )}

        <div className="text-center mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => router.push('/skin-quiz')}
            className="inline-flex items-center gap-1.5 h-11 px-6 rounded-full border border-gray-200 text-gray-600 text-[12.5px] font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            Retake the quiz
          </button>
          <Link
            href="/all-products"
            className="inline-flex items-center gap-1.5 h-11 px-6 rounded-full text-white text-[12.5px] font-semibold transition-opacity hover:opacity-90"
            style={{ background: LAVENDER }}
          >
            Shop everything
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SkinQuizResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh] bg-white">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(147,104,236,0.2)', borderTopColor: LAVENDER }} />
        </div>
      }
    >
      <SkinQuizResults />
    </Suspense>
  );
}
