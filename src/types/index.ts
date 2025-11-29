export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  icon: string;
  category: 'lashes' | 'brows' | 'facial' | 'skincare' | 'waxing' | 'nails' | 'hair' | 'massage' | 'makeup' | 'microblading' | 'permanent-makeup' | 'brow-lamination' | 'lip-blush' | 'lash-lift' | 'hydrafacial' | 'chemical-peel' | 'microneedling' | 'dermaplaning' | 'eyebrow-tinting' | 'lash-tinting' | 'threading' | 'body-contouring' | 'lymphatic-drainage' | 'acne-treatment' | 'anti-aging' | 'brightening' | 'sensitive-skin' | 'consultation' | 'package-deals' | 'seasonal-special' | 'other';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // additional minutes
  icon: string;
  category: 'lashes' | 'brows' | 'aftercare' | 'enhancement' | 'skincare' | 'tools' | 'products' | 'massage' | 'facial' | 'waxing' | 'nails' | 'hair' | 'makeup' | 'wellness' | 'hydration' | 'cleansing' | 'exfoliation' | 'serum' | 'moisturizer' | 'sunscreen' | 'primer' | 'setting' | 'removal' | 'prep' | 'tinting' | 'lifting' | 'lamination' | 'brightening' | 'soothing' | 'anti-aging' | 'acne-care' | 'sensitive-care' | 'luxury' | 'travel-size' | 'gift-set' | 'other';
  active: boolean;
  compatibleServices: string[]; // Service IDs this add-on is compatible with
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkingHours {
  [key: string]: {
    isOpen: boolean;
    startTime: string; // "09:00"
    endTime: string; // "17:00"
  };
}

export interface TimeSlot {
  time: string;
  available: boolean;
  serviceId?: string;
}

export interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientId?: string; // Clerk user ID for authenticated bookings
  serviceId: string;
  serviceName: string;
  addOns?: {
    id: string;
    name: string;
    price: number;
    duration: number;
  }[]; // Selected add-ons for this booking
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // Total duration including add-ons
  price: number; // Total price including add-ons
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show' | 'in-progress' | 'rescheduled';
  notes?: string;
  serviceNotes?: string; // Admin notes about the service performed
  paymentStatus: 'unpaid' | 'paid' | 'partial' | 'refunded';
  paymentMethod?: string;
  cancellationFee?: number; // For late cancellations
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessSettings {
  businessName: string;
  email: string;
  phone: string;
  address: string;
  workingHours: WorkingHours;
  cancellationHours: number;
  timeSlotDuration: number; // in minutes
  bufferTime: number; // in minutes between appointments
  smsReminders?: {
    enabled: boolean;
    reminderHours: number;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioPhoneNumber?: string;
    messageTemplate: string;
  };
}

export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'admin' | 'customer';
  createdAt: Date;
  updatedAt: Date;
}

// E-commerce Types
export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number; // original price for showing discounts
  sku: string;
  category: ProductCategory;
  subcategory?: string;
  tags: string[];
  images: ProductImage[];
  inventory: {
    trackQuantity: boolean;
    quantity: number;
    lowStockThreshold: number;
    allowBackorder: boolean;
  };
  variants?: ProductVariant[]; // for different sizes, colors, etc.
  shipping: {
    weight: number; // in grams
    dimensions: {
      length: number; // in cm
      width: number;
      height: number;
    };
    requiresShipping: boolean;
  };
  seo: {
    title?: string;
    metaDescription?: string;
    slug: string;
  };
  active: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g., "Color", "Size"
  options: ProductVariantOption[];
}

export interface ProductVariantOption {
  id: string;
  value: string; // e.g., "Red", "Large"
  price?: number; // price adjustment
  sku?: string;
  inventory?: number;
}

export type ProductCategory = 
  | 'lash-care'
  | 'brow-care' 
  | 'skincare'
  | 'makeup'
  | 'tools'
  | 'accessories'
  | 'gift-sets'
  | 'aftercare'
  | 'cleansers'
  | 'serums'
  | 'moisturizers'
  | 'treatments'
  | 'professional'
  | 'home-care'
  | 'new-arrivals'
  | 'bestsellers'
  | 'sale';

export interface CartItem {
  id?: string; // Database ID for cart items (needed for API operations)
  productId: string;
  productName: string;
  productImage?: string; // Primary product image URL
  variantOptions?: Record<string, string>; // variant selections
  quantity: number;
  price: number; // price at time of adding to cart
}

export interface Cart {
  id: string;
  userId?: string;
  sessionId: string; // for guest users
  items: CartItem[];
  subtotal: number;
  discount?: {
    code: string;
    amount: number;
    type: 'percentage' | 'fixed';
  };
  shipping?: {
    method: string;
    cost: number;
  };
  tax?: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount?: {
    code: string;
    amount: number;
    type: 'percentage' | 'fixed';
  };
  shipping: {
    method: string;
    cost: number;
    address: Address;
    trackingNumber?: string;
  };
  tax: number;
  total: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially-refunded';
  fulfillmentStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'paypal' | 'card' | 'cash' | 'store-credit';
  paymentId?: string; // PayPal transaction ID
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  variantOptions?: Record<string, string>;
  quantity: number;
  price: number; // price at time of order
  image?: string;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  phone?: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free-shipping';
  value: number; // percentage (0-100) or fixed amount
  minimumAmount?: number; // minimum cart value to apply
  maximumUses?: number;
  currentUses: number;
  validFrom: Date;
  validUntil: Date;
  applicableProducts?: string[]; // product IDs, empty means all products
  applicableCategories?: ProductCategory[];
  active: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  price: number;
  freeShippingThreshold?: number;
  estimatedDays: {
    min: number;
    max: number;
  };
  weightLimit?: number; // in grams
  zones: string[]; // shipping zones this method applies to
  active: boolean;
}