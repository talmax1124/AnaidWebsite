import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  withCredentials: true, // Include cookies for authentication
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // The token will be added by individual API calls when needed
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Redirect to login or handle auth error
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Helper function to create auth headers from token
const createAuthHeaders = (token?: string) => {
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

// Generic API methods
export const apiService = {
  // GET request
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.get(url, config);
    return response.data;
  },

  // POST request
  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.post(url, data, config);
    return response.data;
  },

  // PUT request
  put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.put(url, data, config);
    return response.data;
  },

  // PATCH request
  patch: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.patch(url, data, config);
    return response.data;
  },

  // DELETE request
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.delete(url, config);
    return response.data;
  },
};

// Authentication API
export const authAPI = {
  register: async (userData: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  }) => {
    return apiService.post('/auth/register', userData);
  },

  login: async (credentials: { email: string; password: string }) => {
    return apiService.post('/auth/login', credentials);
  },

  logout: async () => {
    return apiService.post('/auth/logout');
  },

  getCurrentUser: async () => {
    return apiService.get('/auth/me');
  },
};

// Products API
export const productsAPI = {
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    subcategory?: string;
    search?: string;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
    featured?: boolean;
    active?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const queryString = searchParams.toString();
    return apiService.get(`/products${queryString ? `?${queryString}` : ''}`);
  },

  getProduct: async (id: string) => {
    return apiService.get(`/products/${id}`);
  },

  getProductBySlug: async (slug: string) => {
    return apiService.get(`/products/slug/${slug}`);
  },

  getCategories: async () => {
    return apiService.get('/products/categories');
  },

  createProduct: async (productData: any) => {
    return apiService.post('/products', productData);
  },

  updateProduct: async (id: string, productData: any) => {
    return apiService.put(`/products/${id}`, productData);
  },

  deleteProduct: async (id: string) => {
    return apiService.delete(`/products/${id}`);
  },
};

// Cart API
export const cartAPI = {
  getCart: async (token?: string) => {
    return apiService.get('/cart', { headers: createAuthHeaders(token) });
  },

  addToCart: async (item: {
    product_id: string;
    quantity: number;
    variant_options?: any;
    // Additional product details for database storage
    product_name?: string;
    product_image?: string;
    product_price?: number;
    product_description?: string;
    product_sku?: string;
  }, token?: string) => {
    return apiService.post('/cart/items', item, { headers: createAuthHeaders(token) });
  },

  updateCartItem: async (itemId: string, data: { quantity: number }, token?: string) => {
    return apiService.put(`/cart/items/${itemId}`, data, { headers: createAuthHeaders(token) });
  },

  removeFromCart: async (itemId: string, token?: string) => {
    return apiService.delete(`/cart/items/${itemId}`, { headers: createAuthHeaders(token) });
  },

  clearCart: async (token?: string) => {
    return apiService.delete('/cart', { headers: createAuthHeaders(token) });
  },
};

// Orders API
export const ordersAPI = {
  getOrders: async (userId: string, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const queryString = searchParams.toString();
    return apiService.get(`/orders/${userId}${queryString ? `?${queryString}` : ''}`);
  },

  getOrder: async (userId: string, orderId: string) => {
    return apiService.get(`/orders/${userId}/${orderId}`);
  },

  createOrder: async (orderData: {
    user_id: string;
    customer_email: string;
    customer_first_name?: string;
    customer_last_name?: string;
    customer_phone?: string;
    shipping_address: any;
    payment_method: string;
    payment_id?: string;
    notes?: string;
  }) => {
    return apiService.post('/orders', orderData);
  },

  updateOrderStatus: async (orderId: string, status: {
    payment_status?: string;
    fulfillment_status?: string;
    shipping_tracking_number?: string;
  }) => {
    return apiService.patch(`/orders/${orderId}/status`, status);
  },
};

// Product Cache API - for storing product details in database
export const productCacheAPI = {
  // Store product details in database cache
  storeProduct: async (product: {
    product_id: string;
    name: string;
    description?: string;
    price: number;
    image?: string;
    sku?: string;
    category?: string;
  }, token?: string) => {
    return apiService.post('/products/cache', product, { headers: createAuthHeaders(token) });
  },

  // Get product details from database cache
  getProduct: async (productId: string, token?: string) => {
    return apiService.get(`/products/cache/${productId}`, { headers: createAuthHeaders(token) });
  },

  // Get multiple products from cache
  getProducts: async (productIds: string[], token?: string) => {
    return apiService.post('/products/cache/batch', { product_ids: productIds }, { headers: createAuthHeaders(token) });
  },
};

// Discounts API
export const discountsAPI = {
  validateDiscount: async (data: {
    code: string;
    cart_total: number;
    user_id?: string;
  }) => {
    return apiService.post('/discounts/validate', data);
  },

  applyDiscount: async (data: { code: string; user_id: string }) => {
    return apiService.post('/discounts/apply', data);
  },

  removeDiscount: async (userId: string) => {
    return apiService.delete(`/discounts/remove/${userId}`);
  },
};

// Shipping API
export const shippingAPI = {
  getShippingMethods: async (params?: { cart_total?: number; weight?: number }) => {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const queryString = searchParams.toString();
    return apiService.get(`/shipping/methods${queryString ? `?${queryString}` : ''}`);
  },

  calculateShipping: async (data: {
    user_id: string;
    shipping_method_id: string;
  }) => {
    return apiService.post('/shipping/calculate', data);
  },

  estimateShipping: async (data: {
    user_id?: string;
    shipping_address: any;
    items?: Array<{ product_id: string; quantity: number }>;
  }) => {
    return apiService.post('/shipping/estimate', data);
  },
};

// Users API
export const usersAPI = {
  getUser: async (userId: string) => {
    return apiService.get(`/users/${userId}`);
  },

  updateUser: async (userId: string, userData: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  }) => {
    return apiService.put(`/users/${userId}`, userData);
  },
};

// Appointments API
export const appointmentsAPI = {
  // Public endpoints
  getServices: async () => {
    return apiService.get('/appointments/services');
  },

  getAvailability: async (date: string) => {
    return apiService.get(`/appointments/availability/${date}`);
  },

  createBooking: async (bookingData: {
    clientInfo: {
      name: string;
      email: string;
      phone: string;
      notes?: string;
    };
    serviceId: number;
    appointmentDate: string;
    appointmentTime: string;
  }) => {
    return apiService.post('/appointments/book', bookingData);
  },

  getBookingStatus: async (bookingId: string) => {
    return apiService.get(`/appointments/booking/${bookingId}`);
  },

  // Protected endpoints (require authentication)
  getPendingAppointments: async (token?: string) => {
    return apiService.get('/appointments/pending', { headers: createAuthHeaders(token) });
  },

  getTodayAppointments: async (token?: string) => {
    return apiService.get('/appointments/today', { headers: createAuthHeaders(token) });
  },

  getUpcomingAppointments: async (token?: string) => {
    return apiService.get('/appointments/upcoming', { headers: createAuthHeaders(token) });
  },

  getAppointmentHistory: async (token?: string) => {
    return apiService.get('/appointments/history', { headers: createAuthHeaders(token) });
  },

  approveAppointment: async (data: {
    appointmentId: number;
    action: 'approve' | 'reject';
    notes?: string;
  }, token?: string) => {
    const endpoint = data.action === 'approve' ? '/appointments/approve' : '/appointments/reject';
    return apiService.post(endpoint, data, { headers: createAuthHeaders(token) });
  },

  updateAppointmentStatus: async (id: string, statusData: any, token?: string) => {
    return apiService.put(`/appointments/${id}/status`, statusData, { headers: createAuthHeaders(token) });
  },

  rescheduleAppointment: async (id: string, rescheduleData: any, token?: string) => {
    return apiService.put(`/appointments/${id}/reschedule`, rescheduleData, { headers: createAuthHeaders(token) });
  },

  cancelAppointment: async (id: string, token?: string) => {
    return apiService.delete(`/appointments/${id}/cancel`, { headers: createAuthHeaders(token) });
  },

  getAppointmentDetails: async (id: string, token?: string) => {
    return apiService.get(`/appointments/${id}/details`, { headers: createAuthHeaders(token) });
  },

  // Analytics endpoints
  getAnalyticsOverview: async (token?: string) => {
    return apiService.get('/appointments/analytics/overview', { headers: createAuthHeaders(token) });
  },

  getRevenueAnalytics: async (token?: string) => {
    return apiService.get('/appointments/analytics/revenue', { headers: createAuthHeaders(token) });
  },
};

// Export default api instance for custom requests
export default api;