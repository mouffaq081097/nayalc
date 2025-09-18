'use client';
import React, { useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CartContext } from '../context/CartContext'; // Import CartContext
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const ProductCard = ({ product }) => {
    const { addToCart } = useContext(CartContext); // Use useContext(CartContext)
    const { showToast: addToast } = useToast();
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    
    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            addToast('Please login to add items to your cart.');
            router.push('/auth'); // Redirect to login page
            return;
        }

        // Ensure the product has an _id property for consistency with CartContext
        const productWithUnderscoreId = { ...product, _id: product.id };
        addToCart(productWithUnderscoreId, 1); // Pass default quantity of 1
        addToast(`Added ${product.name} to cart!`);
    }

    const primaryImageUrl = product.imageUrl || 'https://picsum.photos/400';

    return (
        <Link href={`/product/${product.id}`} className="group block bg-white rounded-lg shadow-sm hover:shadow-lg overflow-hidden transition-all duration-300 h-[400px] flex flex-col mx-2">
            <div className="relative">
                <img src={primaryImageUrl} alt={product.name} className="w-full h-56 object-contain" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                        onClick={handleAddToCart}
                        className="bg-brand-button-bg text-white px-6 py-2 rounded-full transform transition-transform duration-300 opacity-90 hover:opacity-100 sm:translate-y-4 sm:group-hover:translate-y-0"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
            <div className="p-4 text-center flex-grow flex flex-col justify-between">
                <div>
                    <p className="text-xs text-brand-muted font-semibold uppercase">{product.brandName}</p>
                    <h3 className="text-lg font-semibold text-brand-text font-serif mt-1">{product.name}</h3>
                </div>
                <p className="text-brand-primary font-bold mt-2">AED {product.price.toFixed(2)}</p>
            </div>
        </Link>
    );
};

export default ProductCard;