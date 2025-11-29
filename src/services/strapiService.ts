import axios from 'axios';

const STRAPI_URL = process.env.REACT_APP_STRAPI_URL || 'http://localhost:1337';

// Create axios instance with base configuration
const strapiApi = axios.create({
  baseURL: `${STRAPI_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types for Strapi content
export interface StrapiProduct {
  id: number;
  documentId: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  image?: {
    id: number;
    url: string;
    alternativeText?: string;
  };
  gallery?: Array<{
    id: number;
    url: string;
    alternativeText?: string;
  }>;
  category?: {
    id: number;
    name: string;
    documentId: string;
  };
  featured: boolean;
  inStock: boolean;
  skinType?: string;
  ingredients?: string;
  howToUse?: string;
  benefits?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StrapiService {
  id: number;
  documentId: string;
  name: string;
  description: string;
  price: number;
  duration?: string;
  image?: {
    id: number;
    url: string;
    alternativeText?: string;
  };
  beforeAfterImages?: Array<{
    id: number;
    url: string;
    alternativeText?: string;
  }>;
  category?: {
    id: number;
    name: string;
    documentId: string;
  };
  featured: boolean;
  available: boolean;
  serviceType: string;
  skinType?: string;
  benefits?: string;
  preparation?: string;
  aftercare?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StrapiAddOn {
  id: number;
  documentId: string;
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  duration?: string;
  active: boolean;
  image?: {
    id: number;
    url: string;
    alternativeText?: string;
  };
  services?: Array<{
    id: number;
    name: string;
    documentId: string;
  }>;
  category?: string;
  benefits?: string;
  applicableServiceTypes?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StrapiCategory {
  id: number;
  documentId: string;
  name: string;
  description?: string;
  icon?: {
    id: number;
    url: string;
    alternativeText?: string;
  };
  image?: {
    id: number;
    url: string;
    alternativeText?: string;
  };
  products?: StrapiProduct[];
  services?: StrapiService[];
  active: boolean;
  featured: boolean;
  type: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to format image URLs
const formatImageUrl = (url: string) => {
  if (url.startsWith('http')) {
    return url;
  }
  return `${STRAPI_URL}${url}`;
};

// Helper function to format Strapi response data
const formatStrapiData = (data: any) => {
  if (Array.isArray(data)) {
    return data.map(item => formatStrapiItem(item));
  }
  return formatStrapiItem(data);
};

const formatStrapiItem = (item: any) => {
  if (!item) return item;
  
  // Format image URLs if they exist
  if (item.image?.url) {
    item.image.url = formatImageUrl(item.image.url);
  }
  
  if (item.gallery && Array.isArray(item.gallery)) {
    item.gallery = item.gallery.map((img: any) => ({
      ...img,
      url: formatImageUrl(img.url)
    }));
  }
  
  if (item.beforeAfterImages && Array.isArray(item.beforeAfterImages)) {
    item.beforeAfterImages = item.beforeAfterImages.map((img: any) => ({
      ...img,
      url: formatImageUrl(img.url)
    }));
  }
  
  if (item.icon?.url) {
    item.icon.url = formatImageUrl(item.icon.url);
  }
  
  return item;
};

// Products API
export const strapiService = {
  // Get all products
  async getProducts(featured?: boolean, limit?: number): Promise<StrapiProduct[]> {
    try {
      let url = '/products?populate=*';
      
      if (featured) {
        url += '&filters[featured][$eq]=true';
      }
      
      if (limit) {
        url += `&pagination[limit]=${limit}`;
      }
      
      url += '&sort=createdAt:desc';
      
      const response = await strapiApi.get(url);
      return formatStrapiData(response.data.data) as StrapiProduct[];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  // Get single product by document ID
  async getProduct(documentId: string): Promise<StrapiProduct | null> {
    try {
      const response = await strapiApi.get(`/products?filters[documentId][$eq]=${documentId}&populate=*`);
      const products = formatStrapiData(response.data.data) as StrapiProduct[];
      return products.length > 0 ? products[0] : null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  // Get all services
  async getServices(featured?: boolean, limit?: number): Promise<StrapiService[]> {
    try {
      let url = '/services?populate=*';
      
      if (featured) {
        url += '&filters[featured][$eq]=true';
      }
      
      if (limit) {
        url += `&pagination[limit]=${limit}`;
      }
      
      url += '&sort=createdAt:desc';
      
      const response = await strapiApi.get(url);
      return formatStrapiData(response.data.data) as StrapiService[];
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  },

  // Get single service by document ID
  async getService(documentId: string): Promise<StrapiService | null> {
    try {
      const response = await strapiApi.get(`/services?filters[documentId][$eq]=${documentId}&populate=*`);
      const services = formatStrapiData(response.data.data) as StrapiService[];
      return services.length > 0 ? services[0] : null;
    } catch (error) {
      console.error('Error fetching service:', error);
      return null;
    }
  },

  // Get all add-ons
  async getAddOns(active?: boolean, limit?: number): Promise<StrapiAddOn[]> {
    try {
      let url = '/add-ons?populate=*';
      
      if (active) {
        url += '&filters[active][$eq]=true';
      }
      
      if (limit) {
        url += `&pagination[limit]=${limit}`;
      }
      
      url += '&sort=createdAt:desc';
      
      const response = await strapiApi.get(url);
      return formatStrapiData(response.data.data) as StrapiAddOn[];
    } catch (error) {
      console.error('Error fetching add-ons:', error);
      return [];
    }
  },

  // Get single add-on by document ID
  async getAddOn(documentId: string): Promise<StrapiAddOn | null> {
    try {
      const response = await strapiApi.get(`/add-ons?filters[documentId][$eq]=${documentId}&populate=*`);
      const addOns = formatStrapiData(response.data.data) as StrapiAddOn[];
      return addOns.length > 0 ? addOns[0] : null;
    } catch (error) {
      console.error('Error fetching add-on:', error);
      return null;
    }
  },

  // Get all categories
  async getCategories(active?: boolean, featured?: boolean): Promise<StrapiCategory[]> {
    try {
      let url = '/categories?populate=*';
      
      if (active) {
        url += '&filters[active][$eq]=true';
      }
      
      if (featured) {
        url += '&filters[featured][$eq]=true';
      }
      
      url += '&sort=name:asc';
      
      const response = await strapiApi.get(url);
      return formatStrapiData(response.data.data) as StrapiCategory[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Get single category by document ID
  async getCategory(documentId: string): Promise<StrapiCategory | null> {
    try {
      const response = await strapiApi.get(`/categories?filters[documentId][$eq]=${documentId}&populate=*`);
      const categories = formatStrapiData(response.data.data) as StrapiCategory[];
      return categories.length > 0 ? categories[0] : null;
    } catch (error) {
      console.error('Error fetching category:', error);
      return null;
    }
  },

  // Search across products and services
  async search(query: string): Promise<{
    products: StrapiProduct[];
    services: StrapiService[];
  }> {
    try {
      const [productsResponse, servicesResponse] = await Promise.all([
        strapiApi.get(`/products?populate=*&filters[$or][0][name][$containsi]=${query}&filters[$or][1][description][$containsi]=${query}`),
        strapiApi.get(`/services?populate=*&filters[$or][0][name][$containsi]=${query}&filters[$or][1][description][$containsi]=${query}`)
      ]);

      return {
        products: formatStrapiData(productsResponse.data.data) as StrapiProduct[],
        services: formatStrapiData(servicesResponse.data.data) as StrapiService[]
      };
    } catch (error) {
      console.error('Error searching:', error);
      return { products: [], services: [] };
    }
  }
};

export default strapiService;