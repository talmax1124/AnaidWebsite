const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const appointmentController = require('../controllers/appointmentController');
const auth = require('../middleware/auth');
const db = require('../config/database');

// Helper function to convert 24-hour time to 12-hour format
const formatTo12Hour = (time24) => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Validation middleware
const validateBooking = [
    body('clientInfo.name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('clientInfo.email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('clientInfo.phone').matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Valid phone number required'),
    body('serviceId').isInt({ min: 1 }).withMessage('Valid service ID required'),
    body('appointmentDate').isISO8601().withMessage('Valid date required'),
    body('appointmentTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time required'),
    body('clientInfo.notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes too long')
];

const validateApproval = [
    body('appointmentId').isInt({ min: 1 }).withMessage('Valid appointment ID required'),
    body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long')
];

// Get availability for a specific date
router.get('/availability/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date format
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Use default business settings for now (later can be moved to database)
    const businessSettings = {
      workingHours: {
        monday: { isOpen: true, startTime: '09:00', endTime: '21:00' },
        tuesday: { isOpen: true, startTime: '14:00', endTime: '18:00' },
        wednesday: { isOpen: true, startTime: '09:00', endTime: '21:00' },
        thursday: { isOpen: false, startTime: '09:00', endTime: '17:00' },
        friday: { isOpen: true, startTime: '14:00', endTime: '22:00' },
        saturday: { isOpen: true, startTime: '14:00', endTime: '22:00' },
        sunday: { isOpen: true, startTime: '14:00', endTime: '22:00' }
      },
      timeSlotDuration: 30,
      bufferTime: 15
    };

    // Get day of week for the requested date
    const requestedDate = new Date(date + 'T12:00:00');
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[requestedDate.getDay()];
    
    const daySettings = businessSettings.workingHours[dayOfWeek];
    
    // If the business is closed on this day, return no availability
    if (!daySettings || !daySettings.isOpen) {
      return res.json({
        success: true,
        availability: [],
        businessHours: {
          day: dayOfWeek,
          isOpen: false,
          startTime: daySettings?.startTime || '09:00',
          endTime: daySettings?.endTime || '17:00',
          startTime12: formatTo12Hour(daySettings?.startTime || '09:00'),
          endTime12: formatTo12Hour(daySettings?.endTime || '17:00')
        },
        message: `Closed on ${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}`
      });
    }

    // Generate time slots based on working hours
    const timeSlots = [];
    const startTime = daySettings.startTime || '09:00';
    const endTime = daySettings.endTime || '17:00';
    const slotDuration = businessSettings.timeSlotDuration || 30;
    const bufferTime = businessSettings.bufferTime || 15;
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    // Get existing appointments from database
    let existingAppointments = [];
    try {
      existingAppointments = await db.query(`
        SELECT appointment_time, duration 
        FROM appointments 
        WHERE appointment_date = $1 
        AND status IN ('scheduled', 'confirmed')
      `, [date]);
    } catch (dbError) {
      console.warn('Database query failed, using empty appointments:', dbError.message);
      existingAppointments = [];
    }

    // Generate available time slots
    for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Check if this slot conflicts with existing appointments
      const isBooked = existingAppointments.some(appointment => {
        const appointmentTime = appointment.appointment_time;
        const [appointmentHour, appointmentMinute] = appointmentTime.split(':').map(Number);
        const appointmentStartMinutes = appointmentHour * 60 + appointmentMinute;
        const appointmentEndMinutes = appointmentStartMinutes + appointment.duration + bufferTime;
        
        return minutes < appointmentEndMinutes && (minutes + slotDuration) > appointmentStartMinutes;
      });

      timeSlots.push({
        time: timeString,
        time12: formatTo12Hour(timeString),
        available: !isBooked,
        booked: isBooked
      });
    }

    res.json({
      success: true,
      availability: timeSlots,
      businessHours: {
        day: dayOfWeek,
        isOpen: daySettings.isOpen,
        startTime: daySettings.startTime,
        endTime: daySettings.endTime,
        startTime12: formatTo12Hour(daySettings.startTime),
        endTime12: formatTo12Hour(daySettings.endTime)
      }
    });

  } catch (error) {
    console.error('Error fetching availability:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Basic services endpoint - return static data for now
router.get('/services', (req, res) => {
  res.json({ 
    success: true,
    services: [
      {
        id: 1,
        name: 'Basic Facial',
        description: 'A refreshing facial treatment',
        duration_minutes: 60,
        price: 80.00,
        service_code: 'BASIC_FACIAL'
      },
      {
        id: 2,
        name: 'Deep Cleansing Facial',
        description: 'Advanced deep cleansing treatment',
        duration_minutes: 90,
        price: 120.00,
        service_code: 'DEEP_FACIAL'
      }
    ]
  });
});

// Basic addons endpoint - return static data for now
router.get('/addons', (req, res) => {
  res.json({ 
    success: true,
    addons: [
      {
        id: 1,
        name: 'Vitamin C Serum',
        description: 'Brightening vitamin C treatment',
        price: 25.00,
        addon_code: 'VITAMIN_C'
      },
      {
        id: 2,
        name: 'Hydrating Mask',
        description: 'Deep moisturizing mask treatment',
        price: 15.00,
        addon_code: 'HYDRO_MASK'
      }
    ]
  });
});

// Basic upcoming appointments endpoint - return empty array for now
router.get('/upcoming', (req, res) => {
  res.json({ 
    success: true,
    appointments: []
  });
});

// router.post('/book', validateBooking, appointmentController.createBooking);
// router.get('/booking/:bookingId', appointmentController.getBookingStatus);

// TODO: Protected routes (require esthetician authentication and database)
// router.get('/pending', auth, appointmentController.getPendingAppointments);
// router.get('/today', auth, appointmentController.getTodayAppointments);
// router.get('/upcoming', auth, appointmentController.getUpcomingAppointments);
// router.get('/history', auth, appointmentController.getAppointmentHistory);
// router.post('/approve', auth, validateApproval, appointmentController.approveAppointment);
// router.post('/reject', auth, validateApproval, appointmentController.rejectAppointment);
// TODO: These require database functionality
// router.put('/:id/status', auth, appointmentController.updateAppointmentStatus);
// router.put('/:id/reschedule', auth, appointmentController.rescheduleAppointment);
// router.delete('/:id/cancel', auth, appointmentController.cancelAppointment); 
// router.get('/:id/details', auth, appointmentController.getAppointmentDetails);

// TODO: Analytics routes (require database functionality)
// router.get('/analytics/overview', auth, appointmentController.getAnalyticsOverview);
// router.get('/analytics/revenue', auth, appointmentController.getRevenueAnalytics);

module.exports = router;