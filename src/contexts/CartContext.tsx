import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { 
  Cart, 
  CartItem, 
  Product, 
  ShippingMethod 
} from '../types';
import { 
  cartAPI,
  discountsAPI,
  productCacheAPI
} from '../services/apiService';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART'; payload: Cart | null }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_ITEM'; payload: { productId: string; quantity: number; variantOptions?: Record<string, string> } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'APPLY_DISCOUNT'; payload: { code: string; amount: number; type: 'percentage' | 'fixed' } }
  | { type: 'REMOVE_DISCOUNT' }
  | { type: 'SET_SHIPPING'; payload: { method: string; cost: number } }
  | { type: 'CLEAR_CART' };

const initialState: CartState = {
  cart: null,
  isLoading: false,
  error: null,
};

// Helper function to calculate cart totals
function calculateCartTotal(
  items: CartItem[],
  discount?: { code: string; amount: number; type: 'percentage' | 'fixed' },
  shipping?: { method: string; cost: number },
  taxRate?: number
): { subtotal: number; total: number } {
  const subtotal = items.reduce((sum, item) => {
    const price = typeof item.price === 'number' ? item.price : parseFloat(item.price.toString()) || 0;
    return sum + (price * item.quantity);
  }, 0);

  let discountAmount = 0;
  if (discount) {
    if (discount.type === 'percentage') {
      discountAmount = (subtotal * discount.amount) / 100;
    } else {
      discountAmount = discount.amount;
    }
  }

  const shippingCost = shipping?.cost || 0;
  const tax = (subtotal * (taxRate || 0));
  const total = subtotal - discountAmount + shippingCost + tax;

  return {
    subtotal,
    total: Math.max(0, total) // Ensure total is never negative
  };
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_CART':
      return { ...state, cart: action.payload };
    
    case 'ADD_ITEM': {
      if (!state.cart) return state;
      
      const existingItemIndex = state.cart.items.findIndex(
        item => 
          item.productId === action.payload.productId &&
          JSON.stringify(item.variantOptions) === JSON.stringify(action.payload.variantOptions)
      );

      let updatedItems;
      if (existingItemIndex >= 0) {
        updatedItems = [...state.cart.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + action.payload.quantity,
        };
      } else {
        updatedItems = [...state.cart.items, action.payload];
      }

      const { subtotal, total } = calculateCartTotal(
        updatedItems,
        state.cart.discount,
        state.cart.shipping,
        state.cart.tax
      );

      return {
        ...state,
        cart: {
          ...state.cart,
          items: updatedItems,
          subtotal,
          total,
        },
      };
    }
    
    case 'UPDATE_ITEM': {
      if (!state.cart) return state;
      
      const updatedItems = state.cart.items.map(item => {
        if (
          item.productId === action.payload.productId &&
          JSON.stringify(item.variantOptions) === JSON.stringify(action.payload.variantOptions)
        ) {
          return { ...item, quantity: action.payload.quantity };
        }
        return item;
      }).filter(item => item.quantity > 0);

      const { subtotal, total } = calculateCartTotal(
        updatedItems,
        state.cart.discount,
        state.cart.shipping,
        state.cart.tax
      );

      return {
        ...state,
        cart: {
          ...state.cart,
          items: updatedItems,
          subtotal,
          total,
        },
      };
    }
    
    case 'REMOVE_ITEM': {
      if (!state.cart) return state;
      
      const updatedItems = state.cart.items.filter(item => item.productId !== action.payload);
      
      const { subtotal, total } = calculateCartTotal(
        updatedItems,
        state.cart.discount,
        state.cart.shipping,
        state.cart.tax
      );

      return {
        ...state,
        cart: {
          ...state.cart,
          items: updatedItems,
          subtotal,
          total,
        },
      };
    }
    
    case 'APPLY_DISCOUNT': {
      if (!state.cart) return state;
      
      const discount = {
        code: action.payload.code,
        amount: action.payload.amount,
        type: action.payload.type,
      };

      const { subtotal, total } = calculateCartTotal(
        state.cart.items,
        discount,
        state.cart.shipping,
        state.cart.tax
      );

      return {
        ...state,
        cart: {
          ...state.cart,
          discount,
          subtotal,
          total,
        },
      };
    }
    
    case 'REMOVE_DISCOUNT': {
      if (!state.cart) return state;
      
      const { subtotal, total } = calculateCartTotal(
        state.cart.items,
        undefined,
        state.cart.shipping,
        state.cart.tax
      );

      return {
        ...state,
        cart: {
          ...state.cart,
          discount: undefined,
          subtotal,
          total,
        },
      };
    }
    
    case 'SET_SHIPPING': {
      if (!state.cart) return state;
      
      const shipping = {
        method: action.payload.method,
        cost: action.payload.cost,
      };

      const { subtotal, total } = calculateCartTotal(
        state.cart.items,
        state.cart.discount,
        shipping,
        state.cart.tax
      );

      return {
        ...state,
        cart: {
          ...state.cart,
          shipping,
          subtotal,
          total,
        },
      };
    }
    
    case 'CLEAR_CART': {
      if (!state.cart) return state;
      
      return {
        ...state,
        cart: {
          ...state.cart,
          items: [],
          subtotal: 0,
          total: 0,
          discount: undefined,
          shipping: undefined,
          tax: 0,
        },
      };
    }
    
    default:
      return state;
  }
}

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  addToCart: (product: Product, quantity: number, variantOptions?: Record<string, string>) => Promise<void>;
  updateCartItem: (productId: string, quantity: number, variantOptions?: Record<string, string>) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  applyDiscountCode: (code: string) => Promise<boolean>;
  removeDiscountCode: () => Promise<void>;
  setShippingMethod: (method: ShippingMethod) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartItemCount: () => number;
  getCartTotal: () => number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user, isAuthenticated, accessToken } = useAuth();
  
  // Simple product cache to enrich cart items with localStorage persistence
  const [productCache, setProductCache] = useState<Record<string, Product>>(() => {
    try {
      const saved = localStorage.getItem('product_cache');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading product cache:', error);
      return {};
    }
  });

  // Generate session ID for guest users
  const getSessionId = () => {
    const stored = localStorage.getItem('cart_session_id');
    if (stored) return stored;
    
    const newSessionId = uuidv4();
    localStorage.setItem('cart_session_id', newSessionId);
    return newSessionId;
  };

  // Helper function to create empty guest cart
  const createEmptyGuestCart = (): Cart => ({
    id: 'guest-cart',
    userId: null,
    sessionId: getSessionId(),
    items: [],
    subtotal: 0,
    total: 0,
    tax: 0.0875, // 8.75% tax rate - adjust as needed
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Initialize cart when user loads
  useEffect(() => {
    initializeCart();
    if (isAuthenticated && accessToken) {
      loadProductCacheFromDatabase();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAuthenticated]);

  // Re-enrich cart items when product cache changes
  useEffect(() => {
    if (state.cart && Object.keys(productCache).length > 0) {
      const enrichedItems = state.cart.items.map(item => {
        const cachedProduct = productCache[item.productId];
        if (cachedProduct && (!item.productName || item.productName.startsWith('Product #'))) {
          return {
            ...item,
            productName: cachedProduct.name,
            productImage: cachedProduct.images?.[0]?.url,
          };
        }
        return item;
      });

      // Only update if items actually changed
      const hasChanges = enrichedItems.some((item, index) => 
        item.productName !== state.cart!.items[index].productName ||
        item.productImage !== state.cart!.items[index].productImage
      );

      if (hasChanges) {
        dispatch({ 
          type: 'SET_CART', 
          payload: { 
            ...state.cart, 
            items: enrichedItems 
          } 
        });
      }
    }
  }, [productCache, state.cart]);

  // Load product cache from database for authenticated users
  const loadProductCacheFromDatabase = async () => {
    if (!isAuthenticated || !accessToken || !state.cart) return;
    
    try {
      // Get unique product IDs from current cart
      const productIds = Array.from(new Set(state.cart.items.map(item => item.productId)));
      
      if (productIds.length > 0) {
        const response = await productCacheAPI.getProducts(productIds, accessToken);
        
        if (response.success && response.data) {
          const databaseProducts: Record<string, Product> = {};
          
          response.data.forEach((product: any) => {
            // Convert database product to Product interface format
            databaseProducts[product.product_id] = {
              id: product.product_id,
              name: product.name,
              description: product.description || '',
              price: parseFloat(product.price),
              images: product.image ? [{ 
                id: '1', 
                url: product.image, 
                altText: product.name,
                isPrimary: true,
                sortOrder: 0 
              }] : [],
              sku: product.sku || '',
              category: product.category,
              // Add other required Product interface fields with defaults
              shortDescription: '',
              tags: [],
              inventory: {
                trackQuantity: false,
                quantity: 0,
                lowStockThreshold: 0,
                allowBackorder: true,
              },
              shipping: {
                weight: 0,
                dimensions: { length: 0, width: 0, height: 0 },
                requiresShipping: true,
              },
              seo: {
                slug: product.name?.toLowerCase().replace(/\s+/g, '-') || '',
              },
              active: true,
              featured: false,
              createdAt: new Date(product.created_at || Date.now()),
              updatedAt: new Date(product.updated_at || Date.now()),
            } as Product;
          });
          
          // Merge with existing cache
          setProductCache(prev => {
            const merged = { ...prev, ...databaseProducts };
            
            // Update localStorage with merged cache
            try {
              localStorage.setItem('product_cache', JSON.stringify(merged));
            } catch (error) {
              console.error('Error saving merged product cache:', error);
            }
            
            console.log('Loaded product cache from database:', databaseProducts);
            return merged;
          });
        }
      }
    } catch (error) {
      console.error('Error loading product cache from database:', error);
      // Don't throw - this is enhancement, not critical functionality
    }
  };

  // Cleanup old product cache entries periodically (optional)
  useEffect(() => {
    const cleanupCache = () => {
      try {
        const cacheSize = JSON.stringify(productCache).length;
        // If cache is getting large (>50KB), we could clean it up
        // For now, just log the size
        if (cacheSize > 50000) {
          console.log('Product cache is getting large:', cacheSize, 'bytes');
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    };
    
    cleanupCache();
  }, [productCache]);

  const initializeCart = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      if (!user?.id) {
        // Check for existing guest cart in localStorage
        const savedGuestCart = localStorage.getItem('guest_cart');
        let guestCart: Cart;
        
        if (savedGuestCart) {
          try {
            const parsed = JSON.parse(savedGuestCart);
            // Check if cart items have the new format with productName
            const hasValidFormat = parsed.items?.every((item: any) => 
              item.productName !== undefined
            );
            
            if (hasValidFormat) {
              guestCart = {
                ...parsed,
                createdAt: new Date(parsed.createdAt),
                updatedAt: new Date(parsed.updatedAt),
              };
              console.log('Loaded guest cart from localStorage:', guestCart);
            } else {
              console.log('Outdated cart format detected, creating new cart');
              localStorage.removeItem('guest_cart');
              guestCart = createEmptyGuestCart();
            }
          } catch (error) {
            console.error('Error parsing saved guest cart:', error);
            localStorage.removeItem('guest_cart');
            guestCart = createEmptyGuestCart();
          }
        } else {
          guestCart = createEmptyGuestCart();
        }
        
        dispatch({ type: 'SET_CART', payload: guestCart });
        return;
      }

      // For authenticated users, get cart from API
      const response = await cartAPI.getCart(accessToken);
      
      if (response.success && response.data) {
        // Convert API response to Cart interface
        const apiCart = response.data;
        const cart: Cart = {
          id: apiCart.id,
          userId: user.id,
          sessionId: apiCart.session_id || null,
          items: apiCart.items?.map((item: any) => {
            // Try to get product details from cache
            const cachedProduct = productCache[item.product_id];
            
            return {
              id: item.id, // Database ID needed for API operations
              productId: item.product_id,
              productName: cachedProduct?.name || item.product_name || `Product #${item.product_id.slice(0, 8)}`,
              productImage: cachedProduct?.images?.[0]?.url || item.product_image,
              variantOptions: item.variant_options,
              quantity: item.quantity,
              price: item.price,
            };
          }) || [],
          subtotal: parseFloat(apiCart.subtotal || 0),
          total: parseFloat(apiCart.total || 0),
          tax: parseFloat(apiCart.tax || 0),
          discount: apiCart.discount_code ? {
            code: apiCart.discount_code,
            amount: parseFloat(apiCart.discount_amount || 0),
            type: apiCart.discount_type as 'percentage' | 'fixed',
          } : undefined,
          shipping: apiCart.shipping_method ? {
            method: apiCart.shipping_method,
            cost: parseFloat(apiCart.shipping_cost || 0),
          } : undefined,
          createdAt: new Date(apiCart.created_at),
          updatedAt: new Date(apiCart.updated_at),
        };
        
        dispatch({ type: 'SET_CART', payload: cart });
      }
    } catch (error) {
      console.error('Error initializing cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const saveCartToAPI = async (cart: Cart) => {
    // For guest users, save to localStorage
    if (!user?.id || cart.id === 'guest-cart') {
      localStorage.setItem('guest_cart', JSON.stringify(cart));
      return;
    }

    try {
      // For authenticated users, cart is automatically saved via API calls
      // No additional saving needed as each action calls the API directly
    } catch (error) {
      console.error('Error saving cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save cart' });
    }
  };

  const addToCart = async (
    product: Product, 
    quantity: number, 
    variantOptions?: Record<string, string>
  ) => {
    console.log('addToCart called with product:', product);
    if (!state.cart) return;
    
    if (!user?.id) {
      // For guest users, use local state
      const cartItem: CartItem = {
        productId: product.id,
        productName: product.name,
        productImage: product.images?.[0]?.url,
        variantOptions,
        quantity,
        price: product.price,
      };
      
      console.log('Adding cart item (guest):', cartItem);
      
      dispatch({ type: 'ADD_ITEM', payload: cartItem });
      
      setTimeout(async () => {
        if (state.cart) {
          await saveCartToAPI(state.cart);
        }
      }, 0);
      return;
    }

    try {
      // Cache the product data for enriching cart items
      setProductCache(prev => {
        const newCache = { ...prev, [product.id]: product };
        console.log('Updated product cache:', newCache);
        
        // Persist to localStorage
        try {
          localStorage.setItem('product_cache', JSON.stringify(newCache));
        } catch (error) {
          console.error('Error saving product cache:', error);
        }
        
        // Also store in database for persistent tracking
        if (isAuthenticated && accessToken) {
          productCacheAPI.storeProduct({
            product_id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.images?.[0]?.url,
            sku: product.sku,
            category: product.category,
          }, accessToken).catch(error => {
            console.error('Error storing product in database cache:', error);
            // Don't block the cart operation if database cache fails
          });
        }
        
        return newCache;
      });
      
      // For authenticated users, call API with full product details
      const response = await cartAPI.addToCart({
        product_id: product.id,
        quantity,
        variant_options: variantOptions,
        // Include product details for database storage
        product_name: product.name,
        product_image: product.images?.[0]?.url,
        product_price: product.price,
        product_description: product.description,
        product_sku: product.sku,
      }, accessToken);

      if (response.success) {
        // Refresh cart from server with product enrichment
        await initializeCart();
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to cart' });
    }
  };

  const updateCartItem = async (
    productId: string, 
    quantity: number, 
    variantOptions?: Record<string, string>
  ) => {
    if (!state.cart) return;
    
    if (isAuthenticated && accessToken) {
      // Find the cart item by productId and variant options
      const cartItem = state.cart.items.find(item => 
        item.productId === productId && 
        JSON.stringify(item.variantOptions) === JSON.stringify(variantOptions)
      );
      
      if (cartItem?.id) {
        try {
          await cartAPI.updateCartItem(cartItem.id, { quantity }, accessToken);
          // Refresh cart from server
          await initializeCart();
          return;
        } catch (error) {
          console.error('Error updating cart item:', error);
          dispatch({ type: 'SET_ERROR', payload: 'Failed to update cart item' });
          return;
        }
      }
    }
    
    // Fallback for guest users or if API call fails
    dispatch({ 
      type: 'UPDATE_ITEM', 
      payload: { productId, quantity, variantOptions } 
    });
    
    setTimeout(async () => {
      if (state.cart) {
        await saveCartToAPI(state.cart);
      }
    }, 0);
  };

  const removeFromCart = async (productId: string) => {
    if (!state.cart) return;
    
    if (isAuthenticated && accessToken) {
      // Find the cart item by productId
      const cartItem = state.cart.items.find(item => item.productId === productId);
      
      if (cartItem?.id) {
        try {
          await cartAPI.removeFromCart(cartItem.id, accessToken);
          // Refresh cart from server
          await initializeCart();
          return;
        } catch (error) {
          console.error('Error removing cart item:', error);
          dispatch({ type: 'SET_ERROR', payload: 'Failed to remove cart item' });
          return;
        }
      }
    }
    
    // Fallback for guest users or if API call fails
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
    
    setTimeout(async () => {
      if (state.cart) {
        await saveCartToAPI(state.cart);
      }
    }, 0);
  };

  const applyDiscountCode = async (code: string): Promise<boolean> => {
    if (!state.cart) return false;
    
    try {
      if (!isAuthenticated || !accessToken) {
        // For guest users, validate discount locally (simplified)
        const response = await discountsAPI.validateDiscount({
          code,
          cart_total: state.cart.subtotal,
        });

        if (response.success && response.data) {
          dispatch({ 
            type: 'APPLY_DISCOUNT', 
            payload: {
              code: response.data.code,
              amount: response.data.discount_amount,
              type: response.data.type,
            }
          });
          
          setTimeout(async () => {
            if (state.cart) {
              await saveCartToAPI(state.cart);
            }
          }, 0);

          return true;
        }
        
        dispatch({ type: 'SET_ERROR', payload: 'Invalid discount code' });
        return false;
      }

      // For authenticated users, apply through API
      const response = await discountsAPI.applyDiscount({
        code,
        user_id: user?.id, // Keep user.id for now as the API still expects it
      });

      if (response.success) {
        await initializeCart(); // Refresh cart from server
        return true;
      }
      
      dispatch({ type: 'SET_ERROR', payload: 'Invalid discount code' });
      return false;
    } catch (error) {
      console.error('Error applying discount code:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error applying discount code' });
      return false;
    }
  };

  const removeDiscountCode = async () => {
    if (!state.cart) return;
    
    if (!user?.id) {
      // For guest users, remove locally
      dispatch({ type: 'REMOVE_DISCOUNT' });
      
      setTimeout(async () => {
        if (state.cart) {
          await saveCartToAPI(state.cart);
        }
      }, 0);
      return;
    }

    try {
      // For authenticated users, remove through API
      await discountsAPI.removeDiscount(user.id);
      await initializeCart(); // Refresh cart from server
    } catch (error) {
      console.error('Error removing discount:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove discount' });
    }
  };

  const setShippingMethod = async (method: ShippingMethod) => {
    if (!state.cart) return;
    
    let cost = method.price;
    
    // Check for free shipping threshold
    if (method.freeShippingThreshold && state.cart.subtotal >= method.freeShippingThreshold) {
      cost = 0;
    }
    
    dispatch({ 
      type: 'SET_SHIPPING', 
      payload: { method: method.name, cost } 
    });
    
    setTimeout(async () => {
      if (state.cart) {
        await saveCartToAPI(state.cart);
      }
    }, 0);
  };

  const clearCart = async () => {
    if (!state.cart) return;
    
    if (isAuthenticated && accessToken) {
      try {
        await cartAPI.clearCart(accessToken);
        // Refresh cart from server
        await initializeCart();
        return;
      } catch (error) {
        console.error('Error clearing cart:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to clear cart' });
        return;
      }
    }
    
    // Fallback for guest users or if API call fails
    dispatch({ type: 'CLEAR_CART' });
    
    setTimeout(async () => {
      if (state.cart) {
        await saveCartToAPI(state.cart);
      }
    }, 0);
  };

  const getCartItemCount = (): number => {
    return state.cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;
  };

  const getCartTotal = (): number => {
    return state.cart?.total || 0;
  };

  const refreshCart = async () => {
    await initializeCart();
  };

  const contextValue: CartContextType = {
    cart: state.cart,
    isLoading: state.isLoading,
    error: state.error,
    addToCart,
    updateCartItem,
    removeFromCart,
    applyDiscountCode,
    removeDiscountCode,
    setShippingMethod,
    clearCart,
    getCartItemCount,
    getCartTotal,
    refreshCart,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;