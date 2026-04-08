import React from 'react';

const ProductCardSkeleton = () => {
  return (
    <div className="group relative bg-white rounded-[2rem] shadow-sm border border-[var(--cl-glass-border)] flex flex-col h-full animate-pulse">
      {/* Product Image Skeleton */}
      <div className="relative aspect-square overflow-hidden block p-6">
        <div className="w-full h-full bg-[var(--cl-bg-lavender)] rounded-2xl"></div>
      </div>

      {/* Product Info Skeleton */}
      <div className="p-6 space-y-4 flex-grow flex flex-col justify-between">
        <div>
          {/* Brand Skeleton */}
          <div className="flex justify-between items-center mb-2">
            <div className="h-2 bg-[var(--cl-bg-lavender)] rounded w-1/4"></div>
            <div className="h-2 bg-[var(--cl-bg-lavender)] rounded w-8"></div>
          </div>
          
          {/* Product Name Skeleton */}
          <div className="h-6 bg-[var(--cl-bg-lavender)] rounded w-3/4 mb-4"></div>

          {/* Price Skeleton */}
          <div className="flex justify-between items-end">
            <div className="space-y-2 w-1/2">
                <div className="h-5 bg-[var(--cl-bg-lavender)] rounded w-full"></div>
                <div className="h-2 bg-[var(--cl-bg-lavender)] rounded w-1/2"></div>
            </div>
            {/* Add Button Skeleton */}
            <div className="h-12 w-16 bg-[var(--cl-bg-lavender)] rounded-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
