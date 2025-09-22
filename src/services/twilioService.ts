// Note: In production, Twilio API calls should be made from your backend server
// This is a client-side implementation for demo purposes
// For security, move these functions to a backend API

export interface SMSReminder {
  bookingId: string;
  phoneNumber: string;
  message: string;
  scheduledTime: Date;
  sent: boolean;
  sentAt?: Date;
}

export interface SMSSettings {
  enabled: boolean;
  reminderHours: number; // Hours before appointment
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  messageTemplate: string;
}

// Default SMS settings
export const defaultSMSSettings: SMSSettings = {
  enabled: false,
  reminderHours: 24,
  messageTemplate: "Hi {customerName}! This is a reminder that you have an appointment for {serviceName} tomorrow at {time}. If you need to reschedule, please call us at 321-316-9898. - Lashed By Anna"
};

// Format SMS message with booking details
export const formatSMSMessage = (template: string, booking: any): string => {
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  return template
    .replace('{customerName}', booking.clientName)
    .replace('{serviceName}', booking.serviceName)
    .replace('{time}', formatTime(booking.time))
    .replace('{date}', formatDate(booking.date))
    .replace('{duration}', `${booking.duration} minutes`)
    .replace('{price}', `$${booking.price}`);
};

// Calculate when to send reminder
export const calculateReminderTime = (booking: any, hoursBeforeAppointment: number): Date => {
  const appointmentDateTime = new Date(`${booking.date}T${booking.time}`);
  const reminderTime = new Date(appointmentDateTime.getTime() - (hoursBeforeAppointment * 60 * 60 * 1000));
  return reminderTime;
};

// Validate phone number format
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const phoneRegex = /^\+?1?[- ]?\(?([0-9]{3})\)?[- ]?([0-9]{3})[- ]?([0-9]{4})$/;
  return phoneRegex.test(phoneNumber);
};

// Format phone number for Twilio
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digits
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Add +1 if it's a 10-digit US number
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If it's 11 digits starting with 1, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  return phoneNumber; // Return as-is if we can't format it
};

// Note: In production, this should be implemented on your backend server
export const sendSMSReminder = async (
  phoneNumber: string, 
  message: string, 
  settings: SMSSettings
): Promise<boolean> => {
  try {
    // This would typically be a call to your backend API
    // which would then use Twilio to send the SMS
    console.log('SMS would be sent:', {
      to: formatPhoneNumber(phoneNumber),
      message,
      from: settings.twilioPhoneNumber
    });
    
    // For demo purposes, we'll just log it
    // In production, replace this with actual Twilio API call from backend
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
};

// Schedule SMS reminder (in production, this would be handled by a job scheduler)
export const scheduleReminder = (booking: any, settings: SMSSettings): SMSReminder | null => {
  if (!settings.enabled || !validatePhoneNumber(booking.clientPhone)) {
    return null;
  }

  const reminderTime = calculateReminderTime(booking, settings.reminderHours);
  const message = formatSMSMessage(settings.messageTemplate, booking);

  return {
    bookingId: booking.id,
    phoneNumber: formatPhoneNumber(booking.clientPhone),
    message,
    scheduledTime: reminderTime,
    sent: false
  };
};