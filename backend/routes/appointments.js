const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const appointmentController = require('../controllers/appointmentController');
const auth = require('../middleware/auth');

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

// Public routes
router.get('/availability/:date', appointmentController.getAvailability);
router.get('/services', appointmentController.getServices);
router.post('/book', validateBooking, appointmentController.createBooking);
router.get('/booking/:bookingId', appointmentController.getBookingStatus);

// Protected routes (require esthetician authentication)
router.get('/pending', auth, appointmentController.getPendingAppointments);
router.get('/today', auth, appointmentController.getTodayAppointments);
router.get('/upcoming', auth, appointmentController.getUpcomingAppointments);
router.get('/history', auth, appointmentController.getAppointmentHistory);
router.post('/approve', auth, validateApproval, appointmentController.approveAppointment);
router.post('/reject', auth, validateApproval, appointmentController.rejectAppointment);
router.put('/:id/status', auth, appointmentController.updateAppointmentStatus);
router.put('/:id/reschedule', auth, appointmentController.rescheduleAppointment);
router.delete('/:id/cancel', auth, appointmentController.cancelAppointment);
router.get('/:id/details', auth, appointmentController.getAppointmentDetails);

// Analytics routes
router.get('/analytics/overview', auth, appointmentController.getAnalyticsOverview);
router.get('/analytics/revenue', auth, appointmentController.getRevenueAnalytics);

module.exports = router;