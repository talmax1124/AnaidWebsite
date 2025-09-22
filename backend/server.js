const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const clientRoutes = require('./routes/clients');
const adminRoutes = require('./routes/admin');
const reminderService = require('./services/reminderService');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Cron jobs for automated tasks
if (process.env.NODE_ENV !== 'test') {
    // Send reminders every 15 minutes
    cron.schedule('*/15 * * * *', () => {
        console.log('Running reminder check...');
        reminderService.processReminders();
    });

    // Clean up old notifications daily at 2 AM
    cron.schedule('0 2 * * *', () => {
        console.log('Running daily cleanup...');
        reminderService.cleanupOldNotifications();
    });

    // Generate daily reports at 6 AM
    cron.schedule('0 6 * * *', () => {
        console.log('Generating daily reports...');
        // Add report generation logic here
    });
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Lashed By Anna API Server running on port ${PORT}`);
    console.log(`📧 Email service: ${process.env.SENDGRID_API_KEY ? 'Enabled' : 'Disabled'}`);
    console.log(`📱 SMS service: ${process.env.TWILIO_ACCOUNT_SID ? 'Enabled' : 'Disabled'}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;