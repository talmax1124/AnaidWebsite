import { apiService } from './apiService';

export interface WishlistItem {
  id: number;
  user_id: number;
  product_id: string;
  created_at: string;
  name?: string;
  description?: string;
  price?: number;
  sale_price?: number;
  image_url?: string;
  sku?: string;
  category?: string;
}

export interface ProductForWishlist {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
}

class WishlistService {
  private baseUrl = '/wishlist';

  // Get user's wishlist items
  async getWishlist(): Promise<WishlistItem[]> {
    try {
      const data = await apiService.get(this.baseUrl);
      
      // Ensure we always return an array
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object' && Array.isArray(data.items)) {
        return data.items;
      } else {
        console.warn('Unexpected wishlist response format:', data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      throw error;
    }
  }

  // Add item to wishlist
  async addToWishlist(productId: string, productData?: ProductForWishlist): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.post(`${this.baseUrl}/add`, {
        productId,
        productData
      });
      return response.data;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  }

  // Remove item from wishlist
  async removeFromWishlist(productId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.delete(`${this.baseUrl}/remove/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  }

  // Check if item is in wishlist
  async isInWishlist(productId: string): Promise<boolean> {
    try {
      const response = await apiService.get(`${this.baseUrl}/check/${productId}`);
      return response.data.isWishlisted;
    } catch (error) {
      console.error('Error checking wishlist status:', error);
      return false;
    }
  }

  // Get wishlist count
  async getWishlistCount(): Promise<number> {
    try {
      const response = await apiService.get(`${this.baseUrl}/count`);
      return response.data.count;
    } catch (error) {
      console.error('Error getting wishlist count:', error);
      return 0;
    }
  }
}

export const wishlistService = new WishlistService();