import React, { createContext, useContext, useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { createFetchWithAuth } from '../lib/api';
import { toast } from 'react-toastify';
import { calcCouponDiscount } from '@/lib/couponDiscount';
import { orderableQty, preorderUnits } from '@/lib/backorderRules';
import { useT } from './LocaleContext';

export const CartContext = createContext();

// A signed-out shopper's bag lives in this browser, so a reload or signing in
// doesn't empty it; on sign-in it's merged into the account's bag.
const GUEST_CART_KEY = 'nayalc_guest_cart';
const readGuestCart = () => {
    try {
        const items = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
        return Array.isArray(items) ? items.filter(i => i && i.id && Number(i.quantity) > 0) : [];
    } catch {
        return [];
    }
};
const writeGuestCart = (items) => {
    try {
        if (items.length) localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
        else localStorage.removeItem(GUEST_CART_KEY);
    } catch {}
};
// The account's bag plus anything added while signed out (the larger quantity wins, within stock)
const mergeCarts = (accountItems, guestItems) => {
    const merged = accountItems.map(item => ({ ...item }));
    for (const g of guestItems) {
        const match = merged.find(item => item.id === g.id);
        if (match) {
            const cap = orderableQty(match) || orderableQty(g) || Math.max(match.quantity, g.quantity);
            match.quantity = Math.min(Math.max(match.quantity, Number(g.quantity)), cap);
        } else {
            merged.push(g);
        }
    }
    return merged;
};

export const CartProvider = ({ children }) => {
    const t = useT();
    // For the save callback, which shouldn't be rebuilt (and re-save the bag) when the language loads
    const tRef = useRef(t);
    tRef.current = t;
    const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
    // Memoize fetchWithAuth
    const fetchWithAuth = useMemo(() => createFetchWithAuth(logout), [logout]);
    const [cart, setCart] = useState([]); // Manage cart state locally
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const cartLoadedRef = useRef(false);
    // Which account the cart in state belongs to ('guest' or a user id), so pages
    // can tell "still loading" apart from "empty" without a stale frame after sign-in.
    const [cartLoadedFor, setCartLoadedFor] = useState(null);
    const saveDebounceRef = useRef(null);
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
                    backorderable: item.backorderable || 0,
                    backorder_lead_days: item.backorder_lead_days,
                }));
                cartLoadedRef.current = true;
                // Bring in what was added while signed out, and save it to the account
                const guestItems = readGuestCart();
                if (guestItems.length) {
                    const merged = mergeCarts(parsedCart, guestItems);
                    writeGuestCart([]);
                    setCart(merged);
                    fetchWithAuth(`/api/users/${user.id}/cart`, { method: 'PUT', body: JSON.stringify({ cart: merged }) })
                        .catch(error => console.error('Error saving merged cart:', error));
                } else {
                    setCart(parsedCart);
                }
                setCartLoadedFor(user.id);
            } catch (error) {
                console.error('Error fetching user cart:', error);
                cartLoadedRef.current = true;
                setCart([]); // Clear cart on error
                setCartLoadedFor(user.id);
            }
        } else {
            cartLoadedRef.current = true;
            setCart(readGuestCart()); // The bag kept in this browser while signed out
            setCartLoadedFor('guest');
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
            await fetchWithAuth(`/api/users/${user.id}/cart`, {
                method: 'PUT',
                body: JSON.stringify({ cart: currentCart }),
            });
        } catch (error) {
            console.error('Error saving cart to backend:', error);
            toast.error(tRef.current('Could not save your cart. Please check your connection and try again.'));
        }
    }, [isAuthenticated, user, fetchWithAuth]);

    // Signed out: keep the bag in this browser
    useEffect(() => {
        if (cartLoadedFor === 'guest' && !isAuthenticated) writeGuestCart(cart);
    }, [cart, cartLoadedFor, isAuthenticated]);

    // Debounced save — prevents concurrent PUT requests on rapid cart changes (M2)
    useEffect(() => {
        if (!cartLoadedRef.current) return;
        if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
        saveDebounceRef.current = setTimeout(() => {
            saveCartToBackend(cart);
        }, 400);
        return () => clearTimeout(saveDebounceRef.current);
    }, [cart, saveCartToBackend]);


    const addToCart = (product, quantity) => {
        // Shelf stock plus what may still be pre-ordered (lib/backorderRules.js)
        const maxQty = orderableQty(product);
        if (maxQty <= 0) {
            toast.error(t('“{name}” is out of stock.', { name: product.name }));
            return false;
        }

        let addedSuccessfully = false;
        setCart((prevItems) => {
            const existingItemIndex = prevItems.findIndex(item => item.id === product.id);

            let updatedItems;
            if (existingItemIndex > -1) {
                updatedItems = [...prevItems];
                const currentItem = updatedItems[existingItemIndex];

                // The product passed in is the freshest view of its stock
                currentItem.stock_quantity = product.stock_quantity;
                currentItem.backorderable = product.backorderable || 0;
                currentItem.backorder_lead_days = product.backorder_lead_days;

                // Prevent increasing quantity if already at stock limit
                if (currentItem.quantity >= maxQty) {
                    toast.error(t('You already have all {n} available of “{name}”.', { n: maxQty, name: product.name }));
                    return prevItems; // Return original items without change
                }

                // Cap quantity at available stock
                const newQuantity = Math.min(currentItem.quantity + quantity, maxQty);
                currentItem.quantity = newQuantity;
                addedSuccessfully = true;
            } else {
                // Cap initial quantity at available stock
                const validatedQuantity = Math.min(quantity, maxQty);
                if (validatedQuantity <= 0) {
                    toast.error(t('Invalid quantity for “{name}”.', { name: product.name }));
                    return prevItems;
                }
                updatedItems = [...prevItems, {
                    id: product.id,
                    slug: product.slug,
                    name: product.name,
                    brand: product.brand,
                    price: parseFloat(product.price),
                    originalPrice: parseFloat(product.originalPrice) || parseFloat(product.price),
                    quantity: validatedQuantity,
                    image: product.imageUrl,
                    size: product.size,
                    shade: product.shade,
                    stock_quantity: product.stock_quantity,
                    backorderable: product.backorderable || 0,
                    backorder_lead_days: product.backorder_lead_days,
                }];
                addedSuccessfully = true;
            }
            saveCartToBackend(updatedItems);
            if (addedSuccessfully) {
                // Item added to cart (toast removed per user request)
            }
            return updatedItems;
        });
        if (addedSuccessfully) {
            openCart(); // Re-enabled as per user's instruction
        }
        return addedSuccessfully;
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
                        const maxQty = orderableQty(item);
                        const validatedQuantity = Math.min(newQuantity, maxQty);
                        if (validatedQuantity < newQuantity) {
                            toast.info(t('Only {n} available — quantity adjusted.', { n: maxQty }));
                        }
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

    // Any line partly or wholly on pre-order: checkout holds the order and hides cash on delivery
    const hasPreorder = cart.some(item => preorderUnits(item, item.quantity) > 0);

    // Worked out from the cart on every change, the same way the order API does, so a
    // product-specific code follows its products in and out of the bag
    const discountAmount = useMemo(
        () => calcCouponDiscount(appliedCoupon, cart.map(item => ({ productId: item.id, price: item.price, quantity: item.quantity }))),
        [appliedCoupon, cart]
    );

    const applyCoupon = async (code) => {
        try {
            const response = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, totalAmount: subtotal, productIds: cart.map(item => item.id) }),
            });

            const data = await response.json();

            if (!response.ok) {
                setCouponError(data.message || 'Failed to apply coupon'); // Set error message
                throw new Error(data.message || 'Failed to apply coupon');
            }

            setAppliedCoupon(data);
            setCouponError(null); // Clear error on success
        } catch (error) {
            setAppliedCoupon(null);
            setCouponError(error.message); // Set error message
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponError(null); // Clear error
    };

    const finalTotal = subtotal - discountAmount;
    const isCartReady = !authLoading && cartLoadedFor === (isAuthenticated && user?.id ? user.id : 'guest');

    return (
        <CartContext.Provider value={{
            cartItems: cart,
            isCartReady,
            hasPreorder,
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