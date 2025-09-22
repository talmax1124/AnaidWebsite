// Firebase Firestore Seed Data for estheticsbyanna
import { db } from '../firebase-config.js';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';

// Services data
const services = [
    {
        id: 'classic-lashes',
        name: 'Classic Lashes',
        description: 'Natural-looking lash extensions that enhance your eyes with subtle elegance and everyday beauty.',
        durationMinutes: 120,
        price: 120.00,
        serviceCode: 'CLASSIC',
        isActive: true,
        category: 'lash-extensions'
    },
    {
        id: 'volume-lashes',
        name: 'Volume Lashes',
        description: 'Fuller, more dramatic lashes using advanced techniques for maximum impact and glamour.',
        durationMinutes: 150,
        price: 150.00,
        serviceCode: 'VOLUME',
        isActive: true,
        category: 'lash-extensions'
    },
    {
        id: 'hybrid-lashes',
        name: 'Hybrid Lashes',
        description: 'Perfect blend of classic and volume techniques for a customized, textured look.',
        durationMinutes: 135,
        price: 135.00,
        serviceCode: 'HYBRID',
        isActive: true,
        category: 'lash-extensions'
    },
    {
        id: 'lash-lift-tint',
        name: 'Lash Lift & Tint',
        description: 'Enhance your natural lashes with a professional lift and tint for a low-maintenance look.',
        durationMinutes: 90,
        price: 85.00,
        serviceCode: 'LIFT_TINT',
        isActive: true,
        category: 'lash-enhancement'
    }
];

// Business settings data
const businessSettings = {
    businessName: 'estheticsbyanna',
    businessPhone: '(555) 123-4567',
    businessEmail: 'anaidmdiazplaza@gmail.com',
    businessAddress: '123 Main Street, Downtown, City',
    bookingAdvanceDays: 30,
    cancellationHours: 24,
    depositRequired: true,
    depositPercentage: 25,
    autoConfirmBookings: false,
    reminderTimes: [1440, 120], // 24h, 2h in minutes
    workingDays: [1, 2, 3, 4, 5, 6], // Monday-Saturday
    timezone: 'America/New_York',
    socialMedia: {
        instagram: '@lashedbyanna',
        facebook: 'LashedByAnna',
        website: 'https://lashedbyanna.com'
    }
};

// Available time slots (Monday-Friday: 9AM-6PM, Saturday: 10AM-4PM)
const availableSlots = [
    // Monday
    { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isAvailable: true },
    // Tuesday  
    { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isAvailable: true },
    // Wednesday
    { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isAvailable: true },
    // Thursday
    { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isAvailable: true },
    // Friday
    { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isAvailable: true },
    // Saturday
    { dayOfWeek: 6, startTime: '10:00', endTime: '16:00', isAvailable: true }
];

// Email templates
const emailTemplates = [
    {
        id: 'booking-confirmation',
        templateName: 'Booking Confirmation',
        subject: 'Booking Confirmed - {{serviceName}} at Lashed By Anna',
        bodyHtml: `
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
        `,
        bodyText: `Dear {{clientName}}, Your lash appointment has been confirmed for {{appointmentDate}} at {{appointmentTime}}. Service: {{serviceName}}, Duration: {{duration}} minutes, Price: ${{price}}. Booking ID: {{bookingId}}. Please arrive 10 minutes early with clean, makeup-free eyes. Questions? Contact us at {{businessPhone}}.`,
        templateType: 'confirmation',
        isActive: true
    },
    {
        id: 'appointment-reminder',
        templateName: 'Appointment Reminder',
        subject: 'Reminder: Your Lash Appointment Tomorrow at Lashed By Anna',
        bodyHtml: `
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
        `,
        bodyText: `Hi {{clientName}}! Reminder: Your lash appointment is tomorrow {{appointmentDate}} at {{appointmentTime}}. Service: {{serviceName}}, Duration: {{duration}} minutes. Please arrive 10 minutes early. Need to reschedule? Call {{businessPhone}}.`,
        templateType: 'reminder',
        isActive: true
    },
    {
        id: 'pending-approval',
        templateName: 'Booking Pending Approval',
        subject: 'Booking Received - Pending Approval | Lashed By Anna',
        bodyHtml: `
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
                    
                    <p style="color: #6b6b6b;">We'll review your request and send you a confirmation email within 24 hours. If you have any questions, please don't hesitate to contact us.</p>
                </div>
            </div>
        `,
        bodyText: `Dear {{clientName}}, Thank you for booking with Lashed By Anna! Your appointment request for {{serviceName}} on {{appointmentDate}} at {{appointmentTime}} has been received and is pending approval. Booking ID: {{bookingId}}. We'll confirm within 24 hours.`,
        templateType: 'pending',
        isActive: true
    }
];

// SMS templates
const smsTemplates = [
    {
        id: 'booking-confirmation-sms',
        templateName: 'Booking Confirmation SMS',
        message: 'Hi {{clientName}}! Your lash appointment is confirmed for {{appointmentDate}} at {{appointmentTime}}. Service: {{serviceName}} (${{price}}). Arrive 10 min early. Reply STOP to opt out.',
        templateType: 'confirmation',
        isActive: true
    },
    {
        id: 'appointment-reminder-sms',
        templateName: 'Appointment Reminder SMS',
        message: 'Hi {{clientName}}! Reminder: Lash appointment tomorrow {{appointmentDate}} at {{appointmentTime}}. Please arrive 10 min early. Need to reschedule? Call {{businessPhone}}',
        templateType: 'reminder',
        isActive: true
    },
    {
        id: 'pending-approval-sms',
        templateName: 'Pending Approval SMS',
        message: 'Hi {{clientName}}! Your lash appointment request for {{appointmentDate}} at {{appointmentTime}} has been received. We\'ll confirm within 24 hours. Booking ID: {{bookingId}}',
        templateType: 'pending',
        isActive: true
    }
];

// Seed function
async function seedData() {
    try {
        console.log('🌱 Starting to seed Firestore data...');
        
        // Seed services
        console.log('Adding services...');
        for (const service of services) {
            await setDoc(doc(db, 'services', service.id), {
                ...service,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        
        // Seed business settings
        console.log('Adding business settings...');
        await setDoc(doc(db, 'businessSettings', 'main'), {
            ...businessSettings,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        // Seed available slots
        console.log('Adding available time slots...');
        for (let i = 0; i < availableSlots.length; i++) {
            await setDoc(doc(db, 'availableSlots', `slot-${i + 1}`), {
                ...availableSlots[i],
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        
        // Seed email templates
        console.log('Adding email templates...');
        for (const template of emailTemplates) {
            await setDoc(doc(db, 'emailTemplates', template.id), {
                ...template,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        
        // Seed SMS templates
        console.log('Adding SMS templates...');
        for (const template of smsTemplates) {
            await setDoc(doc(db, 'smsTemplates', template.id), {
                ...template,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        
        console.log('✅ Firestore seeding completed successfully!');
        console.log(`📊 Seeded ${services.length} services`);
        console.log(`⚙️ Seeded business settings`);
        console.log(`🕒 Seeded ${availableSlots.length} time slots`);
        console.log(`📧 Seeded ${emailTemplates.length} email templates`);
        console.log(`📱 Seeded ${smsTemplates.length} SMS templates`);
        
    } catch (error) {
        console.error('❌ Error seeding data:', error);
    }
}

// Export seed function
export { seedData };

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    seedData();
}