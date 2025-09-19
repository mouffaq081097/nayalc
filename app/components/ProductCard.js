import React, { useState, useContext, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link'; // Use next/link
import { CartContext } from '../context/CartContext'; // Import CartContext
import { useToast } from '../context/ToastContext';

// No need for Product type definition here, as it's handled by the API response structure
// No need for getCloudinaryImageUrl or formatPrice here

const ProductCard = ({ product, isEditorsChoice }) => {
    const { addToCart } = useContext(CartContext);
    const { showToast } = useToast();
    const [isButtonHovered, setIsButtonHovered] = useState(false);

    const truncateText = (text, maxLength) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const handleAddToCart = (e) => { // Removed React.MouseEvent<HTMLButtonElement> type
        e.preventDefault();
        e.stopPropagation();
        const productWithUnderscoreId = { ...product, _id: product.id };
        addToCart(productWithUnderscoreId, 1); // Assuming addToCart takes product and quantity
        showToast(`Added ${product.name} to cart!`);
    }

    const primaryImageUrl = product.imageUrl || 'https://picsum.photos/400';
    // Assuming product.additionalImages is an array of URLs if available
    const secondaryImageUrl = (product.additionalImages && product.additionalImages.length > 0) ? product.additionalImages[0] : primaryImageUrl;

    return (
        <Link href={`/product/${product._id}`} className="relative mx-1 mt-3 flex overflow-hidden rounded-xl"> {/* Reduced px-2 to px-1 for closer spacing */}
            <div className="bg-white rounded-xl overflow-hidden h-full flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="relative overflow-hidden" style={{ paddingBottom: '100%' }}> {/* 1:1 Aspect Ratio for larger image */}
                    <Image src={primaryImageUrl} alt={product.name} layout="fill" objectFit="contain" className="transition-opacity duration-500 ease-in-out group-hover:opacity-0" />
                    <Image src={secondaryImageUrl} alt={`${product.name} alternate view`} layout="fill" objectFit="contain" className="opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100" />
                    {isEditorsChoice && (
                        <div className="absolute top-2 right-2 bg-brand-pink text-white text-xs font-semibold px-2 py-1 rounded-full">
                            Editor&apos;s Choice
                        </div>
                    )}
                </div>
                <div className="p-5 text-left flex-grow flex flex-col justify-between"> {/* Added justify-between */}
                    <div className="flex-grow"> {/* Removed min-h-24 */}
                        <p className="text-xs text-brand-text-muted font-semibold uppercase tracking-wide">{product.brandName}</p> {/* Use brandName */}
                        <h3 className="text-lg font-medium text-brand-text font-serif mt-1 group-hover:text-brand-accent">{truncateText(product.name, 35)}</h3>
                        <p className="text-sm text-brand-muted mt-1">{truncateText(product.description, 80)}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-2"> {/* New div for price and button */}
                        <p className="text-[var(--brand-pink)] font-bold">AED {product.price ? product.price.toFixed(2) : '0.00'}</p> {/* Price on left */}
                        <button
                            onClick={handleAddToCart}
                            className={`bg-[var(--brand-blue)] text-white py-2 px-4 rounded-full font-bold text-sm transition-opacity duration-300 ${isButtonHovered ? 'opacity-90' : 'opacity-100'}`}
                            onMouseEnter={() => setIsButtonHovered(true)}
                            onMouseLeave={() => setIsButtonHovered(false)}
                            aria-label={`Add ${product.name} to cart`}
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
