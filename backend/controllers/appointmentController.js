const { validationResult } = require('express-validator');
const moment = require('moment-timezone');
const db = require('../config/database');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const reminderService = require('../services/reminderService');

const appointmentController = {
    // Get available time slots for a specific date
    async getAvailability(req, res) {
        try {
            const { date } = req.params;
            const appointmentDate = moment(date).format('YYYY-MM-DD');
            
            // Validate date
            if (!moment(date).isValid() || moment(date).isBefore(moment().startOf('day'))) {
                return res.status(400).json({ error: 'Invalid date' });
            }
            
            // Get day of week (0 = Sunday, 1 = Monday, etc.)
            const dayOfWeek = moment(date).day();
            
            // Get available slots for this day
            const availableSlots = await db.getMany(`
                SELECT start_time, end_time 
                FROM available_slots 
                WHERE day_of_week = ? AND is_available = true
            `, [dayOfWeek]);
            
            if (availableSlots.length === 0) {
                return res.json({ availableSlots: [] });
            }
            
            // Get existing appointments for this date
            const bookedSlots = await db.getMany(`
                SELECT appointment_time, duration_minutes 
                FROM appointments 
                WHERE appointment_date = ? AND status IN ('confirmed', 'pending')
            `, [appointmentDate]);
            
            // Generate time slots (30-minute intervals)
            const timeSlots = [];
            const startTime = moment(availableSlots[0].start_time, 'HH:mm');
            const endTime = moment(availableSlots[0].end_time, 'HH:mm');
            
            while (startTime.isBefore(endTime)) {
                const slotTime = startTime.format('HH:mm');
                
                // Check if this slot conflicts with existing appointments
                const isAvailable = !bookedSlots.some(booking => {
                    const bookingStart = moment(booking.appointment_time, 'HH:mm');
                    const bookingEnd = bookingStart.clone().add(booking.duration_minutes, 'minutes');
                    const slotStart = moment(slotTime, 'HH:mm');
                    
                    return slotStart.isBetween(bookingStart, bookingEnd, null, '[)');
                });
                
                timeSlots.push({
                    time: slotTime,
                    available: isAvailable
                });
                
                startTime.add(30, 'minutes');
            }
            
            res.json({ availableSlots: timeSlots });
        } catch (error) {
            console.error('Error getting availability:', error);
            res.status(500).json({ error: 'Failed to get availability' });
        }
    },
    
    // Get all services
    async getServices(req, res) {
        try {
            const services = await db.getMany(`
                SELECT id, name, description, duration_minutes, price, service_code
                FROM services 
                WHERE is_active = true 
                ORDER BY price ASC
            `);
            
            res.json({ services });
        } catch (error) {
            console.error('Error getting services:', error);
            res.status(500).json({ error: 'Failed to get services' });
        }
    },
    
    // Create a new booking
    async createBooking(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            
            const { clientInfo, serviceId, appointmentDate, appointmentTime, notes } = req.body;
            
            // Check if the time slot is still available
            const existingAppointment = await db.getOne(`
                SELECT id FROM appointments 
                WHERE appointment_date = ? AND appointment_time = ? 
                AND status IN ('confirmed', 'pending')
            `, [appointmentDate, appointmentTime]);
            
            if (existingAppointment) {
                return res.status(409).json({ error: 'Time slot no longer available' });
            }
            
            // Get service details
            const service = await db.getOne(`
                SELECT * FROM services WHERE id = ? AND is_active = true
            `, [serviceId]);
            
            if (!service) {
                return res.status(404).json({ error: 'Service not found' });
            }
            
            // Check if client exists, if not create new client
            let client = await db.getOne(`
                SELECT id FROM clients WHERE email = ?
            `, [clientInfo.email]);
            
            let clientId;
            if (client) {
                clientId = client.id;
                // Update client info
                await db.update(`
                    UPDATE clients 
                    SET first_name = ?, last_name = ?, phone = ?, updated_at = NOW()
                    WHERE id = ?
                `, [clientInfo.firstName || clientInfo.name.split(' ')[0], 
                    clientInfo.lastName || clientInfo.name.split(' ').slice(1).join(' '), 
                    clientInfo.phone, clientId]);
            } else {
                // Create new client
                clientId = await db.insert(`
                    INSERT INTO clients (first_name, last_name, email, phone)
                    VALUES (?, ?, ?, ?)
                `, [clientInfo.firstName || clientInfo.name.split(' ')[0], 
                    clientInfo.lastName || clientInfo.name.split(' ').slice(1).join(' '), 
                    clientInfo.email, clientInfo.phone]);
            }
            
            // Generate booking ID
            const bookingId = `LBA${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
            
            // Check if auto-approval is enabled
            const autoApprove = await db.getOne(`
                SELECT setting_value FROM business_settings 
                WHERE setting_key = 'auto_confirm_bookings'
            `);
            
            const status = autoApprove && autoApprove.setting_value === 'true' ? 'confirmed' : 'pending';
            
            // Create appointment
            const appointmentId = await db.insert(`
                INSERT INTO appointments (
                    booking_id, client_id, service_id, appointment_date, 
                    appointment_time, duration_minutes, status, total_price, 
                    client_notes, confirmed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [bookingId, clientId, serviceId, appointmentDate, appointmentTime, 
                service.duration_minutes, status, service.price, notes,
                status === 'confirmed' ? new Date() : null]);
            
            // Create appointment history entry
            await db.insert(`
                INSERT INTO appointment_history (appointment_id, action, new_status, change_reason)
                VALUES (?, 'created', ?, 'Initial booking')
            `, [appointmentId, status]);
            
            // Schedule reminders
            await reminderService.scheduleReminders(appointmentId);
            
            // Send confirmation email/SMS
            if (status === 'confirmed') {
                await emailService.sendBookingConfirmation(clientInfo.email, {
                    clientName: clientInfo.name,
                    serviceName: service.name,
                    appointmentDate,
                    appointmentTime,
                    duration: service.duration_minutes,
                    price: service.price,
                    bookingId
                });
                
                if (clientInfo.phone) {
                    await smsService.sendBookingConfirmation(clientInfo.phone, {
                        clientName: clientInfo.name,
                        serviceName: service.name,
                        appointmentDate,
                        appointmentTime,
                        price: service.price
                    });
                }
            } else {
                // Send pending approval notification
                await emailService.sendPendingApproval(clientInfo.email, {
                    clientName: clientInfo.name,
                    serviceName: service.name,
                    appointmentDate,
                    appointmentTime,
                    bookingId
                });
            }
            
            res.status(201).json({
                success: true,
                bookingId,
                status,
                message: status === 'confirmed' ? 
                    'Booking confirmed! You will receive a confirmation email shortly.' :
                    'Booking submitted! You will receive a confirmation email once approved.'
            });
            
        } catch (error) {
            console.error('Error creating booking:', error);
            res.status(500).json({ error: 'Failed to create booking' });
        }
    },
    
    // Get booking status
    async getBookingStatus(req, res) {
        try {
            const { bookingId } = req.params;
            
            const booking = await db.getOne(`
                SELECT a.*, s.name as service_name, s.duration_minutes, s.price,
                       c.first_name, c.last_name, c.email, c.phone
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                JOIN clients c ON a.client_id = c.id
                WHERE a.booking_id = ?
            `, [bookingId]);
            
            if (!booking) {
                return res.status(404).json({ error: 'Booking not found' });
            }
            
            res.json({ booking });
        } catch (error) {
            console.error('Error getting booking status:', error);
            res.status(500).json({ error: 'Failed to get booking status' });
        }
    },
    
    // Get pending appointments (for esthetician approval)
    async getPendingAppointments(req, res) {
        try {
            const appointments = await db.getMany(`
                SELECT a.*, s.name as service_name, s.duration_minutes, s.price,
                       c.first_name, c.last_name, c.email, c.phone,
                       CONCAT(c.first_name, ' ', c.last_name) as client_name
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                JOIN clients c ON a.client_id = c.id
                WHERE a.status = 'pending'
                ORDER BY a.created_at ASC
            `);
            
            res.json({ appointments });
        } catch (error) {
            console.error('Error getting pending appointments:', error);
            res.status(500).json({ error: 'Failed to get pending appointments' });
        }
    },
    
    // Approve appointment
    async approveAppointment(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            
            const { appointmentId, notes } = req.body;
            
            // Get appointment details
            const appointment = await db.getOne(`
                SELECT a.*, s.name as service_name, s.duration_minutes, s.price,
                       c.first_name, c.last_name, c.email, c.phone
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                JOIN clients c ON a.client_id = c.id
                WHERE a.id = ? AND a.status = 'pending'
            `, [appointmentId]);
            
            if (!appointment) {
                return res.status(404).json({ error: 'Pending appointment not found' });
            }
            
            // Update appointment status
            await db.update(`
                UPDATE appointments 
                SET status = 'confirmed', confirmed_at = NOW(), notes = ?
                WHERE id = ?
            `, [notes, appointmentId]);
            
            // Add history entry
            await db.insert(`
                INSERT INTO appointment_history (appointment_id, action, old_status, new_status, changed_by, change_reason)
                VALUES (?, 'approved', 'pending', 'confirmed', ?, ?)
            `, [appointmentId, req.user.id, notes || 'Appointment approved']);
            
            // Send confirmation email/SMS
            const clientName = `${appointment.first_name} ${appointment.last_name}`;
            await emailService.sendBookingConfirmation(appointment.email, {
                clientName,
                serviceName: appointment.service_name,
                appointmentDate: appointment.appointment_date,
                appointmentTime: appointment.appointment_time,
                duration: appointment.duration_minutes,
                price: appointment.price,
                bookingId: appointment.booking_id
            });
            
            if (appointment.phone) {
                await smsService.sendBookingConfirmation(appointment.phone, {
                    clientName,
                    serviceName: appointment.service_name,
                    appointmentDate: appointment.appointment_date,
                    appointmentTime: appointment.appointment_time,
                    price: appointment.price
                });
            }
            
            res.json({ success: true, message: 'Appointment approved and confirmation sent' });
            
        } catch (error) {
            console.error('Error approving appointment:', error);
            res.status(500).json({ error: 'Failed to approve appointment' });
        }
    },
    
    // Reject appointment
    async rejectAppointment(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            
            const { appointmentId, notes } = req.body;
            
            // Get appointment details
            const appointment = await db.getOne(`
                SELECT a.*, s.name as service_name,
                       c.first_name, c.last_name, c.email, c.phone
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                JOIN clients c ON a.client_id = c.id
                WHERE a.id = ? AND a.status = 'pending'
            `, [appointmentId]);
            
            if (!appointment) {
                return res.status(404).json({ error: 'Pending appointment not found' });
            }
            
            // Update appointment status
            await db.update(`
                UPDATE appointments 
                SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = ?
                WHERE id = ?
            `, [notes, appointmentId]);
            
            // Add history entry
            await db.insert(`
                INSERT INTO appointment_history (appointment_id, action, old_status, new_status, changed_by, change_reason)
                VALUES (?, 'rejected', 'pending', 'cancelled', ?, ?)
            `, [appointmentId, req.user.id, notes || 'Appointment rejected']);
            
            // Send rejection email
            const clientName = `${appointment.first_name} ${appointment.last_name}`;
            await emailService.sendAppointmentRejection(appointment.email, {
                clientName,
                serviceName: appointment.service_name,
                appointmentDate: appointment.appointment_date,
                appointmentTime: appointment.appointment_time,
                reason: notes
            });
            
            res.json({ success: true, message: 'Appointment rejected and client notified' });
            
        } catch (error) {
            console.error('Error rejecting appointment:', error);
            res.status(500).json({ error: 'Failed to reject appointment' });
        }
    },
    
    // Get today's appointments
    async getTodayAppointments(req, res) {
        try {
            const today = moment().format('YYYY-MM-DD');
            
            const appointments = await db.getMany(`
                SELECT a.*, s.name as service_name, s.duration_minutes,
                       CONCAT(c.first_name, ' ', c.last_name) as client_name,
                       c.phone, c.email
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                JOIN clients c ON a.client_id = c.id
                WHERE a.appointment_date = ? AND a.status IN ('confirmed', 'completed')
                ORDER BY a.appointment_time ASC
            `, [today]);
            
            res.json({ appointments });
        } catch (error) {
            console.error('Error getting today\'s appointments:', error);
            res.status(500).json({ error: 'Failed to get today\'s appointments' });
        }
    },
    
    // Get upcoming appointments
    async getUpcomingAppointments(req, res) {
        try {
            const today = moment().format('YYYY-MM-DD');
            const limit = req.query.limit || 10;
            
            const appointments = await db.getMany(`
                SELECT a.*, s.name as service_name, s.duration_minutes,
                       CONCAT(c.first_name, ' ', c.last_name) as client_name,
                       c.phone, c.email
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                JOIN clients c ON a.client_id = c.id
                WHERE a.appointment_date > ? AND a.status = 'confirmed'
                ORDER BY a.appointment_date ASC, a.appointment_time ASC
                LIMIT ?
            `, [today, parseInt(limit)]);
            
            res.json({ appointments });
        } catch (error) {
            console.error('Error getting upcoming appointments:', error);
            res.status(500).json({ error: 'Failed to get upcoming appointments' });
        }
    },
    
    // Get appointment history
    async getAppointmentHistory(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            
            const appointments = await db.getMany(`
                SELECT a.*, s.name as service_name,
                       CONCAT(c.first_name, ' ', c.last_name) as client_name,
                       c.email, c.phone
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                JOIN clients c ON a.client_id = c.id
                ORDER BY a.created_at DESC
                LIMIT ? OFFSET ?
            `, [limit, offset]);
            
            const totalCount = await db.getOne(`
                SELECT COUNT(*) as count FROM appointments
            `);
            
            res.json({
                appointments,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount.count / limit),
                    totalCount: totalCount.count,
                    limit
                }
            });
        } catch (error) {
            console.error('Error getting appointment history:', error);
            res.status(500).json({ error: 'Failed to get appointment history' });
        }
    },
    
    // Update appointment status
    async updateAppointmentStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;
            
            const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }
            
            // Get current appointment
            const appointment = await db.getOne(`
                SELECT * FROM appointments WHERE id = ?
            `, [id]);
            
            if (!appointment) {
                return res.status(404).json({ error: 'Appointment not found' });
            }
            
            // Update appointment
            const updateFields = ['status = ?'];
            const updateValues = [status];
            
            if (status === 'confirmed' && !appointment.confirmed_at) {
                updateFields.push('confirmed_at = NOW()');
            } else if (status === 'cancelled') {
                updateFields.push('cancelled_at = NOW()');
                if (notes) {
                    updateFields.push('cancellation_reason = ?');
                    updateValues.push(notes);
                }
            } else if (status === 'completed') {
                updateFields.push('completed_at = NOW()');
            }
            
            if (notes && status !== 'cancelled') {
                updateFields.push('notes = ?');
                updateValues.push(notes);
            }
            
            updateValues.push(id);
            
            await db.update(`
                UPDATE appointments SET ${updateFields.join(', ')} WHERE id = ?
            `, updateValues);
            
            // Add history entry
            await db.insert(`
                INSERT INTO appointment_history (appointment_id, action, old_status, new_status, changed_by, change_reason)
                VALUES (?, 'status_updated', ?, ?, ?, ?)
            `, [id, appointment.status, status, req.user.id, notes || `Status changed to ${status}`]);
            
            res.json({ success: true, message: 'Appointment status updated' });
            
        } catch (error) {
            console.error('Error updating appointment status:', error);
            res.status(500).json({ error: 'Failed to update appointment status' });
        }
    },
    
    // Get analytics overview
    async getAnalyticsOverview(req, res) {
        try {
            const today = moment().format('YYYY-MM-DD');
            const thisMonth = moment().format('YYYY-MM');
            
            // Get key metrics
            const [
                todayAppointments,
                thisMonthAppointments,
                pendingCount,
                revenueThisMonth
            ] = await Promise.all([
                db.getOne(`SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND status = 'confirmed'`, [today]),
                db.getOne(`SELECT COUNT(*) as count FROM appointments WHERE DATE_FORMAT(appointment_date, '%Y-%m') = ? AND status IN ('confirmed', 'completed')`, [thisMonth]),
                db.getOne(`SELECT COUNT(*) as count FROM appointments WHERE status = 'pending'`),
                db.getOne(`SELECT COALESCE(SUM(total_price), 0) as revenue FROM appointments WHERE DATE_FORMAT(appointment_date, '%Y-%m') = ? AND status = 'completed'`, [thisMonth])
            ]);
            
            res.json({
                analytics: {
                    todayAppointments: todayAppointments.count,
                    thisMonthAppointments: thisMonthAppointments.count,
                    pendingApprovals: pendingCount.count,
                    monthlyRevenue: parseFloat(revenueThisMonth.revenue)
                }
            });
        } catch (error) {
            console.error('Error getting analytics:', error);
            res.status(500).json({ error: 'Failed to get analytics' });
        }
    },
    
    // Get revenue analytics
    async getRevenueAnalytics(req, res) {
        try {
            const period = req.query.period || '30'; // days
            const startDate = moment().subtract(parseInt(period), 'days').format('YYYY-MM-DD');
            
            const revenueData = await db.getMany(`
                SELECT 
                    DATE(appointment_date) as date,
                    COUNT(*) as appointments,
                    SUM(total_price) as revenue
                FROM appointments 
                WHERE appointment_date >= ? 
                    AND status = 'completed'
                GROUP BY DATE(appointment_date)
                ORDER BY date ASC
            `, [startDate]);
            
            res.json({ revenueData });
        } catch (error) {
            console.error('Error getting revenue analytics:', error);
            res.status(500).json({ error: 'Failed to get revenue analytics' });
        }
    }
};

module.exports = appointmentController;