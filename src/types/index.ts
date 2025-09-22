export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  icon: string;
  category: 'lashes' | 'brows' | 'other';
  active: boolean;
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
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number;
  price: number;
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