'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext.js';
import { createFetchWithAuth } from '../lib/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  // Initialize fetchWithAuth with the logout function and memoize it
  const fetchWithAuth = useMemo(() => createFetchWithAuth(logout), [logout]);
  const [appState, setAppState] = useState({});
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState({ orders: [], totalCount: 0, page: 1, limit: 10 });

  const [cancelledOrders, setCancelledOrders] = useState({ orders: [], totalCount: 0, page: 1, limit: 10 });
  const [products, setProducts] = useState([]);
  const [adminProducts, setAdminProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [adminCategories, setAdminCategories] = useState([]);
  const [concerns, setConcerns] = useState([]);
  const [brands, setBrands] = useState([]);
  const [adminBrands, setAdminBrands] = useState([]);
 // New state for brands
  const [featuredProducts, setFeaturedProducts] = useState([]); // New state for featured products
  const [isChatOpen, setIsChatOpen] = useState(false); // Global chat widget state
  const [loading, setLoading] = useState(true);
  const [loyaltyData, setLoyaltyData] = useState({ stats: { points: 0, tier: 'Member', nextTierPoints: 2000 }, transactions: [] });

  const fetchLoyalty = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setLoyaltyData({ stats: { points: 0, tier: 'Member', nextTierPoints: 2000 }, transactions: [] });
      return;
    }
    try {
      const response = await fetchWithAuth(`/api/users/${user.id}/loyalty`);
      if (response.ok) {
        const data = await response.json();
        setLoyaltyData(data);
      }
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    }
  }, [isAuthenticated, user, fetchWithAuth]);

  // Function to fetch orders from the backend
  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setOrders([]);
      return;
    }
    try {
      const response = await fetchWithAuth(`/api/orders?userId=${user.id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'No error message available.' }));
        console.error('Failed to fetch orders. Status:', response.status, response.statusText, 'Error Data:', errorData);
        throw new Error('Failed to fetch orders.');
      }

      const data = await response.json();
      const fetchedOrders = data.orders;
      // Parse the 'items' JSON string back into an array of objects
      const parsedOrders = Array.isArray(fetchedOrders) ? fetchedOrders.map(order => ({ // Use fetchedOrders here
        ...order,
        totalAmount: parseFloat(order.totalAmount), // Ensure totalAmount is a number
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
        orderDate: new Date(order.createdAt), // Changed from orderDate to createdAt based on API response
      })) : []; setOrders(parsedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  }, [isAuthenticated, user]);

  const fetchAllOrders = useCallback(async (page = 1, limit = 10) => {
    if (!isAuthenticated) {
      setAllOrders({ orders: [], totalCount: 0, page: 1, limit: 10 });
      return;
    }
    try {
      const url = `/api/orders?statusFilter=all&page=${page}&limit=${limit}`;
      const response = await fetchWithAuth(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'No error message available.' }));
        console.error('Failed to fetch all orders. Status:', response.status, response.statusText, 'Error Data:', errorData);
        throw new Error('Failed to fetch all orders.');
      }

      const { orders, totalCount, page: currentPage, limit: currentLimit } = await response.json();
      const parsedOrders = Array.isArray(orders) ? orders.map(order => ({
        ...order,
        totalAmount: parseFloat(order.totalAmount),
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
        orderDate: new Date(order.createdAt),
      })) : [];
      setAllOrders({ orders: parsedOrders, totalCount: Number(totalCount || 0), page: currentPage, limit: currentLimit });
    } catch (error) {
      console.error('Error fetching all orders:', error);
      setAllOrders({ orders: [], totalCount: 0, page: 1, limit: 10 });
    }
  }, [isAuthenticated, fetchWithAuth]); // Added fetchWithAuth to dependencies

  const [deliveredOrders, setDeliveredOrders] = useState({ orders: [], totalCount: 0, page: 1, limit: 10 });

  const fetchDeliveredOrders = useCallback(async (page = 1, limit = 10) => {
    if (!isAuthenticated) {
      setDeliveredOrders({ orders: [], totalCount: 0, page: 1, limit: 10 });
      return;
    }
    try {
      const url = `/api/orders/delivered?page=${page}&limit=${limit}`;
      const response = await fetchWithAuth(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'No error message available.' }));
        console.error('Failed to fetch delivered orders. Status:', response.status, response.statusText, 'Error Data:', errorData);
        throw new Error('Failed to fetch delivered orders.');
      }

      const { orders, totalCount, page: currentPage, limit: currentLimit } = await response.json();
      const parsedOrders = Array.isArray(orders) ? orders.map(order => ({
        ...order,
        totalAmount: parseFloat(order.totalAmount),
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
        deliveredAt: new Date(order.deliveredAt),
      })) : [];
      setDeliveredOrders({ orders: parsedOrders, totalCount: Number(totalCount || 0), page: currentPage, limit: currentLimit });
    } catch (error) {
      console.error('Error fetching delivered orders:', error);
      setDeliveredOrders({ orders: [], totalCount: 0, page: 1, limit: 10 });
    }
  }, []);

  const fetchCancelledOrders = useCallback(async (page = 1, limit = 10) => {
    if (!isAuthenticated) {
      setCancelledOrders({ orders: [], totalCount: 0, page: 1, limit: 10 });
      return;
    }
    try {
      const url = `/api/orders/cancelled?page=${page}&limit=${limit}`;
      const response = await fetchWithAuth(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'No error message available.' }));
        console.error('Failed to fetch cancelled orders. Status:', response.status, response.statusText, 'Error Data:', errorData);
        throw new Error('Failed to fetch cancelled orders.');
      }

      const { orders, totalCount, page: currentPage, limit: currentLimit } = await response.json();
      const parsedOrders = Array.isArray(orders) ? orders.map(order => ({
        ...order,
        totalAmount: parseFloat(order.totalAmount),
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
        cancelledAt: new Date(order.cancelledAt),
      })) : [];
      setCancelledOrders({ orders: parsedOrders, totalCount: Number(totalCount || 0), page: currentPage, limit: currentLimit });
    } catch (error) {
      console.error('Error fetching cancelled orders:', error);
      setCancelledOrders({ orders: [], totalCount: 0, page: 1, limit: 10 });
    }
  }, []);

  const processProductData = (data) => data.map(product => {
    const additionalImages = Array.isArray(product.additionalImagesData) ? product.additionalImagesData.map(img => img.url) : [];
    return {
      ...product,
      price: parseFloat(product.price),
      originalPrice: product.comparedprice ? parseFloat(product.comparedprice) : null,
      imageUrls: [product.imageUrl || '/placeholder-image.jpg', ...additionalImages],
      image: product.imageUrl || '/placeholder-image.jpg',
      altText: product.altText || '',
      additionalImagesData: product.additionalImagesData || [],
      brand: product.brandName,
      stock_quantity: product.stock_quantity,
    };
  });

  // Public-filtered products (used by the store — never includes drafts or inactive)
  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(`/api/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      setProducts(processProductData(await response.json()));
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  }, []);

  // Admin products — all products including draft/inactive (used by admin portal only)
  const fetchAdminProducts = useCallback(async () => {
    try {
      const response = await fetch(`/api/products?admin=true`);
      if (!response.ok) throw new Error('Failed to fetch admin products');
      setAdminProducts(processProductData(await response.json()));
    } catch (error) {
      console.error('Error fetching admin products:', error);
      setAdminProducts([]);
    }
  }, []);

  // Function to fetch products by category from the backend
  const fetchProductsByCategory = async (categoryIds) => {
    try {
      const response = await fetch(`/api/products?categoryIds=${categoryIds.join(',')}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch products for category: ${categoryName}`);
      }
      const data = await response.json();
      const processedProducts = data.map(product => {
        const additionalImages = Array.isArray(product.additionalImagesData) ? product.additionalImagesData.map(img => img.url) : [];
        return {
          ...product,
          price: parseFloat(product.price), // Ensure price is a number
          originalPrice: product.comparedprice ? parseFloat(product.comparedprice) : null,
          imageUrls: [product.imageUrl || '/placeholder-image.jpg', ...additionalImages],
          image: product.imageUrl || '/placeholder-image.jpg', // Add 'image' property for ProductCard
          altText: product.altText || '',
          additionalImagesData: product.additionalImagesData || [], // Full data for admin
          brand: product.brandName, // Map brandName from backend to 'brand' property
          stock_quantity: product.stock_quantity, // Add stock_quantity
        };
      });
      return processedProducts;
    } catch (error) {
      console.error(`Error fetching products for categories ${categoryIds}:`, error);
      return []; // Return empty array on error
    }
  };

  // Function to fetch random featured products
  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch(`/api/products?random=true&limit=4`);
      if (!response.ok) {
        throw new Error('Failed to fetch featured products');
      }
      const data = await response.json();
      const processedProducts = data.map(product => ({
        ...product,
        price: parseFloat(product.price), // Ensure price is a number
        originalPrice: product.comparedprice ? parseFloat(product.comparedprice) : null,
        imageUrls: product.imageUrl ? [product.imageUrl] : ['/placeholder-image.jpg'], // Convert imageUrl string to imageUrls array
        image: product.imageUrl || '/placeholder-image.jpg',
        stock_quantity: product.stock_quantity, // Add stock_quantity
      }));
      setFeaturedProducts(processedProducts);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setFeaturedProducts([]);
    }
  };

  const processCategoryData = (data) => data.map(category => ({
    ...category,
    image_url: category.imageUrl,
    banner_url: category.bannerUrl,
  }));

  // Public-filtered categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`/api/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      setCategories(processCategoryData(await response.json()));
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  }, []);

  // Admin categories — includes inactive
  const fetchAdminCategories = useCallback(async () => {
    try {
      const response = await fetch(`/api/categories?admin=true`);
      if (!response.ok) throw new Error('Failed to fetch admin categories');
      setAdminCategories(processCategoryData(await response.json()));
    } catch (error) {
      console.error('Error fetching admin categories:', error);
      setAdminCategories([]);
    }
  }, []);

  // Function to fetch concerns from the backend
  const fetchConcerns = useCallback(async () => {
    try {
      const response = await fetch('/api/concerns');
      if (response.ok) {
        const data = await response.json();
        setConcerns(data);
      }
    } catch (error) {
      console.warn('Concerns fetch error (resilience):', error);
    }
  }, []);

  const brandDescriptions = {
    'Gernetic': "Gernetic is a pioneering skincare brand renowned for its advanced cellular biology and natural ingredient formulations, offering targeted solutions for diverse skin concerns with a focus on holistic beauty.",
    'Zorah': "Zorah Biocosmetiques delivers certified organic, high-performance skincare and cosmetics, harnessing the potent benefits of argan oil and other natural ingredients for radiant, healthy skin, committed to ethical and sustainable practices.",
  };
  const processBrandData = (data) => data.map(brand => ({
    ...brand,
    description: brandDescriptions[brand.name] || "Discover a world of beauty and wellness with our premium selection of products from this esteemed brand, crafted for exceptional results and a luxurious experience.",
  }));

  // Public-filtered brands
  const fetchBrands = useCallback(async () => {
    try {
      const response = await fetch(`/api/brands`);
      if (!response.ok) throw new Error('Failed to fetch brands');
      setBrands(processBrandData(await response.json()));
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrands([]);
    }
  }, []);

  // Admin brands — includes inactive
  const fetchAdminBrands = useCallback(async () => {
    try {
      const response = await fetch(`/api/brands?admin=true`);
      if (!response.ok) throw new Error('Failed to fetch admin brands');
      setAdminBrands(processBrandData(await response.json()));
    } catch (error) {
      console.error('Error fetching admin brands:', error);
      setAdminBrands([]);
    }
  }, []);

  // Function to add a new brand
  const addBrand = async (brandFormData) => {
    try {
      await fetchWithAuth(`/api/brands`, { method: 'POST', body: brandFormData });
      fetchBrands(); fetchAdminBrands();
    } catch (error) {
      console.error('Error adding brand:', error);
      throw error;
    }
  };

  // Function to update an existing brand
  const updateBrand = async (brandId, brandFormData) => {
    try {
      await fetchWithAuth(`/api/brands/${brandId}`, { method: 'PUT', body: brandFormData });
      fetchBrands(); fetchAdminBrands();
    } catch (error) {
      console.error('Error updating brand:', error);
      throw error;
    }
  };

  // Function to delete a brand
  const deleteBrand = async (brandId) => {
    try {
      await fetchWithAuth(`/api/brands/${brandId}`, { method: 'DELETE' });
      fetchBrands(); fetchAdminBrands();
    } catch (error) {
      console.error('Error deleting brand:', error);
      throw error;
    }
  };

  // Function to add a new category
  const addCategory = async (categoryData) => {
    try {
      const data = await fetchWithAuth(`/api/categories`, { method: 'POST', body: categoryData });
      fetchCategories(); fetchAdminCategories();
      return data;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  // Function to update an existing category
  const updateCategory = async (categoryId, categoryData) => {
    try {
      const data = await fetchWithAuth(`/api/categories/${categoryId}`, { method: 'PUT', body: categoryData });
      fetchCategories(); fetchAdminCategories();
      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  // Function to delete a category
  const deleteCategory = async (categoryId) => {
    try {
      await fetchWithAuth(`/api/categories/${categoryId}`, { method: 'DELETE' });
      fetchCategories(); fetchAdminCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  // Function to update order status
  const updateOrderStatus = async (orderId, newStatus, trackingNumber, courierName, courierWebsite) => {
    try {
      const body = { status: newStatus };
      if (trackingNumber !== undefined) { // Only add trackingNumber if explicitly provided
        body.trackingNumber = trackingNumber;
      }
      if (courierName !== undefined) { // Only add courierName if explicitly provided
        body.courierName = courierName;
      }
      if (courierWebsite !== undefined) { // Only add courierWebsite if explicitly provided
        body.courierWebsite = courierWebsite;
      }
      await fetchWithAuth(`/api/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      // Re-fetch orders to update the state
      fetchAllOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  // Function to add a new product
  const addProduct = async (productFormData) => {
    try {
      const data = await fetchWithAuth(`/api/products`, { method: 'POST', body: productFormData });
      fetchProducts(); fetchAdminProducts();
      return data;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  // Function to update an existing product
  const updateProduct = async (productId, productFormData) => {
    try {
      const data = await fetchWithAuth(`/api/products/${productId}`, { method: 'PUT', body: productFormData });
      fetchProducts(); fetchAdminProducts();
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  // Function to delete a product
  const deleteProduct = async (productId) => {
    try {
      await fetchWithAuth(`/api/products/${productId}`, { method: 'DELETE' });
      fetchProducts(); fetchAdminProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  // Toggle active status for products, brands, categories, coupons
  const toggleProductStatus = async (productId, is_active) => {
    try {
      await fetchWithAuth(`/api/products/${productId}`, { method: 'PATCH', body: JSON.stringify({ is_active }) });
      fetchProducts(); fetchAdminProducts();
    } catch (error) {
      console.error('Error toggling product status:', error);
      throw error;
    }
  };

  const toggleBrandStatus = async (brandId, is_active) => {
    try {
      await fetchWithAuth(`/api/brands/${brandId}`, { method: 'PATCH', body: JSON.stringify({ is_active }) });
      fetchBrands(); fetchAdminBrands();
    } catch (error) {
      console.error('Error toggling brand status:', error);
      throw error;
    }
  };

  const toggleCategoryStatus = async (categoryId, is_active) => {
    try {
      await fetchWithAuth(`/api/categories/${categoryId}`, { method: 'PATCH', body: JSON.stringify({ is_active }) });
      fetchCategories(); fetchAdminCategories();
    } catch (error) {
      console.error('Error toggling category status:', error);
      throw error;
    }
  };

  const toggleCouponStatus = async (couponId, is_active) => {
    try {
      await fetchWithAuth(`/api/coupons/${couponId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active }),
      });
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      throw error;
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchProducts(),
          fetchFeaturedProducts(),
          fetchCategories(),
          fetchConcerns(),
          fetchBrands()
        ]);
        
        if (isAuthenticated && user?.id) {
          const promises = [fetchOrders(), fetchLoyalty()];
          if (user.role === 'admin') {
            promises.push(fetchAdminProducts(), fetchAdminBrands(), fetchAdminCategories());
          }
          await Promise.all(promises);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, fetchOrders, fetchLoyalty, fetchCategories]);



  return (
    <AppContext.Provider value={{
      appState, setAppState,
      cart, setCart,
      orders, setOrders,
      allOrders, fetchAllOrders,
      deliveredOrders, fetchDeliveredOrders,
      cancelledOrders, fetchCancelledOrders,
      products, setProducts,
      adminProducts,
      categories, setCategories,
      adminCategories,
      concerns, setConcerns,
      brands, setBrands,
      adminBrands,
      featuredProducts, setFeaturedProducts,
      addBrand, updateBrand, deleteBrand,
      addCategory, updateCategory, deleteCategory,
      updateOrderStatus,
      addProduct, updateProduct, deleteProduct,
      fetchProductsByCategory,
      fetchProducts,
      fetchWithAuth,
      isChatOpen, setIsChatOpen,
      loading,
      loyaltyData, fetchLoyalty,
      toggleProductStatus, toggleBrandStatus, toggleCategoryStatus, toggleCouponStatus,
        }}>
          {children}
        </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};