'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.js';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [appState, setAppState] = useState({}); 
  const [cart, setCart] = useState([]); 
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [cancelledOrders, setCancelledOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [brands, setBrands] = useState([]); // New state for brands
  const [featuredProducts, setFeaturedProducts] = useState([]); // New state for featured products

  // Function to fetch orders from the backend
  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setOrders([]);
      return;
    }
    try {
      const response = await fetch(`/api/orders?userId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      // Parse the 'items' JSON string back into an array of objects
              const parsedOrders = data.map(order => ({
                  ...order,
                  totalAmount: parseFloat(order.totalAmount), // Ensure totalAmount is a number
                  items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
                  orderDate: new Date(order.orderDate), // Convert date string to Date object
              }));      setOrders(parsedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  }, [isAuthenticated, user]);

  const fetchAllOrders = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders`);
      if (!response.ok) {
        throw new Error('Failed to fetch all orders');
      }
      const data = await response.json();
      const parsedOrders = data.map(order => ({
          ...order,
          totalAmount: parseFloat(order.totalAmount),
          items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
          orderDate: new Date(order.createdAt),
      }));
      setAllOrders(parsedOrders);
    } catch (error) {
      console.error('Error fetching all orders:', error);
      setAllOrders([]);
    }
  }, []);

  const fetchDeliveredOrders = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/delivered`);
      if (!response.ok) {
        throw new Error('Failed to fetch delivered orders');
      }
      const data = await response.json();
      const parsedOrders = data.map(order => ({
          ...order,
          totalAmount: parseFloat(order.totalAmount),
          items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
          deliveredAt: new Date(order.deliveredAt),
      }));
      setDeliveredOrders(parsedOrders);
    } catch (error) {
      console.error('Error fetching delivered orders:', error);
      setDeliveredOrders([]);
    }
  }, []);

  const fetchCancelledOrders = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/cancelled`);
      if (!response.ok) {
        throw new Error('Failed to fetch cancelled orders');
      }
      const data = await response.json();
      const parsedOrders = data.map(order => ({
          ...order,
          totalAmount: parseFloat(order.totalAmount),
          items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
          cancelledAt: new Date(order.cancelledAt),
      }));
      setCancelledOrders(parsedOrders);
    } catch (error) {
      console.error('Error fetching cancelled orders:', error);
      setCancelledOrders([]);
    }
  }, []);

  // Function to fetch all products from the backend
  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      const processedProducts = data.map(product => ({
        ...product,
        price: parseFloat(product.price), // Ensure price is a number
        imageUrls: product.imageUrl ? [product.imageUrl] : ['/placeholder-image.jpg'], // Ensure imageUrls always has at least one value
        image: product.imageUrl || '/placeholder-image.jpg', // Add 'image' property for ProductCard
        brand: product.brandName, // Map brandName from backend to 'brand' property
      }));
      setProducts(processedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  // Function to fetch products by category from the backend
  const fetchProductsByCategory = async (categoryIds) => {
    try {
      const response = await fetch(`/api/products?categoryIds=${categoryIds.join(',')}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch products for category: ${categoryName}`);
      }
      const data = await response.json();
      const processedProducts = data.map(product => ({
        ...product,
        price: parseFloat(product.price), // Ensure price is a number
        imageUrls: product.imageUrl ? [product.imageUrl] : ['/placeholder-image.jpg'], // Ensure imageUrls always has at least one value
        image: product.imageUrl || '/placeholder-image.jpg', // Add 'image' property for ProductCard
        brand: product.brandName, // Map brandName from backend to 'brand' property
      }));
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
        imageUrls: product.imageUrl ? [product.imageUrl] : ['/placeholder-image.jpg'], // Convert imageUrl string to imageUrls array
        image: product.imageUrl || '/placeholder-image.jpg',
      }));
      setFeaturedProducts(processedProducts);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setFeaturedProducts([]);
    }
  };

  // Function to fetch categories from the backend
  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/categories`);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      const processedCategories = data.map(category => ({
        ...category,
        image_url: category.imageUrl, // Map imageUrl from API to image_url for consistency
      }));
      setCategories(processedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  // Function to fetch brands from the backend
  const fetchBrands = async () => {
    try {
      const response = await fetch(`/api/brands`);
      if (!response.ok) {
        throw new Error('Failed to fetch brands');
      }
      const data = await response.json();

      const brandDescriptions = {
        'Gernetic': "Gernetic is a pioneering skincare brand renowned for its advanced cellular biology and natural ingredient formulations, offering targeted solutions for diverse skin concerns with a focus on holistic beauty.",
        'Zorah': "Zorah Biocosmetiques delivers certified organic, high-performance skincare and cosmetics, harnessing the potent benefits of argan oil and other natural ingredients for radiant, healthy skin, committed to ethical and sustainable practices.",
      };

      const processedBrands = data.map(brand => ({
        ...brand,
        description: brandDescriptions[brand.name] || "Discover a world of beauty and wellness with our premium selection of products from this esteemed brand, crafted for exceptional results and a luxurious experience."
      }));

      setBrands(processedBrands);
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrands([]);
    }
  };

  // Function to add a new brand
  const addBrand = async (brandFormData) => {
    try {
      const response = await fetch(`/api/brands`, {
        method: 'POST',
        body: brandFormData,
      });
      if (!response.ok) {
        throw new Error('Failed to add brand');
      }
      // Re-fetch brands to update the state
      fetchBrands();
    } catch (error) {
      console.error('Error adding brand:', error);
      throw error; // Re-throw to be caught by the component
    }
  };

  // Function to update an existing brand
  const updateBrand = async (brandId, brandFormData) => {
    try {
      const response = await fetch(`/api/brands/${brandId}`, {
        method: 'PUT',
        body: brandFormData,
      });
      if (!response.ok) {
        throw new Error('Failed to update brand');
      }
      // Re-fetch brands to update the state
      fetchBrands();
    } catch (error) {
      console.error('Error updating brand:', error);
      throw error;
    }
  };

  // Function to delete a brand
  const deleteBrand = async (brandId) => {
    try {
      const response = await fetch(`/api/brands/${brandId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete brand');
      }
      // Re-fetch brands to update the state
      fetchBrands();
    } catch (error) {
      console.error('Error deleting brand:', error);
      throw error;
    }
  };

  // Function to add a new category
  const addCategory = async (categoryData) => { // categoryData will now be FormData
    try {
      const response = await fetch(`/api/categories`, {
        method: 'POST',
        // No 'Content-Type' header when sending FormData, browser sets it
        body: categoryData, // Send FormData directly
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add category');
      }
      const data = await response.json(); // Backend returns { categoryId, imageUrl }
      fetchCategories(); // Re-fetch categories to update the state
      return data; // Return the response data (including categoryId)
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  // Function to update an existing category
  const updateCategory = async (categoryId, categoryData) => { // categoryData will now be FormData
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        // No 'Content-Type' header when sending FormData, browser sets it
        body: categoryData, // Send FormData directly
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update category');
      }
      const data = await response.json();
      // Re-fetch categories to update the state
      fetchCategories();
      return data; // Return the response data
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  // Function to delete a category
  const deleteCategory = async (categoryId) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete category');
      }
      // Re-fetch categories to update the state
      fetchCategories();
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
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
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
      const response = await fetch(`/api/products`, {
        method: 'POST',
        body: productFormData,
      });
      const data = await response.json();
      // Re-fetch products to update the state
      fetchProducts();
      return data;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  // Function to update an existing product
  const updateProduct = async (productId, productFormData) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        body: productFormData,
      });
      if (!response.ok) {
        throw new Error('Failed to update product');
      }
      const data = await response.json();
      // Re-fetch products to update the state
      fetchProducts();
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  // Function to delete a product
  const deleteProduct = async (productId) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      // Re-fetch products to update the state
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchProducts(); // Fetch all products
    fetchFeaturedProducts(); // Fetch random featured products
    fetchCategories(); // Fetch categories
    fetchBrands(); // Fetch brands
    if (isAuthenticated && user?.id) {
      fetchOrders(); // Fetch orders only if authenticated
    }
  }, [isAuthenticated, user, fetchOrders]); // Re-fetch when auth status or user changes

  // Function to fetch a single order by ID from the backend
  const fetchOrderById = useCallback(async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order details.');
      }
      const data = await response.json();
      // Parse items and totalAmount similar to fetchOrders
              const parsedOrder = {
                ...data,
                totalAmount: parseFloat(data.totalAmount),
                subtotal: parseFloat(data.subtotal),
                discountAmount: parseFloat(data.discountAmount),
                taxAmount: parseFloat(data.taxAmount), // Add taxAmount parsing
                items: data.items.map(item => ({ ...item, price: parseFloat(item.price) })),
                createdAt: new Date(data.createdAt),
              };      return parsedOrder;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  }, []);

  return (
    <AppContext.Provider value={{ 
        appState, setAppState, 
        cart, setCart, 
        orders, setOrders, 
        allOrders, fetchAllOrders,
        deliveredOrders, fetchDeliveredOrders,
        cancelledOrders, fetchCancelledOrders,
        products, setProducts, 
        categories, setCategories, 
        brands, setBrands, 
        featuredProducts, setFeaturedProducts, 
        addBrand, updateBrand, deleteBrand, 
        addCategory, updateCategory, deleteCategory, 
        updateOrderStatus, 
        addProduct, updateProduct, deleteProduct, 
        fetchProductsByCategory, fetchOrderById, fetchProducts 
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