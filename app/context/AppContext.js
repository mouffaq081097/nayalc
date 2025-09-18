'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext.js';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [appState, setAppState] = useState({}); 
  const [cart, setCart] = useState([]); 
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [brands, setBrands] = useState([]); // New state for brands
  const [featuredProducts, setFeaturedProducts] = useState([]); // New state for featured products

  // Function to fetch orders from the backend
  const fetchOrders = async () => {
    if (!isAuthenticated || !user?.id) {
      setOrders([]);
      return;
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders?userId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      // Parse the 'items' JSON string back into an array of objects
      const parsedOrders = data.map(order => ({
        ...order,
        total_amount: parseFloat(order.total_amount), // Ensure total_amount is a number
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
        orderDate: new Date(order.orderDate), // Convert date string to Date object
      }));
      setOrders(parsedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  };

  // Function to fetch all products from the backend
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      const processedProducts = data.map(product => ({
        ...product,
        price: parseFloat(product.price), // Ensure price is a number
        imageUrls: product.imageUrl ? [product.imageUrl] : [], // Convert imageUrl string to imageUrls array
        brand: product.brandName, // Map brandName from backend to 'brand' property
      }));
      setProducts(processedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  // Function to fetch products by category from the backend
  const fetchProductsByCategory = async (categoryName) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products?category=${categoryName}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch products for category: ${categoryName}`);
      }
      const data = await response.json();
      const processedProducts = data.map(product => ({
        ...product,
        price: parseFloat(product.price), // Ensure price is a number
        imageUrls: product.imageUrl ? [product.imageUrl] : [], // Convert imageUrl string to imageUrls array
      }));
      return processedProducts; // Return the fetched products
    } catch (error) {
      console.error(`Error fetching products for category ${categoryName}:`, error);
      return []; // Return empty array on error
    }
  };

  // Function to fetch random featured products
  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products?random=true&limit=4`);
      if (!response.ok) {
        throw new Error('Failed to fetch featured products');
      }
      const data = await response.json();
      const processedProducts = data.map(product => ({
        ...product,
        price: parseFloat(product.price), // Ensure price is a number
        imageUrls: product.imageUrl ? [product.imageUrl] : [], // Convert imageUrl string to imageUrls array
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories`);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  // Function to fetch brands from the backend
  const fetchBrands = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/brands`);
      if (!response.ok) {
        throw new Error('Failed to fetch brands');
      }
      const data = await response.json();
      setBrands(data);
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrands([]);
    }
  };

  // Function to add a new brand
  const addBrand = async (brandData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/brands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(brandData),
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
  const updateBrand = async (brandData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/brands/${brandData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(brandData),
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/brands/${brandId}`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories/${categoryId}`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories/${categoryId}`, {
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
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      // Re-fetch orders to update the state
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  // Function to add a new product
  const addProduct = async (productData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
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
  const updateProduct = async (productData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products/${productData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products/${productId}`, {
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
  }, [isAuthenticated, user]); // Re-fetch when auth status or user changes

  return (
    <AppContext.Provider value={{ appState, setAppState, cart, setCart, orders, setOrders, products, setProducts, categories, setCategories, brands, setBrands, featuredProducts, setFeaturedProducts, addBrand, updateBrand, deleteBrand, addCategory, updateCategory, deleteCategory, updateOrderStatus, addProduct, updateProduct, deleteProduct, fetchProductsByCategory }}>
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