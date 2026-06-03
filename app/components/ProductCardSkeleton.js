import React from 'react';

const ProductCardSkeleton = () => {
  return (
    <div className="bg-white flex flex-col h-full animate-pulse" style={{ border: '1px solid #e8e8e8' }}>
      {/* Image area */}
      <div className="aspect-square bg-gray-100" />
      {/* Info area */}
      <div className="px-3 pt-3 pb-4 space-y-2">
        <div className="h-2 bg-gray-100 rounded w-1/4" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="flex gap-0.5 mt-1">
          {[...Array(5)].map((_, i) => <div key={i} className="w-2.5 h-2.5 bg-gray-100 rounded-sm" />)}
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
