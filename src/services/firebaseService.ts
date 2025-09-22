import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Service, Booking, BusinessSettings, User } from '../types';
import { scheduleReminder, sendSMSReminder } from './twilioService';

// Services
export const servicesCollection = collection(db, 'services');
export const bookingsCollection = collection(db, 'bookings');
export const usersCollection = collection(db, 'users');
export const settingsDoc = doc(db, 'settings', 'business');

// Service operations
export const createService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
  const now = new Date();
  const service = {
    ...serviceData,
    createdAt: now,
    updatedAt: now
  };
  
  const docRef = await addDoc(servicesCollection, service);
  return docRef.id;
};

export const updateService = async (id: string, updates: Partial<Service>) => {
  const serviceRef = doc(db, 'services', id);
  await updateDoc(serviceRef, {
    ...updates,
    updatedAt: new Date()
  });
};

export const deleteService = async (id: string) => {
  const serviceRef = doc(db, 'services', id);
  await deleteDoc(serviceRef);
};

export const getServices = async (): Promise<Service[]> => {
  const q = query(servicesCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date()
  })) as Service[];
};

export const getActiveServices = async (): Promise<Service[]> => {
  const q = query(
    servicesCollection, 
    where('active', '==', true),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date()
  })) as Service[];
};

// Real-time services listener
export const subscribeToServices = (callback: (services: Service[]) => void) => {
  const q = query(servicesCollection, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const services = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Service[];
    
    callback(services);
  });
};

// Booking operations
export const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
  const now = new Date();
  const booking = {
    ...bookingData,
    createdAt: now,
    updatedAt: now
  };
  
  const docRef = await addDoc(bookingsCollection, booking);
  const bookingId = docRef.id;
  
  // Schedule SMS reminder if enabled and it's a real customer booking
  if (bookingData.clientName !== 'BLOCKED') {
    // Use setTimeout to avoid blocking the booking creation
    setTimeout(async () => {
      try {
        await scheduleBookingSMSReminder({ ...booking, id: bookingId });
      } catch (error) {
        console.error('Error scheduling SMS reminder:', error);
        // Don't fail the booking creation if SMS scheduling fails
      }
    }, 100);
  }
  
  return bookingId;
};

export const updateBooking = async (id: string, updates: Partial<Booking>) => {
  const bookingRef = doc(db, 'bookings', id);
  await updateDoc(bookingRef, {
    ...updates,
    updatedAt: new Date()
  });
};

export const deleteBooking = async (id: string) => {
  const bookingRef = doc(db, 'bookings', id);
  await deleteDoc(bookingRef);
};

export const getBookings = async (): Promise<Booking[]> => {
  const q = query(bookingsCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date()
  })) as Booking[];
};

export const getBookingsByDate = async (date: string): Promise<Booking[]> => {
  const q = query(
    bookingsCollection,
    where('date', '==', date),
    where('status', 'in', ['confirmed', 'pending'])
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date()
  })) as Booking[];
};

// Real-time bookings listener
export const subscribeToBookings = (callback: (bookings: Booking[]) => void) => {
  const q = query(bookingsCollection, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Booking[];
    
    callback(bookings);
  });
};

// Business settings operations
export const getBusinessSettings = async (): Promise<BusinessSettings | null> => {
  const snapshot = await getDoc(settingsDoc);
  
  if (snapshot.exists()) {
    return snapshot.data() as BusinessSettings;
  }
  
  return null;
};

export const updateBusinessSettings = async (settings: Partial<BusinessSettings>) => {
  try {
    await updateDoc(settingsDoc, settings);
  } catch (error: any) {
    // If document doesn't exist, create it with setDoc
    if (error.code === 'not-found') {
      await setDoc(settingsDoc, settings);
    } else {
      throw error;
    }
  }
};

export const initializeBusinessSettings = async () => {
  const snapshot = await getDoc(settingsDoc);
  
  if (!snapshot.exists()) {
    const defaultSettings: BusinessSettings = {
      businessName: 'Lashed By Anna',
      email: 'anaidmdiazplaza@gmail.com',
      phone: '321 316 9898',
      address: '',
      workingHours: {
        monday: { isOpen: true, startTime: '09:00', endTime: '21:00' },
        tuesday: { isOpen: true, startTime: '14:00', endTime: '18:00' },
        wednesday: { isOpen: true, startTime: '09:00', endTime: '21:00' },
        thursday: { isOpen: false, startTime: '09:00', endTime: '17:00' },
        friday: { isOpen: true, startTime: '14:00', endTime: '22:00' },
        saturday: { isOpen: true, startTime: '14:00', endTime: '22:00' },
        sunday: { isOpen: true, startTime: '14:00', endTime: '22:00' }
      },
      cancellationHours: 24,
      timeSlotDuration: 30,
      bufferTime: 15
    };
    
    await updateDoc(settingsDoc, defaultSettings as any);
    return defaultSettings;
  }
  
  return snapshot.data() as BusinessSettings;
};

// User operations
export const createOrUpdateUser = async (clerkUser: any, role: 'admin' | 'customer' = 'customer') => {
  const userData: Omit<User, 'id'> = {
    clerkId: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress || '',
    firstName: clerkUser.firstName || '',
    lastName: clerkUser.lastName || '',
    phone: clerkUser.phoneNumbers[0]?.phoneNumber || '',
    role,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const userRef = doc(db, 'users', clerkUser.id);
  const existingUser = await getDoc(userRef);
  
  if (existingUser.exists()) {
    // Update existing user but preserve role
    await updateDoc(userRef, {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      updatedAt: userData.updatedAt
    });
  } else {
    // Create new user with setDoc (not updateDoc)
    await setDoc(userRef, userData);
  }
  
  return userRef.id;
};

export const getUserByClerkId = async (clerkId: string): Promise<User | null> => {
  const userRef = doc(db, 'users', clerkId);
  const snapshot = await getDoc(userRef);
  
  if (snapshot.exists()) {
    return {
      id: snapshot.id,
      ...snapshot.data(),
      createdAt: snapshot.data().createdAt?.toDate() || new Date(),
      updatedAt: snapshot.data().updatedAt?.toDate() || new Date()
    } as User;
  }
  
  return null;
};

export const updateUserRole = async (clerkId: string, role: 'admin' | 'customer') => {
  const userRef = doc(db, 'users', clerkId);
  await updateDoc(userRef, {
    role,
    updatedAt: new Date()
  });
};

export const getUserBookings = async (clerkId: string): Promise<Booking[]> => {
  // Temporarily use a simpler query without ordering to avoid index requirement
  const q = query(
    bookingsCollection,
    where('clientId', '==', clerkId)
  );
  const snapshot = await getDocs(q);
  
  const bookings = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date()
  })) as Booking[];

  // Sort in JavaScript instead of Firestore
  return bookings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

// SMS Reminder Functions
export const scheduleBookingSMSReminder = async (booking: Booking): Promise<void> => {
  try {
    const businessSettings = await getBusinessSettings();
    
    if (!businessSettings) {
      console.log('No business settings found, skipping SMS reminder');
      return;
    }
    
    const smsSettings = businessSettings.smsReminders;
    
    if (!smsSettings?.enabled) {
      return; // SMS reminders are disabled
    }
    
    const reminder = scheduleReminder(booking, smsSettings);
    if (!reminder) {
      return; // No valid reminder created (invalid phone, etc.)
    }
    
    // Store the reminder in Firestore for tracking
    const remindersCollection = collection(db, 'smsReminders');
    await addDoc(remindersCollection, reminder);
    
    // In production, you would implement a job scheduler here
    // For now, we'll just log that the reminder is scheduled
    console.log('SMS reminder scheduled:', reminder);
    
    // TODO: Implement actual scheduling with a job queue or cron service
    // For immediate testing, you could check if the reminder time is close and send immediately
    
  } catch (error) {
    console.error('Error scheduling SMS reminder:', error);
    throw error;
  }
};

// Function to manually send SMS reminders (for testing or admin use)
export const sendImmediateSMSReminder = async (bookingId: string): Promise<boolean> => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnapshot = await getDoc(bookingRef);
    
    if (!bookingSnapshot.exists()) {
      throw new Error('Booking not found');
    }
    
    const booking = {
      id: bookingSnapshot.id,
      ...bookingSnapshot.data(),
      createdAt: bookingSnapshot.data().createdAt?.toDate() || new Date(),
      updatedAt: bookingSnapshot.data().updatedAt?.toDate() || new Date()
    } as Booking;
    
    const businessSettings = await getBusinessSettings();
    
    if (!businessSettings) {
      throw new Error('Business settings not found');
    }
    
    const smsSettings = businessSettings.smsReminders;
    
    if (!smsSettings?.enabled) {
      throw new Error('SMS reminders are not enabled');
    }
    
    const reminder = scheduleReminder(booking, smsSettings);
    if (!reminder) {
      throw new Error('Could not create SMS reminder for this booking');
    }
    
    return await sendSMSReminder(reminder.phoneNumber, reminder.message, smsSettings);
    
  } catch (error) {
    console.error('Error sending immediate SMS reminder:', error);
    throw error;
  }
};