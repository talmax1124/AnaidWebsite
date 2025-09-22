// Email Service Integration for estheticsbyanna
import { db } from '../firebase-config.js';
import { 
    collection, 
    doc, 
    getDocs, 
    getDoc, 
    addDoc, 
    query, 
    where, 
    orderBy,
    Timestamp 
} from 'firebase/firestore';

class EmailService {
    constructor() {
        this.apiKey = process.env.SENDGRID_API_KEY || 'your-sendgrid-api-key';
        this.fromEmail = 'noreply@estheticsbyanna.com';
        this.businessEmail = 'anaidmdiazplaza@gmail.com';
        this.templates = {};
        
        this.init();
    }

    async init() {
        try {
            await this.loadEmailTemplates();
            console.log('✅ Email service initialized');
        } catch (error) {
            console.error('❌ Error initializing email service:', error);
        }
    }

    async loadEmailTemplates() {
        try {
            const templatesSnapshot = await getDocs(collection(db, 'emailTemplates'));
            
            templatesSnapshot.docs.forEach(doc => {
                const template = doc.data();
                this.templates[template.templateType] = template;
            });
            
            console.log(`📧 Loaded ${templatesSnapshot.docs.length} email templates`);
            
        } catch (error) {
            console.error('Error loading email templates:', error);
            this.loadFallbackTemplates();
        }
    }

    loadFallbackTemplates() {
        this.templates = {
            confirmation: {
                subject: 'Booking Confirmed - {{serviceName}} at Lashed By Anna',
                bodyHtml: this.getConfirmationTemplate(),
                bodyText: 'Dear {{clientName}}, Your lash appointment has been confirmed for {{appointmentDate}} at {{appointmentTime}}. Service: {{serviceName}}, Duration: {{duration}} minutes, Price: ${{price}}. Booking ID: {{bookingId}}.',
            },
            pending: {
                subject: 'Booking Received - Pending Approval | Lashed By Anna',
                bodyHtml: this.getPendingTemplate(),
                bodyText: 'Dear {{clientName}}, Thank you for booking with Lashed By Anna! Your appointment request for {{serviceName}} on {{appointmentDate}} at {{appointmentTime}} has been received and is pending approval. Booking ID: {{bookingId}}.',
            },
            reminder: {
                subject: 'Reminder: Your Lash Appointment Tomorrow at Lashed By Anna',
                bodyHtml: this.getReminderTemplate(),
                bodyText: 'Hi {{clientName}}! Reminder: Your lash appointment is tomorrow {{appointmentDate}} at {{appointmentTime}}. Service: {{serviceName}}, Duration: {{duration}} minutes.',
            }
        };
    }

    async sendBookingNotification(appointmentData, templateType = 'confirmation') {
        try {
            const template = this.templates[templateType];
            if (!template) {
                throw new Error(`Template ${templateType} not found`);
            }

            const emailData = this.prepareEmailData(appointmentData, template);
            
            // In a real implementation, you would use SendGrid, AWS SES, or similar
            // For now, we'll simulate the email sending and log the notification
            console.log(`📧 Sending ${templateType} email to ${appointmentData.clientEmail}`);
            console.log('Email data:', emailData);
            
            // Log to Firebase for tracking
            await this.logEmailNotification({
                appointmentId: appointmentData.id,
                recipientEmail: appointmentData.clientEmail,
                templateType: templateType,
                subject: emailData.subject,
                status: 'sent', // In real implementation: 'sent', 'failed', 'pending'
                sentAt: Timestamp.now()
            });
            
            // Simulate successful email sending
            return {
                success: true,
                messageId: `email-${Date.now()}`,
                message: 'Email sent successfully'
            };
            
        } catch (error) {
            console.error(`❌ Error sending ${templateType} email:`, error);
            
            // Log failed email attempt
            await this.logEmailNotification({
                appointmentId: appointmentData.id,
                recipientEmail: appointmentData.clientEmail,
                templateType: templateType,
                status: 'failed',
                error: error.message,
                sentAt: Timestamp.now()
            });
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    prepareEmailData(appointmentData, template) {
        const appointmentDate = appointmentData.appointmentDateTime instanceof Date 
            ? appointmentData.appointmentDateTime 
            : appointmentData.appointmentDateTime.toDate();

        const variables = {
            clientName: appointmentData.clientName,
            serviceName: appointmentData.serviceName,
            appointmentDate: appointmentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            appointmentTime: appointmentDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }),
            duration: appointmentData.duration,
            price: appointmentData.totalPrice,
            bookingId: appointmentData.id,
            businessPhone: '(555) 123-4567',
            businessEmail: this.businessEmail
        };

        return {
            to: appointmentData.clientEmail,
            from: this.fromEmail,
            subject: this.replaceTemplateVariables(template.subject, variables),
            html: this.replaceTemplateVariables(template.bodyHtml, variables),
            text: this.replaceTemplateVariables(template.bodyText, variables)
        };
    }

    replaceTemplateVariables(template, variables) {
        let result = template;
        
        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, variables[key]);
        });
        
        return result;
    }

    async logEmailNotification(notificationData) {
        try {
            await addDoc(collection(db, 'notificationLog'), {
                ...notificationData,
                type: 'email',
                createdAt: Timestamp.now()
            });
        } catch (error) {
            console.error('Error logging email notification:', error);
        }
    }

    async scheduleReminders() {
        try {
            console.log('🔔 Checking for appointments needing reminders...');
            
            // Get appointments for reminder checking
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            
            const dayAfterTomorrow = new Date(tomorrow);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
            
            const appointmentsQuery = query(
                collection(db, 'appointments'),
                where('appointmentDateTime', '>=', Timestamp.fromDate(tomorrow)),
                where('appointmentDateTime', '<', Timestamp.fromDate(dayAfterTomorrow)),
                where('status', '==', 'confirmed'),
                where('reminderSent', '==', false)
            );
            
            const appointmentsSnapshot = await getDocs(appointmentsQuery);
            
            if (appointmentsSnapshot.empty) {
                console.log('No appointments need reminders today');
                return;
            }
            
            for (const docSnapshot of appointmentsSnapshot.docs) {
                const appointment = {
                    id: docSnapshot.id,
                    ...docSnapshot.data(),
                    appointmentDateTime: docSnapshot.data().appointmentDateTime.toDate()
                };
                
                await this.sendBookingNotification(appointment, 'reminder');
                
                // Mark reminder as sent (in a real implementation)
                console.log(`✅ Reminder sent for appointment ${appointment.id}`);
            }
            
            console.log(`📧 Sent reminders for ${appointmentsSnapshot.docs.length} appointments`);
            
        } catch (error) {
            console.error('❌ Error scheduling reminders:', error);
        }
    }

    // Template HTML generators
    getConfirmationTemplate() {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #8B7355, #C4A484); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Booking Confirmed!</h1>
                </div>
                <div style="padding: 30px; background: #f9f7f5;">
                    <p style="font-size: 16px; color: #2c2c2c;">Dear {{clientName}},</p>
                    <p style="font-size: 16px; color: #2c2c2c;">Your lash appointment has been confirmed! We're excited to see you.</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #8B7355; margin-top: 0;">Appointment Details</h3>
                        <p><strong>Service:</strong> {{serviceName}}</p>
                        <p><strong>Date:</strong> {{appointmentDate}}</p>
                        <p><strong>Time:</strong> {{appointmentTime}}</p>
                        <p><strong>Duration:</strong> {{duration}} minutes</p>
                        <p><strong>Price:</strong> ${{price}}</p>
                        <p><strong>Booking ID:</strong> {{bookingId}}</p>
                    </div>
                    
                    <div style="background: #e8d5c4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #8B7355;">Important Information</h4>
                        <ul style="color: #4a4a4a;">
                            <li>Please arrive 10 minutes early</li>
                            <li>Come with clean, makeup-free eyes</li>
                            <li>Avoid caffeine before your appointment</li>
                            <li>Cancellations require 24 hours notice</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <p style="color: #6b6b6b;">Questions? Contact us at {{businessPhone}} or {{businessEmail}}</p>
                        <p style="color: #8B7355; font-style: italic;">We can't wait to make you feel beautiful!</p>
                    </div>
                </div>
            </div>
        `;
    }

    getPendingTemplate() {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #D4B896, #E8D5C4); padding: 20px; text-align: center;">
                    <h2 style="color: #2c2c2c; margin: 0;">Booking Received!</h2>
                </div>
                <div style="padding: 20px; background: #f7f5f3;">
                    <p style="font-size: 16px; color: #2c2c2c;">Dear {{clientName}},</p>
                    <p style="font-size: 16px; color: #2c2c2c;">Thank you for booking with Lashed By Anna! Your appointment request has been received and is pending approval.</p>
                    
                    <div style="background: white; padding: 15px; border-radius: 8px;">
                        <h4 style="color: #8B7355; margin-top: 0;">Requested Appointment</h4>
                        <p><strong>Service:</strong> {{serviceName}}</p>
                        <p><strong>Date:</strong> {{appointmentDate}}</p>
                        <p><strong>Time:</strong> {{appointmentTime}}</p>
                        <p><strong>Booking ID:</strong> {{bookingId}}</p>
                    </div>
                    
                    <p style="color: #6b6b6b;">We'll review your request and send you a confirmation email within 24 hours.</p>
                </div>
            </div>
        `;
    }

    getReminderTemplate() {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #C4A484, #D4B896); padding: 20px; text-align: center;">
                    <h2 style="color: white; margin: 0;">Appointment Reminder</h2>
                </div>
                <div style="padding: 20px; background: #fafafa;">
                    <p style="font-size: 16px; color: #2c2c2c;">Hi {{clientName}},</p>
                    <p style="font-size: 16px; color: #2c2c2c;">This is a friendly reminder about your lash appointment:</p>
                    
                    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #8B7355;">
                        <p><strong>Tomorrow, {{appointmentDate}} at {{appointmentTime}}</strong></p>
                        <p>Service: {{serviceName}}</p>
                        <p>Duration: {{duration}} minutes</p>
                    </div>
                    
                    <p style="color: #6b6b6b; margin-top: 20px;">Need to reschedule? Please call us at {{businessPhone}} at least 24 hours in advance.</p>
                    <p style="color: #8B7355;">See you soon! ✨</p>
                </div>
            </div>
        `;
    }

    // Integration method for sending notifications based on appointment status changes
    async sendStatusChangeNotification(appointmentData, oldStatus, newStatus) {
        if (oldStatus === 'pending' && newStatus === 'confirmed') {
            await this.sendBookingNotification(appointmentData, 'confirmation');
        } else if (oldStatus !== 'pending' && newStatus === 'pending') {
            await this.sendBookingNotification(appointmentData, 'pending');
        }
    }
}

// Create singleton instance
const emailService = new EmailService();

// Export for use in other modules
export { EmailService, emailService };

// Schedule daily reminder check (in a real implementation, this would be a cloud function)
if (typeof window !== 'undefined') {
    console.log('📧 Email service loaded - reminders will be checked daily');
    
    // Check reminders on page load for demo purposes
    setTimeout(() => {
        emailService.scheduleReminders();
    }, 5000);
}