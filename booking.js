// Comprehensive Booking System for Lashed By Anna
import { bookingFirebaseIntegration } from './booking-firebase.js';

class BookingSystem {
    constructor() {
        this.currentStep = 1;
        this.selectedService = null;
        this.selectedDate = null;
        this.selectedTime = null;
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.bookingData = {};
        this.firebaseIntegration = null;
        
        // Services will be loaded from Firebase
        this.services = [];
        
        // Available time slots will be loaded from Firebase
        this.availableSlots = {};
        
        // Booked appointments will be loaded from Firebase
        this.bookedAppointments = [];
        
        this.init();
    }
    
    async init() {
        try {
            // Initialize Firebase integration
            this.firebaseIntegration = bookingFirebaseIntegration;
            
            // Wait for Firebase data to load
            await this.waitForFirebaseIntegration();
            
            // Integrate with Firebase
            this.firebaseIntegration.integrateWithBookingSystem(this);
            
            this.setupEventListeners();
            this.renderServices();
            this.renderCalendar();
            this.updateNavigationButtons();
            
            console.log('✅ Booking system initialized with Firebase integration');
        } catch (error) {
            console.error('❌ Error initializing booking system:', error);
            // Fallback to local data if Firebase fails
            this.initializeFallbackData();
            this.setupEventListeners();
            this.renderServices();
            this.renderCalendar();
            this.updateNavigationButtons();
        }
    }
    
    async waitForFirebaseIntegration() {
        // Wait for Firebase integration to be ready
        let attempts = 0;
        while (attempts < 50 && (!this.firebaseIntegration.services || this.firebaseIntegration.services.length === 0)) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (this.firebaseIntegration.services && this.firebaseIntegration.services.length > 0) {
            this.services = this.firebaseIntegration.services;
        }
    }
    
    initializeFallbackData() {
        // Fallback services data
        this.services = [
            {
                id: 'classic-lashes',
                name: 'Classic Lashes',
                description: 'Natural-looking lash extensions',
                duration: 120,
                durationMinutes: 120,
                price: 120.00
            },
            {
                id: 'volume-lashes',
                name: 'Volume Lashes',
                description: 'Fuller, dramatic lashes',
                duration: 150,
                durationMinutes: 150,
                price: 150.00
            }
        ];
        
        // Fallback available slots
        this.availableSlots = {
            1: ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30'], // Monday 9AM-9PM
            2: ['14:00', '15:00', '16:00', '17:00'], // Tuesday 2PM-6PM  
            3: ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30'], // Wednesday 9AM-9PM
            4: [], // Thursday - closed
            5: ['14:00', '15:30', '17:00', '18:30', '20:00'], // Friday 2PM-10PM
            6: ['14:00', '15:30', '17:00', '18:30', '20:00'], // Saturday 2PM-10PM
            0: ['14:00', '15:30', '17:00', '18:30', '20:00'] // Sunday 2PM-10PM
        };
        
        console.log('⚠️ Using fallback data - Firebase integration failed');
    }
    
    renderServices() {
        const servicesContainer = document.querySelector('.services-grid');
        if (!servicesContainer || this.services.length === 0) return;
        
        servicesContainer.innerHTML = this.services.map(service => `
            <div class="service-option" data-service="${service.id}" data-duration="${service.durationMinutes}" data-price="${service.price}">
                <div class="service-icon">✨</div>
                <h4>${service.name}</h4>
                <p>${service.description}</p>
                <div class="service-details">
                    <span class="duration">${service.durationMinutes} min</span>
                    <span class="price">$${service.price}</span>
                </div>
            </div>
        `).join('');
        
        // Re-attach event listeners for new elements
        this.attachServiceListeners();
    }
    
    attachServiceListeners() {
        const serviceOptions = document.querySelectorAll('.service-option');
        serviceOptions.forEach(option => {
            option.addEventListener('click', (e) => this.selectService(e));
        });
    }
    
    setupEventListeners() {
        // Navigation buttons
        const nextBtn = document.getElementById('next-step');
        const prevBtn = document.getElementById('prev-step');
        const confirmBtn = document.getElementById('confirm-booking');
        
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevStep());
        if (confirmBtn) confirmBtn.addEventListener('click', () => this.confirmBooking());
        
        
        // Calendar navigation
        const prevMonthBtn = document.getElementById('prev-month');
        const nextMonthBtn = document.getElementById('next-month');
        
        if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => this.prevMonth());
        if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => this.nextMonth());
        
        // Modal controls
        const closeModalBtn = document.getElementById('close-modal');
        const addToGoogleBtn = document.getElementById('add-to-google');
        const addToAppleBtn = document.getElementById('add-to-apple');
        
        if (closeModalBtn) closeModalBtn.addEventListener('click', () => this.closeModal());
        if (addToGoogleBtn) addToGoogleBtn.addEventListener('click', () => this.addToGoogleCalendar());
        if (addToAppleBtn) addToAppleBtn.addEventListener('click', () => this.addToAppleCalendar());
        
        // Form validation
        const form = document.getElementById('booking-form');
        if (form) {
            form.addEventListener('input', () => this.validateForm());
        }
        
        // Initial service listeners
        this.attachServiceListeners();
    }
    
    selectService(e) {
        // Remove previous selection
        document.querySelectorAll('.service-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Add selection to clicked option
        e.currentTarget.classList.add('selected');
        
        // Find the full service object from Firebase data
        const serviceId = e.currentTarget.dataset.service;
        const serviceData = this.services.find(service => service.id === serviceId);
        
        if (serviceData) {
            this.selectedService = serviceData;
        } else {
            // Fallback to DOM data
            this.selectedService = {
                id: serviceId,
                type: serviceId,
                name: e.currentTarget.querySelector('h4').textContent,
                duration: parseInt(e.currentTarget.dataset.duration),
                durationMinutes: parseInt(e.currentTarget.dataset.duration),
                price: parseFloat(e.currentTarget.dataset.price)
            };
        }
        
        console.log('Selected service:', this.selectedService);
    }
    
    async nextStep() {
        if (!this.validateCurrentStep()) {
            return;
        }
        
        this.currentStep++;
        this.updateStepDisplay();
        this.updateNavigationButtons();
        
        // Special handling for certain steps
        if (this.currentStep === 3) {
            await this.generateTimeSlots();
        } else if (this.currentStep === 5) {
            this.updateBookingSummary();
        }
    }
    
    async showStep() {
        this.updateStepDisplay();
        this.updateNavigationButtons();
        
        // Special handling for certain steps
        if (this.currentStep === 3) {
            await this.generateTimeSlots();
        } else if (this.currentStep === 5) {
            this.updateBookingSummary();
        }
    }
    
    prevStep() {
        this.currentStep--;
        this.updateStepDisplay();
        this.updateNavigationButtons();
    }
    
    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                if (!this.selectedService) {
                    alert('Please select a service to continue.');
                    return false;
                }
                break;
            case 2:
                if (!this.selectedDate) {
                    alert('Please select a date to continue.');
                    return false;
                }
                break;
            case 3:
                if (!this.selectedTime) {
                    alert('Please select a time to continue.');
                    return false;
                }
                break;
            case 4:
                return this.validateForm();
            default:
                return true;
        }
        return true;
    }
    
    validateForm() {
        const name = document.getElementById('client-name').value.trim();
        const email = document.getElementById('client-email').value.trim();
        const phone = document.getElementById('client-phone').value.trim();
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        
        if (!name) {
            this.showValidationError('client-name', 'Please enter your full name.');
            return false;
        }
        
        if (!email || !emailRegex.test(email)) {
            this.showValidationError('client-email', 'Please enter a valid email address.');
            return false;
        }
        
        if (!phone || !phoneRegex.test(phone.replace(/\D/g, ''))) {
            this.showValidationError('client-phone', 'Please enter a valid phone number.');
            return false;
        }
        
        return true;
    }
    
    showValidationError(fieldId, message) {
        const field = document.getElementById(fieldId);
        field.style.borderColor = '#e74c3c';
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = '#e74c3c';
        errorDiv.style.fontSize = '0.85rem';
        errorDiv.style.marginTop = '0.5rem';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
        
        // Remove error styling when user starts typing
        field.addEventListener('input', function() {
            field.style.borderColor = '';
            const error = field.parentNode.querySelector('.error-message');
            if (error) error.remove();
        }, { once: true });
        
        field.focus();
    }
    
    updateStepDisplay() {
        // Hide all steps
        document.querySelectorAll('.booking-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Show current step
        document.getElementById(`step-${this.currentStep}`).classList.add('active');
    }
    
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');
        const confirmBtn = document.getElementById('confirm-booking');
        
        // Show/hide previous button
        prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
        
        // Show/hide next vs confirm button
        if (this.currentStep === 5) {
            nextBtn.style.display = 'none';
            confirmBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            confirmBtn.style.display = 'none';
        }
    }
    
    renderCalendar() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        document.getElementById('current-month').textContent = 
            `${monthNames[this.currentMonth]} ${this.currentYear}`;
        
        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();
        
        const calendarDays = document.getElementById('calendar-days');
        calendarDays.innerHTML = '';
        
        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.textContent = daysInPrevMonth - i;
            calendarDays.appendChild(dayDiv);
        }
        
        // Current month days
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = day;
            
            const currentDate = new Date(this.currentYear, this.currentMonth, day);
            const dateString = this.formatDate(currentDate);
            
            // Add classes for styling and functionality
            if (this.isSameDay(currentDate, today)) {
                dayDiv.classList.add('today');
            }
            
            if (currentDate < today) {
                dayDiv.classList.add('disabled');
            } else if (!this.isDateAvailable(currentDate)) {
                dayDiv.classList.add('disabled');
            }
            
            // Add click listener for available dates
            if (!dayDiv.classList.contains('disabled')) {
                dayDiv.addEventListener('click', () => this.selectDate(currentDate, dayDiv));
            }
            
            calendarDays.appendChild(dayDiv);
        }
        
        // Next month days to fill grid
        const totalCells = calendarDays.children.length;
        const remainingCells = 42 - totalCells; // 6 rows × 7 days
        
        for (let day = 1; day <= remainingCells; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.textContent = day;
            calendarDays.appendChild(dayDiv);
        }
    }
    
    selectDate(date, dayElement) {
        // Remove previous selection
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });
        
        // Add selection to clicked day
        dayElement.classList.add('selected');
        
        // Store selected date
        this.selectedDate = date;
        
        console.log('Selected date:', this.formatDate(date));
    }
    
    isDateAvailable(date) {
        const dayOfWeek = date.getDay();
        
        // Check if day has available slots
        if (!this.availableSlots[dayOfWeek] || this.availableSlots[dayOfWeek].length === 0) {
            return false;
        }
        
        return true;
    }
    
    prevMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.renderCalendar();
    }
    
    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.renderCalendar();
    }
    
    async generateTimeSlots() {
        if (!this.selectedDate) return;
        
        // Get available slots from Firebase integration
        let availableTimes = [];
        
        if (this.firebaseIntegration && this.firebaseIntegration.checkAvailability) {
            const availableSlots = await this.firebaseIntegration.checkAvailability(
                this.selectedDate, 
                this.selectedService?.id
            );
            availableTimes = availableSlots.map(slot => slot.timeString);
        } else {
            // Fallback to local slots
            const dayOfWeek = this.selectedDate.getDay();
            availableTimes = this.availableSlots[dayOfWeek] || [];
        }
        
        const dateString = this.formatDate(this.selectedDate);
        
        // Update selected date display
        document.getElementById('selected-date-display').textContent = 
            this.selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        
        // Generate time slots
        const timeSlotsContainer = document.getElementById('time-slots');
        timeSlotsContainer.innerHTML = '';
        
        availableTimes.forEach(time => {
            const timeDiv = document.createElement('div');
            timeDiv.className = 'time-slot';
            timeDiv.textContent = this.formatTime(time);
            timeDiv.dataset.time = time;
            
            // Check if time slot is already booked
            const isBooked = this.bookedAppointments.some(appointment => 
                appointment.date === dateString && appointment.time === time
            );
            
            if (isBooked) {
                timeDiv.classList.add('disabled');
            } else {
                timeDiv.addEventListener('click', () => this.selectTime(time, timeDiv));
            }
            
            timeSlotsContainer.appendChild(timeDiv);
        });
    }
    
    selectTime(time, timeElement) {
        // Remove previous selection
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        // Add selection to clicked time
        timeElement.classList.add('selected');
        
        // Store selected time
        this.selectedTime = time;
        
        console.log('Selected time:', time);
    }
    
    updateBookingSummary() {
        // Service details
        document.getElementById('summary-service').textContent = this.selectedService.name;
        document.getElementById('summary-date').textContent = this.selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('summary-time').textContent = this.formatTime(this.selectedTime);
        document.getElementById('summary-duration').textContent = this.formatDuration(this.selectedService.duration);
        document.getElementById('summary-price').textContent = `$${this.selectedService.price}`;
        
        // Client information
        document.getElementById('summary-name').textContent = document.getElementById('client-name').value;
        document.getElementById('summary-email').textContent = document.getElementById('client-email').value;
        document.getElementById('summary-phone').textContent = document.getElementById('client-phone').value;
    }
    
    async confirmBooking() {
        try {
            // Show loading
            this.showBookingLoading(true);
            
            // Create appointment date/time
            const appointmentDateTime = this.createDateTime(this.selectedDate, this.selectedTime);
            
            // Collect all booking data for Firebase
            const bookingData = {
                serviceId: this.selectedService.id,
                appointmentDateTime: appointmentDateTime.toISOString(),
                clientName: document.getElementById('client-name').value,
                clientEmail: document.getElementById('client-email').value,
                clientPhone: document.getElementById('client-phone').value,
                notes: document.getElementById('client-notes').value,
                specialRequests: document.getElementById('special-requests')?.value || '',
                isFirstTime: document.getElementById('first-time')?.checked || false
            };
            
            console.log('Submitting booking to Firebase:', bookingData);
            
            // Submit to Firebase
            let result;
            if (this.firebaseIntegration && this.firebaseIntegration.submitBooking) {
                result = await this.firebaseIntegration.submitBooking(bookingData);
            } else {
                // Fallback to local booking
                result = await this.submitLocalBooking(bookingData);
            }
            
            this.showBookingLoading(false);
            
            if (result.success) {
                // Store booking data for modal
                this.bookingData = {
                    service: this.selectedService,
                    date: this.formatDate(this.selectedDate),
                    time: this.selectedTime,
                    client: {
                        name: bookingData.clientName,
                        email: bookingData.clientEmail,
                        phone: bookingData.clientPhone,
                        notes: bookingData.notes
                    },
                    bookingId: result.bookingId,
                    status: result.status,
                    createdAt: new Date().toISOString()
                };
                
                // Show success modal with appropriate message
                this.showSuccessModal(result.message);
            } else {
                this.showBookingError(result.message);
            }
            
        } catch (error) {
            console.error('❌ Error confirming booking:', error);
            this.showBookingLoading(false);
            this.showBookingError('Failed to submit booking. Please try again.');
        }
    }
    
    async submitLocalBooking(bookingData) {
        // Fallback local booking when Firebase is not available
        const bookingId = this.generateBookingId();
        
        // Add to local storage
        this.bookedAppointments.push({
            date: this.formatDate(new Date(bookingData.appointmentDateTime)),
            time: this.selectedTime
        });
        
        console.log('Booking saved locally (fallback):', bookingId);
        
        return {
            success: true,
            bookingId: bookingId,
            status: 'pending',
            message: 'Booking submitted successfully! You will receive a confirmation email shortly.'
        };
    }
    
    showBookingLoading(show) {
        const loadingElement = document.getElementById('booking-loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
        
        // Disable/enable form elements
        const formElements = document.querySelectorAll('#booking-form input, #booking-form button, #booking-form textarea');
        formElements.forEach(element => {
            element.disabled = show;
        });
    }
    
    showBookingError(message) {
        alert(`Booking Error: ${message}`);
        // TODO: Implement proper error notification UI
    }
    
    showSuccessModal(message) {
        const modal = document.getElementById('success-modal');
        
        // Update modal content with status message
        const statusMessage = document.getElementById('booking-status-message');
        if (statusMessage && message) {
            statusMessage.textContent = message;
        }
        
        // Update booking ID display
        const bookingIdElement = document.getElementById('booking-id-display');
        if (bookingIdElement && this.bookingData.bookingId) {
            bookingIdElement.textContent = this.bookingData.bookingId;
        }
        
        modal.classList.add('active');
    }
    
    closeModal() {
        const modal = document.getElementById('success-modal');
        modal.classList.remove('active');
        
        // Reset booking form
        this.resetBooking();
    }
    
    addToGoogleCalendar() {
        const startDateTime = this.createDateTime(this.selectedDate, this.selectedTime);
        const endDateTime = new Date(startDateTime.getTime() + (this.selectedService.duration * 60000));
        
        const googleUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
            `&text=${encodeURIComponent(`Lash Appointment - ${this.selectedService.name}`)}` +
            `&dates=${this.formatGoogleDateTime(startDateTime)}/${this.formatGoogleDateTime(endDateTime)}` +
            `&details=${encodeURIComponent(`Service: ${this.selectedService.name}\\nPrice: $${this.selectedService.price}\\nLocation: Lashed By Anna Studio\\n\\nClient: ${this.bookingData.client.name}\\nPhone: ${this.bookingData.client.phone}`)}` +
            `&location=${encodeURIComponent('Lashed By Anna, Downtown Beauty Studio, 123 Main Street, City')}`;
        
        window.open(googleUrl, '_blank');
    }
    
    addToAppleCalendar() {
        const startDateTime = this.createDateTime(this.selectedDate, this.selectedTime);
        const endDateTime = new Date(startDateTime.getTime() + (this.selectedService.duration * 60000));
        
        // Create ICS file content
        const icsContent = this.generateICSFile(startDateTime, endDateTime);
        
        // Create and download ICS file
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'lash-appointment.ics';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
    
    generateICSFile(startDate, endDate) {
        const formatICSDate = (date) => {
            return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        };
        
        return [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Lashed By Anna//Booking System//EN',
            'BEGIN:VEVENT',
            `UID:${this.bookingData.bookingId}@lashedbyanna.com`,
            `DTSTART:${formatICSDate(startDate)}`,
            `DTEND:${formatICSDate(endDate)}`,
            `SUMMARY:Lash Appointment - ${this.selectedService.name}`,
            `DESCRIPTION:Service: ${this.selectedService.name}\\nPrice: $${this.selectedService.price}\\nClient: ${this.bookingData.client.name}\\nPhone: ${this.bookingData.client.phone}`,
            'LOCATION:Lashed By Anna\\, Downtown Beauty Studio\\, 123 Main Street\\, City',
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');
    }
    
    resetBooking() {
        this.currentStep = 1;
        this.selectedService = null;
        this.selectedDate = null;
        this.selectedTime = null;
        this.bookingData = {};
        
        // Reset form
        document.getElementById('booking-form').reset();
        
        // Clear selections
        document.querySelectorAll('.service-option, .calendar-day, .time-slot').forEach(element => {
            element.classList.remove('selected');
        });
        
        // Reset display
        this.updateStepDisplay();
        this.updateNavigationButtons();
        this.renderCalendar();
    }
    
    // Utility functions
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    formatTime(time) {
        const [hours, minutes] = time.split(':');
        const hour12 = hours % 12 || 12;
        const ampm = hours < 12 ? 'AM' : 'PM';
        return `${hour12}:${minutes} ${ampm}`;
    }
    
    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins} minutes`;
        if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
        return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
    }
    
    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }
    
    createDateTime(date, time) {
        const [hours, minutes] = time.split(':');
        const dateTime = new Date(date);
        dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return dateTime;
    }
    
    formatGoogleDateTime(date) {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    }
    
    generateBookingId() {
        return 'LBA' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Initialize booking system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new BookingSystem();
});