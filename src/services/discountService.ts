import { apiService } from './apiService';

export interface Discount {
  id: string;
  name: string;
  code: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'bxgy';
  value: number;
  minimumOrderValue?: number;
  maximumDiscount?: number;
  applicableTo: 'all' | 'products' | 'services' | 'specific' | 'categories';
  validFrom: string;
  validUntil?: string;
  usageLimit?: number;
  usagePerCustomer?: number;
  currentUses: number;
  firstTimeCustomerOnly: boolean;
  combinableWithOthers: boolean;
  automaticallyApply: boolean;
  priority: number;
  active: boolean;
  notes?: string;
}

export interface AppliedDiscount {
  discount: Discount;
  discountAmount: number;
  appliedAt: string;
}

export interface DiscountValidationResult {
  valid: boolean;
  discount?: Discount;
  discountAmount?: number;
  error?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  serviceId?: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  type: 'product' | 'service';
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  discounts: AppliedDiscount[];
  totalDiscount: number;
  shipping: number;
  tax: number;
  total: number;
}

class DiscountService {
  // Get all active discounts
  async getActiveDiscounts(): Promise<Discount[]> {
    try {
      const response = await apiService.get('/discounts/active');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching active discounts:', error);
      return [];
    }
  }

  // Get automatic discounts for cart
  async getAutomaticDiscounts(cartItems: CartItem[], userId?: string): Promise<Discount[]> {
    try {
      const response = await apiService.post('/discounts/automatic', {
        cartItems,
        userId
      });
      return response.data.discounts;
    } catch (error) {
      console.error('Error fetching automatic discounts:', error);
      return [];
    }
  }

  // Validate a discount code
  async validateDiscountCode(
    code: string, 
    cartItems: CartItem[], 
    userId?: string
  ): Promise<DiscountValidationResult> {
    try {
      const response = await apiService.post('/discounts/validate', {
        code: code.toUpperCase().trim(),
        cartItems,
        userId
      });
      
      return {
        valid: true,
        discount: response.data.discount,
        discountAmount: response.data.discountAmount
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.response?.data?.message || 'Invalid discount code'
      };
    }
  }

  // Apply discounts to cart
  async applyDiscounts(
    cartItems: CartItem[], 
    discountCodes: string[] = [],
    userId?: string
  ): Promise<CartSummary> {
    try {
      const response = await apiService.post('/discounts/apply', {
        cartItems,
        discountCodes,
        userId
      });
      
      return response.data;
    } catch (error) {
      console.error('Error applying discounts:', error);
      
      // Return cart summary without discounts if service fails
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return {
        items: cartItems,
        subtotal,
        discounts: [],
        totalDiscount: 0,
        shipping: 0,
        tax: subtotal * 0.08, // 8% tax rate as default
        total: subtotal + (subtotal * 0.08)
      };
    }
  }

  // Calculate discount amount for a specific discount and cart
  calculateDiscountAmount(discount: Discount, cartItems: CartItem[], subtotal: number): number {
    let discountAmount = 0;
    
    // Filter applicable items
    const applicableItems = this.getApplicableItems(discount, cartItems);
    const applicableSubtotal = applicableItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (applicableSubtotal === 0) return 0;
    
    // Check minimum order value
    if (discount.minimumOrderValue && subtotal < discount.minimumOrderValue) {
      return 0;
    }
    
    switch (discount.type) {
      case 'percentage':
        discountAmount = applicableSubtotal * (discount.value / 100);
        if (discount.maximumDiscount && discountAmount > discount.maximumDiscount) {
          discountAmount = discount.maximumDiscount;
        }
        break;
        
      case 'fixed':
        discountAmount = Math.min(discount.value, applicableSubtotal);
        break;
        
      case 'free_shipping':
        // This would be handled in shipping calculation
        discountAmount = 0;
        break;
        
      case 'bxgy':
        // Buy X Get Y free logic would need additional configuration
        discountAmount = 0;
        break;
        
      default:
        discountAmount = 0;
    }
    
    return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
  }

  // Get items applicable for a specific discount
  private getApplicableItems(discount: Discount, cartItems: CartItem[]): CartItem[] {
    switch (discount.applicableTo) {
      case 'all':
        return cartItems;
        
      case 'products':
        return cartItems.filter(item => item.type === 'product');
        
      case 'services':
        return cartItems.filter(item => item.type === 'service');
        
      case 'specific':
        // This would require additional configuration to specify which items
        return cartItems;
        
      case 'categories':
        // This would require category matching
        return cartItems;
        
      default:
        return cartItems;
    }
  }

  // Format discount description for display
  formatDiscountDescription(discount: Discount): string {
    switch (discount.type) {
      case 'percentage':
        return `${discount.value}% off${discount.minimumOrderValue ? ` orders over $${discount.minimumOrderValue}` : ''}`;
        
      case 'fixed':
        return `$${discount.value} off${discount.minimumOrderValue ? ` orders over $${discount.minimumOrderValue}` : ''}`;
        
      case 'free_shipping':
        return `Free shipping${discount.minimumOrderValue ? ` on orders over $${discount.minimumOrderValue}` : ''}`;
        
      case 'bxgy':
        return 'Buy X Get Y Free';
        
      default:
        return discount.description || discount.name;
    }
  }

  // Check if discount is currently valid
  isDiscountValid(discount: Discount): boolean {
    const now = new Date();
    const validFrom = new Date(discount.validFrom);
    const validUntil = discount.validUntil ? new Date(discount.validUntil) : null;
    
    if (!discount.active) return false;
    if (now < validFrom) return false;
    if (validUntil && now > validUntil) return false;
    if (discount.usageLimit && discount.currentUses >= discount.usageLimit) return false;
    
    return true;
  }

  // Get best discount for cart (highest savings)
  getBestDiscount(discounts: Discount[], cartItems: CartItem[], subtotal: number): Discount | null {
    const validDiscounts = discounts.filter(d => this.isDiscountValid(d));
    
    if (validDiscounts.length === 0) return null;
    
    let bestDiscount = null;
    let maxSavings = 0;
    
    for (const discount of validDiscounts) {
      const savings = this.calculateDiscountAmount(discount, cartItems, subtotal);
      if (savings > maxSavings) {
        maxSavings = savings;
        bestDiscount = discount;
      }
    }
    
    return bestDiscount;
  }

  // Remove discount code
  async removeDiscountCode(code: string, cartItems: CartItem[], userId?: string): Promise<CartSummary> {
    try {
      const response = await apiService.post('/discounts/remove', {
        code: code.toUpperCase().trim(),
        cartItems,
        userId
      });
      
      return response.data;
    } catch (error) {
      console.error('Error removing discount:', error);
      throw error;
    }
  }
}

export const discountService = new DiscountService();
export default discountService;