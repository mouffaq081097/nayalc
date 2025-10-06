'use client'; // This module will be used in a client component

export const enableApiMocking = () => {
  
  // In a real app, this would set up a mock service worker or similar
};

export const getProductById = async (productId) => {
  try {
    const response = await fetch(`/api/products/${productId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    throw error;
  }
};

export const getOrderById = async (orderId) => {
  try {
    const response = await fetch(`/api/orders/${orderId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    throw error;
  }
};
