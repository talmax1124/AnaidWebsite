import { createClient } from '@sanity/client';

// Sanity client configuration
export const client = createClient({
  projectId: 'rtfvvoxt',
  dataset: 'production',
  useCdn: true, // Enable CDN which has better CORS configuration
  apiVersion: '2023-11-28',
  token: undefined, // Public access for now
  perspective: 'published', // Only fetch published documents
  stega: false, // Disable stega for better performance
});

// Types for Sanity content
export interface SanityProduct {
  _id: string;
  name: string;
  slug: {
    current: string;
  };
  price: number;
  salePrice?: number;
  image?: {
    asset: {
      _ref: string;
      url?: string;
    };
    alt?: string;
  };
  gallery?: Array<{
    asset: {
      _ref: string;
      url?: string;
    };
    alt?: string;
  }>;
  description?: string;
  details?: any[];
  ingredients?: string;
  howToUse?: string;
  benefits?: string[];
  skinType?: string;
  category?: {
    _id: string;
    name: string;
    slug: {
      current: string;
    };
  };
  featured: boolean;
  inStock: boolean;
  inventory?: number;
}

export interface SanityService {
  _id: string;
  name: string;
  slug: {
    current: string;
  };
  price: number;
  duration?: number;
  image?: {
    asset: {
      _ref: string;
      url?: string;
    };
    alt?: string;
  };
  description?: string;
  fullDescription?: any[];
  benefits?: string[];
  category?: string;
  addOns?: SanityAddOn[];
  featured: boolean;
  active: boolean;
}

export interface SanityCategory {
  _id: string;
  name: string;
  slug: {
    current: string;
  };
  description?: string;
  image?: {
    asset: {
      _ref: string;
      url?: string;
    };
    alt?: string;
  };
  parent?: {
    _id: string;
    name: string;
  };
}

export interface SanityAddOn {
  _id: string;
  name: string;
  price: number;
  description?: string;
  active: boolean;
}

export interface SanityDiscount {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  description?: string;
  minimumOrderValue?: number;
  usageLimit?: number;
  currentUses?: number;
  validFrom?: string;
  validUntil?: string;
  active: boolean;
  automaticallyApply?: boolean;
  applicableTo?: 'all' | 'products' | 'services';
  applicableProducts?: string[];
  applicableCategories?: string[];
}

// API functions
export const sanityService = {
  // Get all products
  async getProducts(): Promise<SanityProduct[]> {
    try {
      const result = await client.fetch(`
        *[_type == "product" && inStock == true] | order(featured desc, name asc) {
          _id,
          name,
          slug,
          price,
          salePrice,
          image {
            asset-> {
              _id,
              url
            },
            alt
          },
          gallery[] {
            asset-> {
              _id,
              url
            },
            alt
          },
          description,
          details,
          ingredients,
          howToUse,
          benefits,
          skinType,
          category-> {
            _id,
            name,
            slug
          },
          featured,
          inStock,
          inventory
        }
      `);
      return result;
    } catch (error) {
      console.error('Error fetching products from Sanity:', error);
      throw error;
    }
  },

  // Get featured products
  async getFeaturedProducts(): Promise<SanityProduct[]> {
    try {
      return await client.fetch(`
        *[_type == "product" && featured == true && inStock == true] | order(name asc) {
          _id,
          name,
          slug,
          price,
          salePrice,
          image {
            asset-> {
              _id,
              url
            },
            alt
          },
          description,
          featured,
          inStock
        }
      `);
    } catch (error) {
      console.error('Error fetching featured products from Sanity:', error);
      throw error;
    }
  },

  // Get product by slug
  async getProductBySlug(slug: string): Promise<SanityProduct | null> {
    try {
      const result = await client.fetch(`
      *[_type == "product" && slug.current == $slug][0] {
        _id,
        name,
        slug,
        price,
        salePrice,
        image {
          asset-> {
            _id,
            url
          },
          alt
        },
        gallery[] {
          asset-> {
            _id,
            url
          },
          alt
        },
        description,
        details,
        ingredients,
        howToUse,
        benefits,
        skinType,
        category-> {
          _id,
          name,
          slug
        },
        featured,
        inStock,
        inventory
      }
    `, { slug });
    
      return result || null;
    } catch (error) {
      console.error('Error fetching product by slug from Sanity:', error);
      return null;
    }
  },

  // Get all services
  async getServices(): Promise<SanityService[]> {
    try {
      return await client.fetch(`
      *[_type == "service" && active == true] | order(featured desc, name asc) {
        _id,
        name,
        slug,
        price,
        duration,
        image {
          asset-> {
            _id,
            url
          },
          alt
        },
        description,
        fullDescription,
        benefits,
        category,
        addOns[]-> {
          _id,
          name,
          price,
          description,
          active
        },
        featured,
        active
      }
    `);
    } catch (error) {
      console.error('Error fetching services from Sanity:', error);
      throw error;
    }
  },

  // Get service by slug
  async getServiceBySlug(slug: string): Promise<SanityService | null> {
    try {
      const result = await client.fetch(`
        *[_type == "service" && slug.current == $slug][0] {
          _id,
          name,
          slug,
          price,
          duration,
          image {
            asset-> {
              _id,
              url
            },
            alt
          },
          description,
          fullDescription,
          benefits,
          category,
          addOns[]-> {
            _id,
            name,
            price,
            description,
            active
          },
          featured,
          active
        }
      `, { slug });
      
      return result || null;
    } catch (error) {
      console.error('Error fetching service by slug from Sanity:', error);
      return null;
    }
  },

  // Get all categories
  async getCategories(): Promise<SanityCategory[]> {
    try {
      return await client.fetch(`
        *[_type == "category"] | order(name asc) {
          _id,
          name,
          slug,
          description,
          image {
            asset-> {
              _id,
              url
            },
            alt
          },
          parent-> {
            _id,
            name
          }
        }
      `);
    } catch (error) {
      console.error('Error fetching categories from Sanity:', error);
      return [];
    }
  },

  // Search products
  async searchProducts(searchTerm: string): Promise<SanityProduct[]> {
    try {
      return await client.fetch(`
        *[_type == "product" && inStock == true && (
          name match $searchTerm + "*" ||
          description match $searchTerm + "*" ||
          ingredients match $searchTerm + "*" ||
          skinType match $searchTerm + "*"
        )] | order(featured desc, name asc) {
          _id,
          name,
          slug,
          price,
          salePrice,
          image {
            asset-> {
              _id,
              url
            },
            alt
          },
          description,
          featured,
          inStock
        }
      `, { searchTerm });
    } catch (error) {
      console.error('Error searching products from Sanity:', error);
      return [];
    }
  },

  // Get products by category
  async getProductsByCategory(categoryId: string): Promise<SanityProduct[]> {
    try {
      return await client.fetch(`
        *[_type == "product" && inStock == true && category._ref == $categoryId] | order(featured desc, name asc) {
          _id,
          name,
          slug,
          price,
          salePrice,
          image {
            asset-> {
              _id,
              url
            },
            alt
          },
          description,
          featured,
          inStock
        }
      `, { categoryId });
    } catch (error) {
      console.error('Error fetching products by category from Sanity:', error);
      return [];
    }
  },

  // Get all active discount codes
  async getActiveDiscounts(): Promise<SanityDiscount[]> {
    try {
      const result = await client.fetch(`
        *[_type == "discount" && active == true && (!defined(validUntil) || validUntil > now())] | order(validFrom desc) {
          _id,
          code,
          type,
          value,
          description,
          minimumOrderValue,
          usageLimit,
          currentUses,
          validFrom,
          validUntil,
          active,
          automaticallyApply,
          applicableTo,
          applicableProducts,
          applicableCategories
        }
      `);
      return result;
    } catch (error) {
      console.error('Error fetching active discounts from Sanity:', error);
      return [];
    }
  },

  // Get discount by code
  async getDiscountByCode(code: string): Promise<SanityDiscount | null> {
    try {
      const result = await client.fetch(`
        *[_type == "discount" && code == $code && active == true][0] {
          _id,
          code,
          type,
          value,
          description,
          minimumOrderValue,
          usageLimit,
          currentUses,
          validFrom,
          validUntil,
          active,
          automaticallyApply,
          applicableTo,
          applicableProducts,
          applicableCategories
        }
      `, { code: code.toUpperCase() });
      return result || null;
    } catch (error) {
      console.error('Error fetching discount by code from Sanity:', error);
      return null;
    }
  },

  // Update discount usage count
  async incrementDiscountUsage(discountId: string): Promise<boolean> {
    try {
      // Note: This requires write access token and would normally be done on the backend
      // For now, we'll just return true as usage tracking would be handled server-side
      console.log(`Would increment usage for discount ${discountId}`);
      return true;
    } catch (error) {
      console.error('Error incrementing discount usage:', error);
      return false;
    }
  }
};

// Helper function to get optimized image URL
export const getImageUrl = (image: any, width?: number, height?: number): string => {
  if (!image?.asset?.url) return '/placeholder-product.jpg';
  
  // For now, return the direct URL since we need to set up image-url properly
  return image.asset.url;
};

export default sanityService;
