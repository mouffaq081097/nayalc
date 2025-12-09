import React, { createContext, useContext, useEffect, useCallback, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { createFetchWithAuth } from '../lib/api';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user, isAuthenticated, logout } = useAuth();
    // Memoize fetchWithAuth
    const fetchWithAuth = useMemo(() => createFetchWithAuth(logout), [logout]);
    const [cart, setCart] = useState([]); // Manage cart state locally
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [isCartOpen, setIsCartOpen] = useState(false); // New state for side cart
    const [selectedShippingAddressId, setSelectedShippingAddressId] = useState(null);
    const [couponError, setCouponError] = useState(null); // New state for coupon error

    const openCart = () => setIsCartOpen(true); // New function
    const closeCart = () => setIsCartOpen(false); // New function
    const toggleCart = () => setIsCartOpen(prev => !prev); // New function

    const fetchUserCart = useCallback(async () => {
        if (isAuthenticated && user?.id) {
            try {
                const response = await fetchWithAuth(`/api/users/${user.id}/cart`);
                const data = await response.json().catch(() => {
                    // If response is not JSON or already consumed, return an empty object for error handling
                    return {};
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user cart.');
                }
                const parsedCart = (data.cart || []).map(item => ({
                    id: item.productId, // Map productId to id
                    name: item.name,
                    brand: item.brand, // Assuming brand is directly available in API response
                    price: parseFloat(item.price),
                    originalPrice: parseFloat(item.originalPrice) || parseFloat(item.price), // Handle optional originalPrice
                    quantity: item.quantity,
                    image: item.imageUrl, // Map imageUrl to image
                    size: item.size || undefined, // Handle optional size
                    shade: item.shade || undefined, // Handle optional shade
                    stock_quantity: item.stock_quantity, // Add stock_quantity
                }));
                setCart(parsedCart);
            } catch (error) {
                console.error('Error fetching user cart:', error);
                setCart([]); // Clear cart on error
            }
        } else {
            setCart([]); // Clear cart if user logs out
        }
    }, [isAuthenticated, user, fetchWithAuth]);

    // Fetch user's cart from backend on login
    useEffect(() => {
        fetchUserCart();
    }, [fetchUserCart]);

    // Helper function to save cart to backend
    const saveCartToBackend = useCallback(async (currentCart) => {
        if (!isAuthenticated || !user?.id) {
            return;
        }

        try {
            console.log('Attempting to save cart to backend for user:', user.id, 'Cart:', currentCart);
            await fetchWithAuth(`/api/users/${user.id}/cart`, {
                method: 'PUT',
                body: JSON.stringify({ cart: currentCart }),
            });
        } catch (error) {
            console.error('Error saving cart to backend:', error);
        }
    }, [isAuthenticated, user, fetchWithAuth]);

    // Effect to save cart to backend whenever cart changes
    useEffect(() => {
        saveCartToBackend(cart);
    }, [cart, saveCartToBackend]);


    const addToCart = (product, quantity) => {
        // Prevent adding if stock is 0 or invalid
        if (!product.stock_quantity || product.stock_quantity <= 0) {
            // Optionally, show a toast message here
            return;
        }

        setCart((prevItems) => {
            const existingItemIndex = prevItems.findIndex(item => item.id === product.id);

            let updatedItems;
            if (existingItemIndex > -1) {
                updatedItems = [...prevItems];
                const currentItem = updatedItems[existingItemIndex];

                // Prevent increasing quantity if already at stock limit
                if (currentItem.quantity >= currentItem.stock_quantity) {
                    console.warn(`Cannot add more of ${product.name}, stock limit reached.`);
                    return prevItems; // Return original items without change
                }

                // Cap quantity at available stock
                currentItem.quantity = Math.min(
                    currentItem.quantity + quantity,
                    currentItem.stock_quantity
                );
            } else {
                // Cap initial quantity at available stock
                const validatedQuantity = Math.min(quantity, product.stock_quantity);
                updatedItems = [...prevItems, {
                    id: product.id,
                    name: product.name,
                    brand: product.brand,
                    price: parseFloat(product.price),
                    originalPrice: parseFloat(product.originalPrice) || parseFloat(product.price),
                    quantity: validatedQuantity,
                    image: product.imageUrl,
                    size: product.size,
                    shade: product.shade,
                    stock_quantity: product.stock_quantity,
                }];
            }
            saveCartToBackend(updatedItems);
            return updatedItems;
        });
        openCart(); // Open cart when item is added
    };

    const removeFromCart = (productId) => {
        setCart((prevItems) => {
            const updatedItems = prevItems.filter(item => item.id !== productId);
            // If cart becomes empty, close the side cart
            if (updatedItems.length === 0) {
                closeCart();
            }
            saveCartToBackend(updatedItems);
            return updatedItems;
        });
    };

    const updateQuantity = (productId, newQuantity) => {
        setCart((prevItems) => {
            let updatedItems;
            if (newQuantity < 1) {
                updatedItems = prevItems.filter(item => item.id !== productId);
                // If cart becomes empty, close the side cart
                if (updatedItems.length === 0) {
                    closeCart();
                }
            } else {
                updatedItems = prevItems.map(item => {
                    if (item.id === productId) {
                        // Prevent adding more than available stock
                        const validatedQuantity = Math.min(newQuantity, item.stock_quantity);
                        return { ...item, quantity: validatedQuantity };
                    }
                    return item;
                });
            }
            saveCartToBackend(updatedItems);
            return updatedItems;
        });
    };

    const clearCart = () => {
        setCart([]);
        saveCartToBackend([]);
        closeCart(); // Close cart when cleared
    };

    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    const applyCoupon = async (code) => {
        try {
            const response = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, totalAmount: subtotal }),
            });

            const data = await response.json();

            if (!response.ok) {
                setCouponError(data.message || 'Failed to apply coupon'); // Set error message
                throw new Error(data.message || 'Failed to apply coupon');
            }

            const coupon = data;
            let discount = 0;
            if (coupon.discount_type === 'percentage') {
                discount = (subtotal * coupon.discount_value) / 100;
            } else if (coupon.discount_type === 'fixed_amount') {
                discount = coupon.discount_value;
            }

            setDiscountAmount(discount);
            setAppliedCoupon(coupon);
            setCouponError(null); // Clear error on success
            // addToast('Coupon applied successfully!', 'success'); // Removed toast
        } catch (error) {
            setDiscountAmount(0);
            setAppliedCoupon(null);
            setCouponError(error.message); // Set error message
            // addToast(error.message, 'error'); // Removed toast
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponError(null); // Clear error
        // addToast('Coupon removed.'); // Removed toast
    };

    const finalTotal = subtotal - discountAmount;

    return (
        <CartContext.Provider value={{
            cartItems: cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            subtotal,
            appliedCoupon,
            discountAmount,
            finalTotal,
            applyCoupon,
            removeCoupon,
            isCartOpen, // Expose side cart state
            openCart,   // Expose open function
            closeCart,  // Expose close function
            toggleCart,  // Expose toggle function
            selectedShippingAddressId, // Expose selected shipping address ID
            setSelectedShippingAddressId, // Expose setter for selected shipping address ID
            couponError // Expose coupon error
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);