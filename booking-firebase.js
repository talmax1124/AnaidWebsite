// Firebase Booking Integration for Lashed By Anna
import { db } from './firebase-config.js';
import { 
    collection, 
    doc, 
    addDoc, 
    getDocs, 
    getDoc, 
    query, 
    where, 
    orderBy,
    Timestamp 
} from 'firebase/firestore';
import { emailService } from './firebase/email-service.js';

class BookingFirebaseIntegration {
    constructor() {
        this.services = [];
        this.businessSettings = {};
        this.availableSlots = [];
        this.bookedSlots = new Set();
        
        this.init();
    }

    async init() {
        try {
            await this.loadFirebaseData();
            console.log('✅ Firebase booking integration initialized');
        } catch (error) {
            console.error('❌ Error initializing Firebase booking:', error);
        }
    }

    async loadFirebaseData() {
        await Promise.all([
            this.loadServices(),
            this.loadBusinessSettings(),
            this.loadAvailableSlots(),
            this.loadBookedSlots()
        ]);
    }

    async loadServices() {
        try {
            const servicesQuery = query(
                collection(db, 'services'),
                where('isActive', '==', true),
                orderBy('price')
            );
            
            const servicesSnapshot = await getDocs(servicesQuery);
            this.services = servicesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Update the booking system services
            if (window.bookingSystem) {
                window.bookingSystem.services = this.services;
                window.bookingSystem.renderServices();
            }
            
        } catch (error) {
            console.error('Error loading services:', error);
        }
    }

    async loadBusinessSettings() {
        try {
            const settingsDoc = await getDoc(doc(db, 'businessSettings', 'main'));
            if (settingsDoc.exists()) {
                this.businessSettings = settingsDoc.data();
            }
        } catch (error) {
            console.error('Error loading business settings:', error);
        }
    }

    async loadAvailableSlots() {
        try {
            const slotsSnapshot = await getDocs(collection(db, 'availableSlots'));
            this.availableSlots = slotsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error loading available slots:', error);
        }
    }

    async loadBookedSlots() {
        try {
            // Get all confirmed appointments from today onwards
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const appointmentsQuery = query(
                collection(db, 'appointments'),
                where('appointmentDateTime', '>=', Timestamp.fromDate(today)),
                where('status', 'in', ['confirmed', 'pending'])
            );
            
            const appointmentsSnapshot = await getDocs(appointmentsQuery);
            
            this.bookedSlots.clear();
            appointmentsSnapshot.docs.forEach(doc => {
                const appointment = doc.data();
                const dateTime = appointment.appointmentDateTime.toDate();
                const slotKey = this.generateSlotKey(dateTime);
                this.bookedSlots.add(slotKey);
            });
            
        } catch (error) {
            console.error('Error loading booked slots:', error);
        }
    }

    generateSlotKey(dateTime) {
        const year = dateTime.getFullYear();
        const month = String(dateTime.getMonth() + 1).padStart(2, '0');
        const day = String(dateTime.getDate()).padStart(2, '0');
        const hour = String(dateTime.getHours()).padStart(2, '0');
        const minute = String(dateTime.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}-${hour}:${minute}`;
    }

    isSlotAvailable(dateTime) {
        const slotKey = this.generateSlotKey(dateTime);
        return !this.bookedSlots.has(slotKey);
    }

    getAvailableTimeSlotsForDate(selectedDate) {
        const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const availableSlot = this.availableSlots.find(slot => slot.dayOfWeek === dayOfWeek);
        
        if (!availableSlot || !availableSlot.isAvailable) {
            return [];
        }

        const slots = [];
        const [startHour, startMinute] = availableSlot.startTime.split(':').map(Number);
        const [endHour, endMinute] = availableSlot.endTime.split(':').map(Number);
        
        // Generate 15-minute intervals
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                const slotTime = new Date(selectedDate);
                slotTime.setHours(hour, minute, 0, 0);
                
                // Don't exceed the end time
                if (hour === endHour - 1 && minute + 15 > endMinute) {
                    break;
                }
                
                if (hour === endHour && minute >= endMinute) {
                    break;
                }
                
                // Check if slot is available and not in the past
                if (slotTime > new Date() && this.isSlotAvailable(slotTime)) {
                    slots.push({
                        time: slotTime,
                        timeString: slotTime.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        })
                    });
                }
            }
        }
        
        return slots;
    }

    async submitBooking(bookingData) {
        try {
            // Validate booking data
            if (!this.validateBookingData(bookingData)) {
                throw new Error('Invalid booking data');
            }

            // Check if slot is still available
            const appointmentDateTime = new Date(bookingData.appointmentDateTime);
            if (!this.isSlotAvailable(appointmentDateTime)) {
                throw new Error('Selected time slot is no longer available');
            }

            // Get service details
            const service = this.services.find(s => s.id === bookingData.serviceId);
            if (!service) {
                throw new Error('Service not found');
            }

            // Calculate total price
            const totalPrice = service.price;

            // Create appointment document
            const appointmentData = {
                clientName: bookingData.clientName,
                clientEmail: bookingData.clientEmail,
                clientPhone: bookingData.clientPhone,
                serviceId: bookingData.serviceId,
                serviceName: service.name,
                serviceCode: service.serviceCode,
                appointmentDateTime: Timestamp.fromDate(appointmentDateTime),
                duration: service.durationMinutes,
                totalPrice: totalPrice,
                status: this.businessSettings.autoConfirmBookings ? 'confirmed' : 'pending',
                notes: bookingData.notes || '',
                specialRequests: bookingData.specialRequests || '',
                isFirstTime: bookingData.isFirstTime || false,
                reminderSent: false,
                confirmationSent: false,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            };

            // Add appointment to Firestore
            const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
            
            console.log('✅ Appointment created with ID:', docRef.id);

            // Update local booked slots
            this.bookedSlots.add(this.generateSlotKey(appointmentDateTime));

            // Send email notification based on status
            const appointmentWithId = {
                ...appointmentData,
                id: docRef.id
            };
            
            const templateType = appointmentData.status === 'confirmed' ? 'confirmation' : 'pending';
            await emailService.sendBookingNotification(appointmentWithId, templateType);

            return {
                success: true,
                bookingId: docRef.id,
                status: appointmentData.status,
                message: this.businessSettings.autoConfirmBookings 
                    ? 'Your appointment has been confirmed!'
                    : 'Your booking request has been received and is pending approval.'
            };

        } catch (error) {
            console.error('❌ Error submitting booking:', error);
            return {
                success: false,
                message: error.message || 'Failed to submit booking. Please try again.'
            };
        }
    }

    validateBookingData(data) {
        const required = ['clientName', 'clientEmail', 'clientPhone', 'serviceId', 'appointmentDateTime'];
        
        for (const field of required) {
            if (!data[field]) {
                console.error(`Missing required field: ${field}`);
                return false;
            }
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.clientEmail)) {
            console.error('Invalid email format');
            return false;
        }

        // Validate phone format (basic)
        const phoneRegex = /^[\d\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(data.clientPhone.replace(/\s/g, ''))) {
            console.error('Invalid phone format');
            return false;
        }

        return true;
    }


    async getBookingStatus(bookingId) {
        try {
            const appointmentDoc = await getDoc(doc(db, 'appointments', bookingId));
            
            if (!appointmentDoc.exists()) {
                return {
                    found: false,
                    message: 'Booking not found'
                };
            }

            const appointment = appointmentDoc.data();
            
            return {
                found: true,
                status: appointment.status,
                appointment: {
                    ...appointment,
                    appointmentDateTime: appointment.appointmentDateTime.toDate()
                }
            };
            
        } catch (error) {
            console.error('❌ Error getting booking status:', error);
            return {
                found: false,
                message: 'Error retrieving booking status'
            };
        }
    }

    // Method to check availability for booking system
    async checkAvailability(date, serviceId) {
        await this.loadBookedSlots(); // Refresh booked slots
        
        const availableSlots = this.getAvailableTimeSlotsForDate(date);
        
        // Filter out slots that don't provide enough time for the service
        const service = this.services.find(s => s.id === serviceId);
        if (service) {
            // For services longer than 15 minutes, ensure consecutive slots are available
            const serviceDuration = service.durationMinutes;
            const slotsNeeded = Math.ceil(serviceDuration / 15);
            
            return availableSlots.filter((slot, index) => {
                // Check if we have enough consecutive slots
                for (let i = 1; i < slotsNeeded; i++) {
                    const nextSlotTime = new Date(slot.time.getTime() + (15 * 60 * 1000 * i));
                    if (!this.isSlotAvailable(nextSlotTime)) {
                        return false;
                    }
                }
                return true;
            });
        }
        
        return availableSlots;
    }

    // Integration with existing booking system
    integrateWithBookingSystem(bookingSystemInstance) {
        if (!bookingSystemInstance) {
            console.error('❌ Booking system instance not found');
            return;
        }

        // Override the booking system's data loading methods
        bookingSystemInstance.loadAvailableSlots = async (date, serviceId) => {
            return await this.checkAvailability(date, serviceId);
        };

        bookingSystemInstance.submitBooking = async (bookingData) => {
            return await this.submitBooking(bookingData);
        };

        bookingSystemInstance.services = this.services;

        console.log('✅ Booking system integrated with Firebase');
    }
}

// Initialize Firebase booking integration
const bookingFirebaseIntegration = new BookingFirebaseIntegration();

// Export for use in other modules
export { BookingFirebaseIntegration, bookingFirebaseIntegration };

// Make available globally for the booking system
window.bookingFirebaseIntegration = bookingFirebaseIntegration;