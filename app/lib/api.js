
export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Request failed with status: ${response.status}, Body: ${errorBody}`);
  }

  return response.json();
};


// This function fetches all products from the API
export async function getProducts(options = {}) {
  const { random, limit, categoryIds, isNew, brandId } = options;
  const queryParams = new URLSearchParams();

  if (random) queryParams.append('random', random);
  if (limit) queryParams.append('limit', limit);
  if (categoryIds) queryParams.append('categoryIds', categoryIds.join(','));
  if (isNew) queryParams.append('isNew', isNew);
  if (brandId) queryParams.append('brandId', brandId);

  try {
    const response = await fetch(`/api/products?${queryParams.toString()}`);
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to fetch products. Status: ${response.status}, Body: ${errorBody}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getProducts:", error);
    return [];
  }
}

export async function getNewArrivals() {
  return getProducts({ isNew: true });
}

// This function fetches a single product by its ID
export async function getProductById(id) {
  if (!id) {
    console.error("getProduct requires an ID.");
    return null;
  }
  try {
    const response = await fetch(`/api/products/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getProduct:", error);
    return null;
  }
}

// This function fetches all categories from the API
export async function getCategories() {
  try {
    const response = await fetch('/api/categories');
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getCategories:", error);
    return [];
  }
}

// This function fetches a single category by its ID
export async function getCategory(id) {
  if (!id) {
    console.error("getCategory requires an ID.");
    return null;
  }
  try {
    const response = await fetch(`/api/categories/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch category');
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getCategory:", error);
    return null;
  }
}

// This function fetches all brands from the API
export async function getBrands() {
  try {
    const response = await fetch('/api/brands');
    if (!response.ok) {
      throw new Error('Failed to fetch brands');
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getBrands:", error);
    return [];
  }
}

// This function fetches a single brand by its ID
export async function getBrand(id) {
  if (!id) {
    console.error("getBrand requires an ID.");
    return null;
  }
  try {
    const response = await fetch(`/api/brands/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch brand');
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getBrand:", error);
    return null;
  }
}

// This function fetches a single order by its ID
export async function getOrderById(id) {
  if (!id) {
    console.error("getOrderById requires an ID.");
    return null;
  }
  try {
    // Note the use of fetchWithAuth here
    return await fetchWithAuth(`/api/orders/${id}`);
  } catch (error) {
    console.error("Error in getOrderById:", error);
    return null;
  }
}

// Placeholder for API mocking. User needs to provide actual implementation if required.
export function enableApiMocking() {
  console.warn("API mocking is enabled. Provide actual implementation if needed.");
}