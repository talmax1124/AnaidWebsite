import { Booking } from '../types';

export interface CalendarEvent {
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
}

// Convert booking to calendar event format
export const bookingToCalendarEvent = (booking: Booking): CalendarEvent => {
  const startDate = new Date(`${booking.date}T${booking.time}`);
  const endDate = new Date(startDate.getTime() + (booking.duration * 60 * 1000));

  const formatDateTime = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  return {
    title: `${booking.serviceName} - Lashed By Anna`,
    description: `
Appointment Details:
- Service: ${booking.serviceName}
- Duration: ${booking.duration} minutes
- Price: $${booking.price}
${booking.notes ? `\n- Notes: ${booking.notes}` : ''}

Contact Information:
- Phone: 321-316-9898
- Location: Lashed By Anna

Booking ID: ${booking.id}
    `.trim(),
    startDateTime: formatDateTime(startDate),
    endDateTime: formatDateTime(endDate),
    location: 'Lashed By Anna - Contact for exact address: 321-316-9898'
  };
};

// Generate Google Calendar URL
export const generateGoogleCalendarUrl = (booking: Booking): string => {
  const event = bookingToCalendarEvent(booking);
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${event.startDateTime}/${event.endDateTime}`,
    details: event.description,
    location: event.location,
    ctz: 'America/New_York' // Adjust timezone as needed
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// Generate Apple Calendar URL (webcal/ics format)
export const generateAppleCalendarUrl = (booking: Booking): string => {
  const event = bookingToCalendarEvent(booking);
  
  // Create ICS content
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Lashed By Anna//Booking System//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${booking.id}@lashedbyanna.com
DTSTART:${event.startDateTime}
DTEND:${event.endDateTime}
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

  // Create blob and return URL
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  return URL.createObjectURL(blob);
};

// Generate Outlook Calendar URL
export const generateOutlookCalendarUrl = (booking: Booking): string => {
  const event = bookingToCalendarEvent(booking);
  
  const params = new URLSearchParams({
    subject: event.title,
    startdt: event.startDateTime,
    enddt: event.endDateTime,
    body: event.description,
    location: event.location,
    allday: 'false'
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

// Download ICS file for any calendar app
export const downloadICSFile = (booking: Booking): void => {
  try {
    const event = bookingToCalendarEvent(booking);
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Lashed By Anna//Booking System//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${booking.id}@lashedbyanna.com
DTSTART:${event.startDateTime}
DTEND:${event.endDateTime}
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `lashed-by-anna-appointment-${booking.id.slice(-8)}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading ICS file:', error);
  }
};

// Check if device is likely iOS/Mac for Apple Calendar
export const isAppleDevice = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod|macintosh|mac os x/.test(userAgent);
};

// Get the most appropriate calendar service for the device
export const getPreferredCalendarService = () => {
  if (isAppleDevice()) {
    return 'apple';
  }
  return 'google';
};