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
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);
    
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
        <Link href={`/product/${product.id}`} className="block group h-full mr-4"> {/* Added mr-4 for spacing */}
            <div className="bg-white rounded-xl overflow-hidden h-full flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="relative overflow-hidden" style={{ paddingBottom: '75%' }}> {/* 4:3 Aspect Ratio */}
                    <Image src={primaryImageUrl} alt={product.name} layout="fill" objectFit="contain" className="transition-opacity duration-500 ease-in-out group-hover:opacity-0" />
                    <Image src={secondaryImageUrl} alt={`${product.name} alternate view`} layout="fill" objectFit="contain" className="opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100" />
                    {isEditorsChoice && (
                        <div className="absolute top-2 right-2 bg-brand-pink text-white text-xs font-semibold px-2 py-1 rounded-full">
                            Editor&apos;s Choice
                        </div>
                    )}
                </div>
                <div className="p-5 text-left flex-grow flex flex-col justify-between"> {/* Added justify-between */}
                    <div className="flex-grow min-h-24"> {/* Added min-h-24 for consistent card height */}
                        <p className="text-xs text-brand-text-muted font-semibold uppercase tracking-wide">{product.brandName}</p> {/* Use brandName */}
                        <h3 className="text-lg font-medium text-brand-text font-serif mt-1 group-hover:text-brand-accent">{product.name}</h3>
                    </div>
                    <div className="flex justify-between items-center mt-4"> {/* New div for price and button */}
                        <p style={{ color: 'var(--brand-pink)', fontWeight: 'bold' }}>AED {product.price ? product.price.toFixed(2) : '0.00'}</p> {/* Price on left */}
                        <button 
                            onClick={handleAddToCart}
                            style={{
                                backgroundColor: 'var(--brand-blue)',
                                color: 'white',
                                paddingTop: '0.5rem',
                                paddingBottom: '0.5rem',
                                paddingLeft: '1rem',
                                paddingRight: '1rem',
                                borderRadius: '9999px',
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                                opacity: isButtonHovered ? 0.9 : 1,
                                transition: 'opacity 0.3s ease-in-out',
                            }}
                            onMouseEnter={() => setIsButtonHovered(true)}
                            onMouseLeave={() => setIsButtonHovered(false)}
                            aria-label={`Add ${product.name} to cart`}
                        >
                            {isMobile ? '+' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;