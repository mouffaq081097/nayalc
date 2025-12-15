import React from 'react';

const ProductCardSkeleton = () => {
  return (
    <div className="group relative bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col mb-4 h-full animate-pulse">
      {/* Product Image Skeleton */}
      <div className="relative aspect-square overflow-hidden block p-4">
        <div className="w-full h-full bg-gray-200 rounded-md"></div>
      </div>

      {/* Product Info Skeleton */}
      <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
        <div>
          {/* Brand and Category Skeleton */}
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          
          {/* Product Name Skeleton */}
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>

          {/* Rating Skeleton */}
          <div className="flex items-center gap-2 mt-2">
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-4 w-8 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Price Skeleton */}
        <div className="flex items-center gap-2 mt-4">
          <div className="h-6 w-1/2 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
