// Neon Database Integration Service
// This replaces Firebase Firestore with Neon PostgreSQL via API calls

import { 
  Product, 
  Cart, 
  Order, 
  DiscountCode, 
  ShippingMethod,
  ProductCategory,
  CartItem
} from '../types';
import { 
  productsAPI, 
  cartAPI, 
  ordersAPI, 
  discountsAPI, 
  shippingAPI,
  authAPI 
} from './apiService';

// Product Services - Now using Neon API
export const getProducts = async (
  category?: ProductCategory,
  featured?: boolean,
  limitCount?: number,
  lastDoc?: any
): Promise<{ products: Product[]; lastDoc?: any }> => {
  try {
    const params: any = {};
    
    if (category) params.category = category;
    if (featured !== undefined) params.featured = featured;
    if (limitCount) params.limit = limitCount;
    
    const response = await productsAPI.getProducts(params);
    
    return {
      products: response.products || [],
      lastDoc: response.pagination?.hasNext ? response.pagination : null
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getProduct = async (id: string): Promise<Product | null> => {
  try {
    const product = await productsAPI.getProduct(id);
    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};

export const searchProducts = async (
  searchTerm: string,
  category?: ProductCategory,
  limitCount = 20
): Promise<Product[]> => {
  try {
    const params: any = {
      search: searchTerm,
      limit: limitCount
    };
    
    if (category) params.category = category;
    
    const response = await productsAPI.getProducts(params);
    return response.products || [];
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

export const getProductCategories = async (): Promise<ProductCategory[]> => {
  try {
    const response = await productsAPI.getCategories();
    return response.categories || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

// Cart Services - Now using Neon API with authentication
export const getCart = async (userId: string): Promise<Cart> => {
  try {
    const token = localStorage.getItem('auth_token');
    const cartData = await cartAPI.getCart(token || undefined);
    return cartData;
  } catch (error) {
    console.error('Error fetching cart:', error);
    // Return empty cart if error
    return {
      id: 'temp',
      userId,
      items: [],
      total: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
};

export const addToCart = async (
  userId: string,
  productId: string,
  quantity: number,
  variantOptions?: any
): Promise<CartItem> => {
  try {
    const token = localStorage.getItem('auth_token');
    const item = await cartAPI.addToCart({
      product_id: productId,
      quantity,
      variant_options: variantOptions
    }, token || undefined);
    
    return item;
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

export const updateCartItem = async (
  userId: string,
  itemId: string,
  quantity: number
): Promise<void> => {
  try {
    const token = localStorage.getItem('auth_token');
    await cartAPI.updateCartItem(itemId, { quantity }, token || undefined);
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
};

export const removeFromCart = async (
  userId: string,
  itemId: string
): Promise<void> => {
  try {
    const token = localStorage.getItem('auth_token');
    await cartAPI.removeFromCart(itemId, token || undefined);
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
};

export const clearCart = async (userId: string): Promise<void> => {
  try {
    const token = localStorage.getItem('auth_token');
    await cartAPI.clearCart(token || undefined);
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

// Order Services - Now using Neon API
export const createOrder = async (orderData: {
  userId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress: any;
  paymentMethod: string;
  paymentId?: string;
  notes?: string;
}): Promise<Order> => {
  try {
    const order = await ordersAPI.createOrder({
      user_id: orderData.userId,
      customer_email: orderData.customerEmail,
      customer_first_name: orderData.customerName.split(' ')[0],
      customer_last_name: orderData.customerName.split(' ').slice(1).join(' '),
      customer_phone: orderData.customerPhone,
      shipping_address: orderData.shippingAddress,
      payment_method: orderData.paymentMethod,
      payment_id: orderData.paymentId,
      notes: orderData.notes
    });
    
    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const getOrders = async (userId: string): Promise<Order[]> => {
  try {
    const response = await ordersAPI.getOrders(userId);
    return response.orders || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export const getOrder = async (userId: string, orderId: string): Promise<Order | null> => {
  try {
    const order = await ordersAPI.getOrder(userId, orderId);
    return order;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
};

// Discount Services - Now using Neon API
export const validateDiscountCode = async (
  code: string,
  cartTotal: number,
  userId?: string
): Promise<DiscountCode | null> => {
  try {
    const discount = await discountsAPI.validateDiscount({
      code,
      cart_total: cartTotal,
      user_id: userId
    });
    
    return discount;
  } catch (error) {
    console.error('Error validating discount code:', error);
    return null;
  }
};

export const applyDiscountCode = async (
  code: string,
  userId: string
): Promise<DiscountCode> => {
  try {
    const discount = await discountsAPI.applyDiscount({
      code,
      user_id: userId
    });
    
    return discount;
  } catch (error) {
    console.error('Error applying discount code:', error);
    throw error;
  }
};

// Shipping Services - Now using Neon API
export const getShippingMethods = async (cartTotal?: number): Promise<ShippingMethod[]> => {
  try {
    const response = await shippingAPI.getShippingMethods({
      cart_total: cartTotal
    });
    
    return response.methods || [];
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    return [];
  }
};

export const calculateShipping = async (
  userId: string,
  shippingMethodId: string
): Promise<number> => {
  try {
    const result = await shippingAPI.calculateShipping({
      user_id: userId,
      shipping_method_id: shippingMethodId
    });
    
    return result.cost || 0;
  } catch (error) {
    console.error('Error calculating shipping:', error);
    return 0;
  }
};

// Admin Services - Now using Neon API
export const addProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> => {
  try {
    const product = await productsAPI.createProduct(productData);
    return product;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const updateProduct = async (
  id: string,
  productData: Partial<Product>
): Promise<void> => {
  try {
    await productsAPI.updateProduct(id, productData);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    await productsAPI.deleteProduct(id);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// User Authentication - Now using Neon API
export const getCurrentUser = async () => {
  try {
    const user = await authAPI.getCurrentUser();
    return user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
};

// Helper function to get authentication token
export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  return !!token;
};

// Helper function to generate order number
export const generateOrderNumber = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};