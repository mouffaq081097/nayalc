import React, { useState, useContext } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CartContext } from '../context/CartContext';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

const ProductCard = ({ id, name, price, originalPrice, image, averageRating, reviewCount, isNew, isBestseller, category, brandName, stock_quantity }) => {

  const { addToCart } = useContext(CartContext);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const productForCart = { id, name, price, imageUrl: image, categoryName: category, brand: brandName, stock_quantity: stock_quantity };
    addToCart(productForCart, 1);
  };



  return (
    <div
      className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col mb-4 h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <Link href={`/product/${id}`} className="relative aspect-square overflow-hidden block p-4">
        <Image
          src={image || '/placeholder-image.jpg'} // Use a placeholder if image is null or empty
          alt={name || 'Product Image'} // Use product name for alt text
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isNew && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--brand-pink)', color: 'white' }}>New</span>
          )}
          {isBestseller && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--brand-blue)', color: 'white' }}>Bestseller</span>
          )}
          {discount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#EF4444', color: 'white' }}>-{discount}%</span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          className={`absolute top-3 right-3 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all flex items-center justify-center`}
          style={{ color: isWishlisted ? 'var(--brand-pink)' : '#4B5563' }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent link click
            setIsWishlisted(!isWishlisted);
          }}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Add Button */}
        <div className={`absolute bottom-3 left-3 right-3 transition-all duration-300 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}>

          {!stock_quantity || stock_quantity <= 0 ? (
            <button
              disabled
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md flex items-center justify-center text-sm font-medium cursor-not-allowed"
            >
              Out of Stock
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="w-full bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-200 py-2 px-4 rounded-md flex items-center justify-center text-sm font-medium" style={{ color: '#111827' }}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Add to cart
            </button>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4 space-y-3 flex-grow flex flex-col justify-between min-h-[120px]">
        <div>
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--brand-blue)' }}>{brandName}</p> {/* Display brandName */}
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--brand-blue)' }}>{category}</p>
          <Link
            href={`/product/${id}`}
            className="mt-1 transition-colors cursor-pointer block truncate-2-lines"
            style={{ color: isHovered ? 'var(--brand-pink)' : '#111827' }}
          >
            {name}
          </Link>
          {stock_quantity === 1 && (
            <p className="text-sm font-medium text-red-500 mt-1">Only 1 left in stock!</p>
          )}
          {reviewCount > 0 && (
            <div className="flex items-center gap-2 mt-1"> {/* Added mt-1 for spacing */}
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3`} // Removed fill-current class
                    style={{
                      color: '#D1D5DB', // Default stroke color for all stars
                      fill: i < Math.floor(averageRating) ? '#FB923C' : 'transparent' // Fill with orange or transparent
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>({reviewCount})</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '1.125rem', color: '#111827' }}>AED {price ? parseFloat(price).toFixed(2) : '0.00'}</span>
          {originalPrice && (
            <span style={{ fontSize: '0.875rem', color: '#6B7280' }} className="line-through">AED {originalPrice ? parseFloat(originalPrice).toFixed(2) : '0.00'}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;