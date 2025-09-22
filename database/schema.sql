-- estheticsbyanna Booking System Database Schema
-- Compatible with MySQL/PostgreSQL

-- Users table (for esthetician login)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'esthetician') DEFAULT 'esthetician',
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Services table
CREATE TABLE services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    service_code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    date_of_birth DATE,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    allergies TEXT,
    medical_conditions TEXT,
    previous_lash_extensions BOOLEAN DEFAULT false,
    preferred_communication ENUM('email', 'sms', 'both') DEFAULT 'both',
    marketing_consent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Appointments table
CREATE TABLE appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id VARCHAR(50) UNIQUE NOT NULL,
    client_id INT NOT NULL,
    service_id INT NOT NULL,
    esthetician_id INT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show') DEFAULT 'pending',
    total_price DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) DEFAULT 0.00,
    deposit_paid BOOLEAN DEFAULT false,
    payment_status ENUM('unpaid', 'deposit_paid', 'paid', 'refunded') DEFAULT 'unpaid',
    notes TEXT,
    client_notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP NULL,
    confirmed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (esthetician_id) REFERENCES users(id),
    
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_appointment_status (status),
    INDEX idx_client_id (client_id)
);

-- Appointment history for tracking changes
CREATE TABLE appointment_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_by INT,
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- Reminders table
CREATE TABLE reminders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    reminder_type ENUM('email', 'sms', 'both') NOT NULL,
    reminder_time_before INT NOT NULL, -- minutes before appointment
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    
    INDEX idx_reminder_status (status),
    INDEX idx_appointment_id (appointment_id)
);

-- Business settings table
CREATE TABLE business_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Available time slots table
CREATE TABLE available_slots (
    id INT PRIMARY KEY AUTO_INCREMENT,
    day_of_week INT NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    esthetician_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (esthetician_id) REFERENCES users(id),
    
    INDEX idx_day_of_week (day_of_week)
);

-- Blackout dates table (holidays, vacations, etc.)
CREATE TABLE blackout_dates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    esthetician_id INT,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(50), -- 'yearly', 'monthly', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (esthetician_id) REFERENCES users(id),
    
    INDEX idx_blackout_dates (start_date, end_date)
);

-- Email templates table
CREATE TABLE email_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT NOT NULL,
    template_type ENUM('confirmation', 'reminder', 'cancellation', 'follow_up') NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- SMS templates table
CREATE TABLE sms_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_name VARCHAR(100) UNIQUE NOT NULL,
    message TEXT NOT NULL,
    template_type ENUM('confirmation', 'reminder', 'cancellation', 'follow_up') NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Notification log table
CREATE TABLE notification_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    client_id INT NOT NULL,
    notification_type ENUM('email', 'sms') NOT NULL,
    template_used VARCHAR(100),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status ENUM('pending', 'sent', 'failed', 'delivered', 'bounced') DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    error_message TEXT,
    provider VARCHAR(50), -- 'sendgrid', 'twilio', etc.
    provider_message_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    
    INDEX idx_notification_status (status),
    INDEX idx_sent_at (sent_at)
);

-- Client preferences table
CREATE TABLE client_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL UNIQUE,
    reminder_24h BOOLEAN DEFAULT true,
    reminder_2h BOOLEAN DEFAULT true,
    reminder_email BOOLEAN DEFAULT true,
    reminder_sms BOOLEAN DEFAULT false,
    marketing_emails BOOLEAN DEFAULT false,
    follow_up_surveys BOOLEAN DEFAULT true,
    preferred_appointment_times TEXT, -- JSON array of preferred times
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Insert default services
INSERT INTO services (name, description, duration_minutes, price, service_code) VALUES
('Classic Lashes', 'Natural-looking lash extensions that enhance your eyes with subtle elegance', 120, 120.00, 'CLASSIC'),
('Volume Lashes', 'Fuller, more dramatic lashes using advanced techniques for maximum impact', 150, 150.00, 'VOLUME'),
('Hybrid Lashes', 'Perfect blend of classic and volume techniques for a customized look', 135, 135.00, 'HYBRID'),
('Lash Lift & Tint', 'Enhance your natural lashes with a professional lift and tint', 90, 85.00, 'LIFT_TINT');

-- Insert default business settings
INSERT INTO business_settings (setting_key, setting_value, setting_type, description) VALUES
('business_name', 'estheticsbyanna', 'string', 'Business name'),
('business_phone', '(555) 123-4567', 'string', 'Business phone number'),
('business_email', 'anaidmdiazplaza@gmail.com', 'string', 'Business email address'),
('business_address', '123 Main Street, Downtown, City', 'string', 'Business address'),
('booking_advance_days', '30', 'number', 'How many days in advance clients can book'),
('cancellation_hours', '24', 'number', 'Hours before appointment that cancellation is allowed'),
('deposit_required', 'true', 'boolean', 'Whether deposit is required for bookings'),
('deposit_percentage', '25', 'number', 'Percentage of total price required as deposit'),
('auto_confirm_bookings', 'false', 'boolean', 'Whether bookings are auto-confirmed or need approval'),
('reminder_times', '[1440, 120]', 'json', 'Minutes before appointment to send reminders (24h, 2h)'),
('working_days', '[1,2,3,4,5,6]', 'json', 'Working days (0=Sunday, 1=Monday, etc.)'),
('timezone', 'America/New_York', 'string', 'Business timezone');

-- Insert default available time slots (Monday-Friday: 9AM-6PM, Saturday: 10AM-4PM)
INSERT INTO available_slots (day_of_week, start_time, end_time) VALUES
(1, '09:00', '18:00'), -- Monday
(2, '09:00', '18:00'), -- Tuesday  
(3, '09:00', '18:00'), -- Wednesday
(4, '09:00', '18:00'), -- Thursday
(5, '09:00', '18:00'), -- Friday
(6, '10:00', '16:00'); -- Saturday

-- Insert default email templates
INSERT INTO email_templates (template_name, subject, body_html, body_text, template_type) VALUES
('booking_confirmation', 'Booking Confirmation - Lashed By Anna', 
'<h2>Booking Confirmed!</h2><p>Dear {{client_name}},</p><p>Your appointment has been confirmed for {{appointment_date}} at {{appointment_time}}.</p><p><strong>Service:</strong> {{service_name}}<br><strong>Duration:</strong> {{duration}}<br><strong>Price:</strong> ${{price}}</p><p>We look forward to seeing you!</p>',
'Booking Confirmed! Dear {{client_name}}, Your appointment has been confirmed for {{appointment_date}} at {{appointment_time}}. Service: {{service_name}}, Duration: {{duration}}, Price: ${{price}}. We look forward to seeing you!',
'confirmation'),

('appointment_reminder', 'Appointment Reminder - Lashed By Anna',
'<h2>Appointment Reminder</h2><p>Dear {{client_name}},</p><p>This is a reminder that you have an appointment scheduled for {{appointment_date}} at {{appointment_time}}.</p><p><strong>Service:</strong> {{service_name}}<br><strong>Location:</strong> {{business_address}}</p><p>Please arrive 10 minutes early. If you need to reschedule, please contact us at least 24 hours in advance.</p>',
'Appointment Reminder: Dear {{client_name}}, you have an appointment scheduled for {{appointment_date}} at {{appointment_time}}. Service: {{service_name}}. Please arrive 10 minutes early.',
'reminder');

-- Insert default SMS templates
INSERT INTO sms_templates (template_name, message, template_type) VALUES
('booking_confirmation', 'Hi {{client_name}}! Your lash appointment is confirmed for {{appointment_date}} at {{appointment_time}}. Service: {{service_name}} (${{price}}). Reply STOP to opt out.', 'confirmation'),
('appointment_reminder', 'Hi {{client_name}}! Reminder: Lash appointment tomorrow {{appointment_date}} at {{appointment_time}}. Please arrive 10 min early. Need to reschedule? Call (555) 123-4567', 'reminder');

-- Create indexes for better performance
CREATE INDEX idx_appointments_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX idx_appointments_client_status ON appointments(client_id, status);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_phone ON clients(phone);