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