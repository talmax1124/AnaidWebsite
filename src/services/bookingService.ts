// Booking Service for Appointments and Services
// Uses Neon PostgreSQL for data storage and Plunk for email notifications

import { Service, AddOn, Booking, BusinessSettings, User } from '../types';
import { appointmentsAPI, usersAPI, apiService } from './apiService';

// Plunk email service
const PLUNK_API_KEY = 'sk_257aa612793467b1234c042f0bf71ece77b621a27b1dc70d'; // Your actual key
const PLUNK_API_URL = 'https://api.useplunk.com/v1';
const ADMIN_EMAIL = 'noreply@estheticsbyanna.com'; // Your admin email

const sendPlunkEmail = async (to: string, subject: string, body: string) => {
  try {
    const response = await fetch(`${PLUNK_API_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PLUNK_API_KEY}`,
      },
      body: JSON.stringify({
        to,
        subject,
        body,
        type: 'html',
        // Anti-spam improvements
        from: {
          email: ADMIN_EMAIL,
          name: 'Esthetics By Anna'
        },
        replyTo: ADMIN_EMAIL,
        // Add plain text version to improve deliverability
        text: body.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
        // Track opens and clicks for engagement metrics
        track: {
          opens: true,
          clicks: true
        },
        // Add custom headers for better authentication
        headers: {
          'X-Entity-Ref-ID': `booking-${Date.now()}`,
          'List-Unsubscribe': `mailto:${ADMIN_EMAIL}?subject=Unsubscribe`,
          'X-Mailer': 'Esthetics By Anna Booking System'
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Plunk API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email via Plunk:', error);
    throw error;
  }
};

// Helper function to get authentication token
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Service operations - Now using Neon API
export const createService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const token = getAuthToken();
    const response = await apiService.post('/appointments/services', serviceData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response;
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
};

export const getServices = async (): Promise<Service[]> => {
  try {
    const response = await appointmentsAPI.getServices();
    return response.services || [];
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

export const updateService = async (id: string, serviceData: Partial<Service>) => {
  try {
    const token = getAuthToken();
    const response = await apiService.put(`/appointments/services/${id}`, serviceData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response;
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

export const deleteService = async (id: string) => {
  try {
    const token = getAuthToken();
    await apiService.delete(`/appointments/services/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

// Booking operations with email notifications
export const createBooking = async (bookingData: any): Promise<string> => {
  try {
    // Generate unique booking ID
    const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const booking = {
      id: bookingId,
      ...bookingData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store in localStorage for now
    const existingBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    existingBookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(existingBookings));
    
    // Send confirmation emails
    await sendBookingConfirmationEmails(booking);
    
    console.log('Booking created successfully:', booking);
    
    return bookingId;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

// Send booking confirmation emails
const sendBookingConfirmationEmails = async (booking: any) => {
  try {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatTime = (timeString: string) => {
      const [hours, minutes] = timeString.split(':');
      const hour12 = parseInt(hours) % 12 || 12;
      const ampm = parseInt(hours) < 12 ? 'AM' : 'PM';
      return `${hour12}:${minutes} ${ampm}`;
    };

    // Customer confirmation email
    const customerEmailBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; color: #1a1a1a;">
        <div style="background: linear-gradient(135deg, #ec4899 0%, #3b82f6 100%); padding: 25px; border-radius: 12px; color: white; text-align: center; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h1 style="margin: 0 0 8px 0; font-size: 26px; color: white; font-weight: 700; letter-spacing: -0.5px;">✨ Appointment Confirmation</h1>
          <p style="margin: 0; font-size: 16px; color: rgba(255, 255, 255, 0.9); font-weight: 500;">Esthetics By Anna - Luxury Beauty Experience</p>
        </div>
        
        <div style="background: #f9fafb; padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1a1a1a; margin-top: 0; font-weight: 600;">Hello ${booking.clientName}! 💕</h2>
          <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">Thank you for booking with Esthetics By Anna! Your appointment has been scheduled and is pending approval. Here are your appointment details:</p>
        </div>
        
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 25px; margin-bottom: 25px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <h3 style="color: #1a1a1a; margin-top: 0; font-weight: 600; font-size: 18px;">💅 Appointment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f1f1;"><strong>Service:</strong></td>
              <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #f1f1f1;">${booking.serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f1f1;"><strong>Date:</strong></td>
              <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #f1f1f1;">${formatDate(booking.date)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f1f1;"><strong>Time:</strong></td>
              <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #f1f1f1;">${formatTime(booking.time)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f1f1;"><strong>Duration:</strong></td>
              <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #f1f1f1;">${booking.duration} minutes</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Total Price:</strong></td>
              <td style="padding: 8px 0; color: #333; font-size: 18px; font-weight: bold;">$${booking.price}</td>
            </tr>
          </table>
          ${booking.addOns && booking.addOns.length > 0 ? `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <h4 style="color: #333; margin-bottom: 10px;">Add-ons:</h4>
              ${booking.addOns.map((addOn: any) => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <span style="color: #666;">${addOn.name}</span>
                  <span style="color: #333;">+$${addOn.price}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
          <h4 style="color: #856404; margin-top: 0;">⏳ Pending Approval</h4>
          <p style="color: #856404; margin-bottom: 0;">Your booking is currently pending approval. We'll confirm your appointment within 24 hours and send you another email with the confirmation.</p>
        </div>
        
        <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
          <h4 style="color: #0c5460; margin-top: 0;">📞 Contact Information</h4>
          <p style="color: #0c5460; margin-bottom: 0;">If you have any questions or need to reschedule, please contact us as soon as possible.</p>
        </div>
        
        <div style="text-align: center; padding: 25px; border-top: 1px solid #e5e7eb; margin-top: 30px; background: #f9fafb; border-radius: 0 0 12px 12px;">
          <p style="color: #1a1a1a; font-weight: 700; margin-bottom: 8px; font-size: 18px; background: linear-gradient(135deg, #ec4899, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">✨ Esthetics By Anna ✨</p>
          <p style="color: #4b5563; font-size: 14px; margin-bottom: 4px; font-weight: 500;">Luxury Beauty & Esthetic Services</p>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 12px;">📞 321-316-9898 | 📧 ${ADMIN_EMAIL}</p>
          <p style="color: #9ca3af; font-size: 12px; margin-bottom: 4px;">Booking Reference: ${booking.id}</p>
          <p style="color: #9ca3af; font-size: 11px;">
            This email was sent because you scheduled an appointment with us. 
            <a href="mailto:${ADMIN_EMAIL}?subject=Unsubscribe" style="color: #ec4899; text-decoration: none;">Unsubscribe</a>
          </p>
        </div>
      </div>
    `;

    // Admin notification email
    const adminEmailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff7b7b 0%, #d63447 100%); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px;">🔔 New Booking Alert</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">A new appointment has been scheduled</p>
        </div>
        
        <div style="background: white; border: 2px solid #e9ecef; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
          <h3 style="color: #333; margin-top: 0;">Customer Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f1f1;"><strong>Name:</strong></td>
              <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #f1f1f1;">${booking.clientName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f1f1;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #f1f1f1;">${booking.clientEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Phone:</strong></td>
              <td style="padding: 8px 0; color: #333;">${booking.clientPhone}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: white; border: 2px solid #e9ecef; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
          <h3 style="color: #1a1a1a; margin-top: 0; font-weight: 600; font-size: 18px;">💅 Appointment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f1f1;"><strong>Service:</strong></td>
              <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #f1f1f1;">${booking.serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f1f1;"><strong>Date:</strong></td>
              <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #f1f1f1;">${formatDate(booking.date)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f1f1;"><strong>Time:</strong></td>
              <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #f1f1f1;">${formatTime(booking.time)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f1f1;"><strong>Duration:</strong></td>
              <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #f1f1f1;">${booking.duration} minutes</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Total Price:</strong></td>
              <td style="padding: 8px 0; color: #333; font-size: 18px; font-weight: bold;">$${booking.price}</td>
            </tr>
          </table>
          ${booking.addOns && booking.addOns.length > 0 ? `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <h4 style="color: #333; margin-bottom: 10px;">Add-ons:</h4>
              ${booking.addOns.map((addOn: any) => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <span style="color: #666;">${addOn.name}</span>
                  <span style="color: #333;">+$${addOn.price}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${booking.notes ? `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <h4 style="color: #333; margin-bottom: 10px;">Customer Notes:</h4>
              <p style="color: #666; font-style: italic;">${booking.notes}</p>
            </div>
          ` : ''}
        </div>
        
        <div style="background: #f8d7da; border: 1px solid #f1aeb5; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
          <h4 style="color: #721c24; margin-top: 0;">⚠️ Action Required</h4>
          <p style="color: #721c24; margin-bottom: 0;">This booking is pending approval. Please review and approve/reject this appointment in the admin panel.</p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666;">
          <p style="font-size: 12px;">Booking ID: ${booking.id}</p>
          <p style="font-size: 12px;">Created: ${new Date(booking.createdAt).toLocaleString()}</p>
        </div>
      </div>
    `;

    // Send emails using Plunk
    await Promise.all([
      // Customer confirmation
      sendPlunkEmail(
        booking.clientEmail,
        `Booking Confirmation - ${booking.serviceName}`,
        customerEmailBody
      ),
      // Admin notification
      sendPlunkEmail(
        ADMIN_EMAIL,
        `New Booking: ${booking.serviceName} - ${booking.clientName}`,
        adminEmailBody
      )
    ]);

    console.log('Confirmation emails sent successfully');
  } catch (error) {
    console.error('Error sending confirmation emails:', error);
    // Don't throw error here - booking should succeed even if emails fail
  }
};

// Send status update email to customer
const sendStatusUpdateEmail = async (booking: any, oldStatus: string, newStatus: string) => {
  try {
    const formatDate = (dateString: string) => {
      const [year, month, day] = dateString.split('-').map(num => parseInt(num));
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatTime = (timeString: string) => {
      const [hours, minutes] = timeString.split(':');
      const hour12 = parseInt(hours) % 12 || 12;
      const ampm = parseInt(hours) < 12 ? 'AM' : 'PM';
      return `${hour12}:${minutes} ${ampm}`;
    };

    const getStatusMessage = (status: string) => {
      switch (status) {
        case 'confirmed':
          return {
            title: '✨ Appointment Confirmed',
            message: 'Wonderful! Your appointment has been confirmed and we can\'t wait to pamper you.',
            color: '#3b82f6',
            bgColor: '#eff6ff'
          };
        case 'cancelled':
          return {
            title: '💔 Appointment Cancelled',
            message: booking.cancellationReason || 'Your appointment has been cancelled. We hope to see you again soon.',
            color: '#6b7280',
            bgColor: '#f9fafb'
          };
        case 'completed':
          return {
            title: '💖 Thank You for Visiting Esthetics By Anna!',
            message: 'We hope you absolutely love your gorgeous new look! It was our pleasure to pamper you today.',
            color: '#ec4899',
            bgColor: '#fdf2f8'
          };
        case 'rescheduled':
          return {
            title: '📅 Appointment Rescheduled',
            message: 'Your appointment has been rescheduled. Please check the new details below.',
            color: '#F59E0B',
            bgColor: '#FEF3C7'
          };
        case 'no-show':
          return {
            title: '⚠️ Missed Appointment',
            message: 'You missed your scheduled appointment. Please contact us to reschedule.',
            color: '#F97316',
            bgColor: '#FED7AA'
          };
        case 'in-progress':
          return {
            title: '🔄 Appointment In Progress',
            message: 'Your appointment is currently in progress.',
            color: '#3B82F6',
            bgColor: '#DBEAFE'
          };
        default:
          return {
            title: '📋 Appointment Status Updated',
            message: `Your appointment status has been updated to: ${status}`,
            color: '#6B7280',
            bgColor: '#F3F4F6'
          };
      }
    };

    const statusInfo = getStatusMessage(newStatus);

    const emailBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; color: #1a1a1a;">
        <div style="background: linear-gradient(135deg, ${statusInfo.color} 0%, #6b7280 100%); padding: 25px; border-radius: 12px; color: white; text-align: center; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h1 style="margin: 0 0 8px 0; font-size: 26px; color: white; font-weight: 700; letter-spacing: -0.5px;">${statusInfo.title}</h1>
          <p style="margin: 0; font-size: 16px; color: rgba(255, 255, 255, 0.9); font-weight: 500;">Esthetics By Anna - Luxury Beauty Experience</p>
        </div>
        
        <div style="background: ${statusInfo.bgColor}; padding: 25px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid ${statusInfo.color};">
          <h2 style="color: #333; margin-top: 0;">${newStatus === 'completed' ? `Dear ${booking.clientName},` : `Hi ${booking.clientName}!`}</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 0;">${statusInfo.message}</p>
          ${newStatus === 'completed' ? `
            <p style="color: #7C3AED; line-height: 1.6; margin-top: 12px; margin-bottom: 0; font-weight: 500;">You looked absolutely stunning today, and we loved having you in our studio! ✨</p>
          ` : ''}
        </div>
        
        <div style="background: white; border: 2px solid #e9ecef; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
          <h3 style="color: #1a1a1a; margin-top: 0; font-weight: 600; font-size: 18px;">💅 Appointment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f1f1;"><strong>Service:</strong></td>
              <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #f1f1f1;">${booking.serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f1f1;"><strong>Date:</strong></td>
              <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #f1f1f1;">${formatDate(booking.date)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f1f1;"><strong>Time:</strong></td>
              <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #f1f1f1;">${formatTime(booking.time)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f1f1;"><strong>Duration:</strong></td>
              <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #f1f1f1;">${booking.duration} minutes</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f1f1;"><strong>Status:</strong></td>
              <td style="padding: 8px 0; color: ${statusInfo.color}; border-bottom: 1px solid #f1f1f1; font-weight: bold;">${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Total Price:</strong></td>
              <td style="padding: 8px 0; color: #333; font-size: 18px; font-weight: bold;">$${booking.price}${booking.cancellationFee ? ` (+$${booking.cancellationFee} fee)` : ''}</td>
            </tr>
          </table>
          ${booking.serviceNotes ? `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <h4 style="color: #333; margin-bottom: 10px;">Service Notes:</h4>
              <p style="color: #666; font-style: italic; margin: 0;">${booking.serviceNotes}</p>
            </div>
          ` : ''}
          ${booking.cancellationFee && newStatus === 'cancelled' ? `
            <div style="margin-top: 20px; padding: 15px; background: #FEE2E2; border: 1px solid #FECACA; border-radius: 8px;">
              <h4 style="color: #DC2626; margin-top: 0; margin-bottom: 8px;">Cancellation Fee Applied</h4>
              <p style="color: #991B1B; margin: 0; font-size: 14px;">A $${booking.cancellationFee} cancellation fee has been applied${booking.cancellationReason ? ': ' + booking.cancellationReason : '.'}</p>
            </div>
          ` : ''}
        </div>
        
        ${newStatus === 'confirmed' ? `
          <div style="background: #D1FAE5; border: 1px solid #A7F3D0; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #065F46; margin-top: 0;">📞 Contact Information</h4>
            <p style="color: #065F46; margin-bottom: 0;">If you need to reschedule or have questions, please call us at <strong>321-316-9898</strong></p>
          </div>
        ` : ''}
        
        ${newStatus === 'completed' ? `
          <div style="background: #F3E8FF; border: 1px solid #DDD6FE; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
            <h4 style="color: #7C3AED; margin-top: 0; font-size: 18px;">✨ Thank You for Trusting Us with Your Beauty!</h4>
            <div style="color: #6D28D9; line-height: 1.6;">
              <p style="margin-bottom: 12px;">We are so grateful you chose Esthetics By Anna for your beauty needs. Your trust means the world to us!</p>
              <p style="margin-bottom: 12px;"><strong>Aftercare Tips:</strong></p>
              <ul style="margin-bottom: 12px; padding-left: 20px;">
                <li>Keep your lashes dry for the first 24-48 hours</li>
                <li>Avoid oil-based products around the eye area</li>
                <li>Gently brush your lashes daily with a spoolie</li>
                <li>Sleep on your back when possible to preserve the curl</li>
              </ul>
              <p style="margin-bottom: 0;">We can't wait to see you again for your next appointment! Book your touch-up in 2-3 weeks to keep your lashes looking fabulous.</p>
            </div>
          </div>
          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #065F46; margin-top: 0;">💬 Share Your Experience!</h4>
            <p style="color: #065F46; margin-bottom: 8px;">We'd love to hear about your experience! Please consider leaving us a review:</p>
            <p style="color: #065F46; margin-bottom: 0;">📱 Follow us on social media @EstheticsByAnna for beauty tips and inspiration!</p>
          </div>
        ` : ''}
        
        ${newStatus === 'cancelled' ? `
          <div style="background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #92400E; margin-top: 0;">Want to Book Again?</h4>
            <p style="color: #92400E; margin-bottom: 0;">We'd love to see you again! Contact us at <strong>321-316-9898</strong> to schedule a new appointment.</p>
          </div>
        ` : ''}
        
        <div style="text-align: center; padding: 25px; border-top: 1px solid #e5e7eb; margin-top: 30px; background: #f9fafb; border-radius: 0 0 12px 12px;">
          <p style="color: #1a1a1a; font-weight: 700; margin-bottom: 8px; font-size: 18px; background: linear-gradient(135deg, #ec4899, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">✨ Esthetics By Anna ✨</p>
          <p style="color: #4b5563; font-size: 14px; margin-bottom: 4px; font-weight: 500;">Luxury Beauty & Esthetic Services</p>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 12px;">📞 321-316-9898 | 📧 ${ADMIN_EMAIL}</p>
          <p style="color: #9ca3af; font-size: 12px; margin-bottom: 4px;">Booking Reference: ${booking.id}</p>
          <p style="color: #9ca3af; font-size: 11px;">
            This email was sent because you scheduled an appointment with us. 
            <a href="mailto:${ADMIN_EMAIL}?subject=Unsubscribe" style="color: #ec4899; text-decoration: none;">Unsubscribe</a>
          </p>
        </div>
      </div>
    `;

    await sendPlunkEmail(
      booking.clientEmail,
      `${statusInfo.title} - ${booking.serviceName}`,
      emailBody
    );

    console.log(`Status update email sent to ${booking.clientEmail}: ${oldStatus} → ${newStatus}`);
  } catch (error) {
    console.error('Error sending status update email:', error);
    // Don't throw error - booking should succeed even if email fails
  }
};

// Send payment status update email to customer
const sendPaymentStatusUpdateEmail = async (booking: any, oldPaymentStatus: string, newPaymentStatus: string) => {
  try {
    const formatDate = (dateString: string) => {
      const [year, month, day] = dateString.split('-').map(num => parseInt(num));
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatTime = (timeString: string) => {
      const [hours, minutes] = timeString.split(':');
      const hour12 = parseInt(hours) % 12 || 12;
      const ampm = parseInt(hours) < 12 ? 'AM' : 'PM';
      return `${hour12}:${minutes} ${ampm}`;
    };

    const getPaymentMessage = (paymentStatus: string) => {
      switch (paymentStatus) {
        case 'paid':
          return {
            title: '💳 Payment Confirmed',
            message: 'Your payment has been successfully processed and confirmed.',
            color: '#10B981',
            bgColor: '#D1FAE5'
          };
        case 'partial':
          return {
            title: '💰 Partial Payment Received',
            message: 'We have received a partial payment for your appointment.',
            color: '#F59E0B',
            bgColor: '#FEF3C7'
          };
        case 'refunded':
          return {
            title: '💸 Payment Refunded',
            message: 'Your payment has been refunded.',
            color: '#6B7280',
            bgColor: '#F3F4F6'
          };
        case 'unpaid':
          return {
            title: '⏳ Payment Pending',
            message: 'Payment is still pending for your appointment.',
            color: '#EF4444',
            bgColor: '#FEE2E2'
          };
        default:
          return {
            title: '💳 Payment Status Updated',
            message: `Your payment status has been updated to: ${paymentStatus}`,
            color: '#6B7280',
            bgColor: '#F3F4F6'
          };
      }
    };

    const paymentInfo = getPaymentMessage(newPaymentStatus);

    const emailBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid ${paymentInfo.color}; margin-bottom: 24px;">
          <h1 style="margin: 0 0 8px 0; font-size: 24px; color: #333; font-weight: 600;">${paymentInfo.title}</h1>
          <p style="margin: 0; font-size: 16px; color: #666;">Lashed By Anna - Professional Beauty Services</p>
        </div>
        
        <div style="background: ${paymentInfo.bgColor}; padding: 25px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid ${paymentInfo.color};">
          <h2 style="color: #333; margin-top: 0;">Hi ${booking.clientName}!</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 0;">${paymentInfo.message}</p>
        </div>
        
        <div style="background: white; border: 2px solid #e9ecef; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
          <h3 style="color: #333; margin-top: 0;">Payment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f1f1;"><strong>Service:</strong></td>
              <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #f1f1f1;">${booking.serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f1f1;"><strong>Date:</strong></td>
              <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #f1f1f1;">${formatDate(booking.date)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f1f1;"><strong>Time:</strong></td>
              <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #f1f1f1;">${formatTime(booking.time)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f1f1;"><strong>Total Amount:</strong></td>
              <td style="padding: 8px 0; color: #333; border-bottom: 1px solid #f1f1f1; font-size: 18px; font-weight: bold;">$${booking.price}${booking.cancellationFee ? ` (+$${booking.cancellationFee} fee)` : ''}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #f1f1f1;"><strong>Payment Status:</strong></td>
              <td style="padding: 8px 0; color: ${paymentInfo.color}; border-bottom: 1px solid #f1f1f1; font-weight: bold;">${newPaymentStatus.charAt(0).toUpperCase() + newPaymentStatus.slice(1)}</td>
            </tr>
            ${booking.paymentMethod ? `
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Payment Method:</strong></td>
                <td style="padding: 8px 0; color: #333;">${booking.paymentMethod}</td>
              </tr>
            ` : ''}
          </table>
        </div>
        
        ${newPaymentStatus === 'unpaid' ? `
          <div style="background: #FEE2E2; border: 1px solid #FECACA; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #DC2626; margin-top: 0;">💳 Payment Required</h4>
            <p style="color: #991B1B; margin-bottom: 0;">Please bring payment for your appointment or contact us at <strong>321-316-9898</strong> to arrange payment.</p>
          </div>
        ` : ''}
        
        ${newPaymentStatus === 'paid' ? `
          <div style="background: #D1FAE5; border: 1px solid #A7F3D0; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #065F46; margin-top: 0;">✅ Payment Complete</h4>
            <p style="color: #065F46; margin-bottom: 0;">Thank you! Your payment has been processed successfully. We look forward to seeing you at your appointment.</p>
          </div>
        ` : ''}
        
        <div style="text-align: center; padding: 20px; color: #666; border-top: 1px solid #e9ecef;">
          <p>Questions about payment? Contact us at <strong>321-316-9898</strong></p>
          <p style="font-size: 12px;">Booking ID: ${booking.id}</p>
          <p style="font-size: 12px;">Updated: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

    await sendPlunkEmail(
      booking.clientEmail,
      `${paymentInfo.title} - ${booking.serviceName}`,
      emailBody
    );

    console.log(`Payment update email sent to ${booking.clientEmail}: ${oldPaymentStatus} → ${newPaymentStatus}`);
  } catch (error) {
    console.error('Error sending payment update email:', error);
    // Don't throw error - booking should succeed even if email fails
  }
};

export const getBookings = async (params?: {
  status?: string;
  date?: string;
  type?: 'pending' | 'today' | 'upcoming' | 'history';
}): Promise<Booking[]> => {
  try {
    // Get all bookings from localStorage
    const rawBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    
    // Convert date strings back to proper format for components that expect Date objects
    const allBookings = rawBookings.map((booking: any) => ({
      ...booking,
      createdAt: booking.createdAt || new Date().toISOString(),
      updatedAt: booking.updatedAt || booking.createdAt || new Date().toISOString()
    }));
    
    if (!params?.type && !params?.status && !params?.date) {
      return allBookings;
    }

    let filteredBookings = allBookings;

    // Filter by status
    if (params.status) {
      filteredBookings = filteredBookings.filter((booking: any) => 
        booking.status === params.status
      );
    }

    // Filter by date
    if (params.date) {
      filteredBookings = filteredBookings.filter((booking: any) => 
        booking.date === params.date
      );
    }

    // Filter by type
    if (params.type) {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      switch (params.type) {
        case 'pending':
          filteredBookings = filteredBookings.filter((booking: any) => 
            booking.status === 'pending'
          );
          break;
          
        case 'today':
          filteredBookings = filteredBookings.filter((booking: any) => 
            booking.date === today
          );
          break;
          
        case 'upcoming':
          filteredBookings = filteredBookings.filter((booking: any) => {
            const bookingDate = new Date(booking.date);
            return bookingDate >= now;
          });
          break;
          
        case 'history':
          filteredBookings = filteredBookings.filter((booking: any) => {
            const bookingDate = new Date(booking.date);
            return bookingDate < now || booking.status === 'completed' || booking.status === 'cancelled';
          });
          break;
      }
    }

    return filteredBookings;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};

export const getBooking = async (id: string): Promise<Booking | null> => {
  try {
    const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const rawBooking = allBookings.find((b: any) => b.id === id);
    
    if (!rawBooking) return null;
    
    // Ensure date fields are properly formatted
    const booking = {
      ...rawBooking,
      createdAt: rawBooking.createdAt || new Date().toISOString(),
      updatedAt: rawBooking.updatedAt || rawBooking.createdAt || new Date().toISOString()
    };
    
    return booking;
  } catch (error) {
    console.error('Error fetching booking:', error);
    return null;
  }
};

export const updateBooking = async (id: string, updates: Partial<Booking>) => {
  try {
    const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const bookingIndex = allBookings.findIndex((b: any) => b.id === id);
    
    if (bookingIndex === -1) {
      throw new Error('Booking not found');
    }
    
    const originalBooking = allBookings[bookingIndex];
    
    // Update the booking
    const updatedBooking = {
      ...originalBooking,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    allBookings[bookingIndex] = updatedBooking;
    localStorage.setItem('bookings', JSON.stringify(allBookings));
    
    // Send email notification if status changed
    if (updates.status && updates.status !== originalBooking.status) {
      await sendStatusUpdateEmail(updatedBooking, originalBooking.status, updates.status);
    }
    
    // Send email notification if payment status changed
    if (updates.paymentStatus && updates.paymentStatus !== originalBooking.paymentStatus) {
      await sendPaymentStatusUpdateEmail(updatedBooking, originalBooking.paymentStatus, updates.paymentStatus);
    }
    
    return updatedBooking;
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
};

export const deleteBooking = async (id: string) => {
  try {
    const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const bookingToDelete = allBookings.find((b: any) => b.id === id);
    
    if (bookingToDelete) {
      // Send cancellation email before deleting
      await sendStatusUpdateEmail(bookingToDelete, bookingToDelete.status, 'cancelled');
    }
    
    const filteredBookings = allBookings.filter((b: any) => b.id !== id);
    localStorage.setItem('bookings', JSON.stringify(filteredBookings));
  } catch (error) {
    console.error('Error deleting booking:', error);
    throw error;
  }
};

export const approveBooking = async (appointmentId: number, notes?: string) => {
  try {
    const token = getAuthToken();
    const response = await appointmentsAPI.approveAppointment({
      appointmentId,
      action: 'approve',
      notes,
    }, token || undefined);
    return response;
  } catch (error) {
    console.error('Error approving booking:', error);
    throw error;
  }
};

export const rejectBooking = async (appointmentId: number, notes?: string) => {
  try {
    const token = getAuthToken();
    const response = await appointmentsAPI.approveAppointment({
      appointmentId,
      action: 'reject',
      notes,
    }, token || undefined);
    return response;
  } catch (error) {
    console.error('Error rejecting booking:', error);
    throw error;
  }
};

// User operations - Now using Neon API
export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const response = await usersAPI.getUser(userId);
    return response;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

export const updateUser = async (userId: string, userData: Partial<User>) => {
  try {
    const response = await usersAPI.updateUser(userId, userData);
    return response;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const createUser = async (userData: Omit<User, 'id'>) => {
  try {
    const token = getAuthToken();
    const response = await apiService.post('/users', userData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Business Settings - Using localStorage for now
export const getBusinessSettings = async (): Promise<BusinessSettings | null> => {
  try {
    const settings = localStorage.getItem('businessSettings');
    if (settings) {
      return JSON.parse(settings);
    }
    
    // Return default settings if none exist
    const defaultSettings = {
      businessName: 'Esthetics By Anna',
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
    
    // Store default settings
    localStorage.setItem('businessSettings', JSON.stringify(defaultSettings));
    return defaultSettings;
  } catch (error) {
    console.error('Error getting business settings:', error);
    return null;
  }
};

export const updateBusinessSettings = async (settings: Partial<BusinessSettings>) => {
  try {
    // Get existing settings and merge with updates
    const existing = await getBusinessSettings();
    const updated = existing ? { ...existing, ...settings } : settings;
    
    localStorage.setItem('businessSettings', JSON.stringify(updated));
    console.log('Business settings updated:', updated);
    return updated;
  } catch (error) {
    console.error('Error updating business settings:', error);
    throw error;
  }
};

// Availability operations - Now using Neon API
export const getAvailability = async (date: string) => {
  try {
    const response = await appointmentsAPI.getAvailability(date);
    return response;
  } catch (error) {
    console.error('Error fetching availability:', error);
    throw error;
  }
};

// Analytics operations - Now using Neon API
export const getAnalytics = async () => {
  try {
    const token = getAuthToken();
    const response = await appointmentsAPI.getAnalyticsOverview(token || undefined);
    return response;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return {
      totalAppointments: 0,
      pendingAppointments: 0,
      completedAppointments: 0,
      revenue: 0,
      growth: 0,
    };
  }
};

export const getRevenueAnalytics = async () => {
  try {
    const token = getAuthToken();
    const response = await appointmentsAPI.getRevenueAnalytics(token || undefined);
    return response;
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    return {
      totalRevenue: 0,
      monthlyRevenue: [],
      topServices: [],
    };
  }
};

// Add-on operations - Mock implementations (can be extended later)
export const getAddOns = async (): Promise<AddOn[]> => {
  try {
    const token = getAuthToken();
    const response = await apiService.get('/appointments/addons', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.addons || [];
  } catch (error) {
    console.error('Error fetching add-ons:', error);
    return [];
  }
};

export const createAddOn = async (addOnData: Omit<AddOn, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const token = getAuthToken();
    const response = await apiService.post('/appointments/addons', addOnData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response;
  } catch (error) {
    console.error('Error creating add-on:', error);
    throw error;
  }
};

export const updateAddOn = async (id: string, addOnData: Partial<AddOn>) => {
  try {
    const token = getAuthToken();
    const response = await apiService.put(`/appointments/addons/${id}`, addOnData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response;
  } catch (error) {
    console.error('Error updating add-on:', error);
    throw error;
  }
};

export const deleteAddOn = async (id: string) => {
  try {
    const token = getAuthToken();
    await apiService.delete(`/appointments/addons/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (error) {
    console.error('Error deleting add-on:', error);
    throw error;
  }
};

// Legacy exports for backward compatibility
export const servicesCollection = { /* replaced with Neon API */ };
export const addOnsCollection = { /* replaced with Neon API */ };
export const bookingsCollection = { /* replaced with Neon API */ };
export const usersCollection = { /* replaced with Neon API */ };
export const settingsDoc = { /* replaced with Neon API */ };

// Legacy functions for backward compatibility
export const getUserByClerkId = async (clerkId: string): Promise<User | null> => {
  try {
    // Since we no longer use Clerk, treat the clerkId as a regular user ID
    const response = await usersAPI.getUser(clerkId);
    return response;
  } catch (error) {
    console.error('Error fetching user by clerk ID:', error);
    return null;
  }
};

export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  try {
    // Get all bookings from localStorage and filter by user
    const rawBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    
    // Convert date strings and filter by user
    const userBookings = rawBookings
      .filter((booking: any) => 
        booking.clientId === userId || booking.userId === userId
      )
      .map((booking: any) => ({
        ...booking,
        createdAt: booking.createdAt || new Date().toISOString(),
        updatedAt: booking.updatedAt || booking.createdAt || new Date().toISOString()
      }));
    
    return userBookings || [];
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return [];
  }
};

export const deleteUser = async (id: string) => {
  try {
    const token = getAuthToken();
    await apiService.delete(`/users/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const subscribeToBookings = (callback: (bookings: Booking[]) => void) => {
  // Mock real-time subscription using localStorage
  const fetchBookings = async () => {
    try {
      const bookings = await getBookings();
      callback(bookings);
    } catch (error) {
      console.error('Error in booking subscription:', error);
      callback([]);
    }
  };

  // Initial fetch
  fetchBookings();
  
  // Set up polling to check for localStorage changes
  const interval = setInterval(fetchBookings, 5000); // Poll every 5 seconds
  
  // Return unsubscribe function
  return () => clearInterval(interval);
};

export const subscribeToServices = (callback: (services: Service[]) => void) => {
  // Mock real-time subscription
  const fetchServices = async () => {
    try {
      const services = await getServices();
      callback(services);
    } catch (error) {
      console.error('Error in services subscription:', error);
      callback([]);
    }
  };

  // Initial fetch
  fetchServices();
  
  // Set up polling
  const interval = setInterval(fetchServices, 60000); // Poll every minute
  
  // Return unsubscribe function
  return () => clearInterval(interval);
};

export const subscribeToUsers = (callback: (users: User[]) => void) => {
  // Mock real-time subscription for users
  const fetchUsers = async () => {
    try {
      const token = getAuthToken();
      const response = await apiService.get('/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      callback(response.users || []);
    } catch (error) {
      console.error('Error in users subscription:', error);
      callback([]);
    }
  };

  // Initial fetch
  fetchUsers();
  
  // Set up polling
  const interval = setInterval(fetchUsers, 60000); // Poll every minute
  
  // Return unsubscribe function
  return () => clearInterval(interval);
};

export const subscribeToAddOns = (callback: (addOns: AddOn[]) => void) => {
  // Mock real-time subscription for add-ons
  const fetchAddOns = async () => {
    try {
      const addOns = await getAddOns();
      callback(addOns);
    } catch (error) {
      console.error('Error in add-ons subscription:', error);
      callback([]);
    }
  };

  // Initial fetch
  fetchAddOns();
  
  // Set up polling
  const interval = setInterval(fetchAddOns, 60000); // Poll every minute
  
  // Return unsubscribe function
  return () => clearInterval(interval);
};

export const getActiveServices = async (): Promise<Service[]> => {
  try {
    const services = await getServices();
    // Filter for active services only
    return services.filter(service => service.active !== false);
  } catch (error) {
    console.error('Error fetching active services:', error);
    return [];
  }
};

export const getActiveAddOns = async (): Promise<AddOn[]> => {
  try {
    const addOns = await getAddOns();
    // Filter for active add-ons only
    return addOns.filter(addOn => addOn.active !== false);
  } catch (error) {
    console.error('Error fetching active add-ons:', error);
    return [];
  }
};

export const getCompatibleAddOns = async (serviceId: string): Promise<AddOn[]> => {
  try {
    const addOns = await getActiveAddOns();
    // Filter for add-ons compatible with the service
    return addOns.filter(addOn => 
      !addOn.compatibleServices || 
      addOn.compatibleServices.includes(serviceId) ||
      addOn.compatibleServices.length === 0
    );
  } catch (error) {
    console.error('Error fetching compatible add-ons:', error);
    return [];
  }
};

export const getBookingsByDate = async (date: string): Promise<Booking[]> => {
  try {
    // Get bookings from localStorage for now
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    // Filter bookings for the specific date
    return bookings.filter((booking: any) => booking.date === date) || [];
  } catch (error) {
    console.error('Error fetching bookings by date:', error);
    return [];
  }
};

// Notification/reminder functions - Keep existing Twilio integration
export { scheduleReminder, sendSMSReminder } from './twilioService';