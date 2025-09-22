# Lashed By Anna - Complete Booking System Overview

## 🏗️ System Architecture

This project is a comprehensive lash extension booking website with Firebase backend, Clerk authentication, and an admin dashboard for estheticians.

### Core Components

1. **Main Website** (`index.html`, `styles.css`, `script.js`)
   - Modern, responsive design with neutral colors
   - Service showcase and booking interface
   - 5-step booking process

2. **Firebase Backend** (`firebase-config.js`)
   - Firestore database for appointments, services, users
   - Real-time data synchronization
   - Security rules for role-based access

3. **Authentication** (`auth/clerk-config.js`)
   - Clerk integration for user management
   - Role-based access (client, esthetician, admin)
   - Automatic user sync with Firebase

4. **Admin Dashboard** (`admin.html`, `admin-styles.css`, `admin-dashboard.js`)
   - Esthetician interface for appointment management
   - Real-time appointment approvals/rejections
   - Business settings and analytics

5. **Booking System** (`booking.js`, `booking-firebase.js`)
   - Firebase-integrated booking with real-time availability
   - Automatic conflict prevention
   - Calendar integration (Google/Apple)

6. **Email System** (`firebase/email-service.js`)
   - Automated confirmation/reminder emails
   - Template-based email system
   - Notification logging and tracking

## 🔄 User Flow

### Client Booking Flow
1. **Browse Services**: View available lash services with pricing
2. **Select Service**: Choose from Classic, Volume, Hybrid, or Lash Lift
3. **Pick Date**: Calendar shows available dates
4. **Choose Time**: Available time slots based on service duration
5. **Enter Details**: Contact information and special requests
6. **Submit**: Booking goes to pending approval or auto-confirms
7. **Confirmation**: Receive email with booking details

### Esthetician Approval Flow
1. **Login**: Clerk authentication with esthetician role
2. **Dashboard**: Overview of pending approvals and today's schedule
3. **Review**: See client details, service, date/time
4. **Approve/Reject**: One-click approval or rejection
5. **Notification**: Client receives confirmation email automatically

## 📊 Database Structure

### Collections in Firestore

#### `appointments`
```javascript
{
  clientName: "Jane Doe",
  clientEmail: "jane@example.com",
  clientPhone: "(555) 123-4567",
  serviceId: "volume-lashes",
  serviceName: "Volume Lashes",
  appointmentDateTime: Timestamp,
  duration: 150, // minutes
  totalPrice: 150.00,
  status: "pending" | "confirmed" | "completed" | "cancelled",
  notes: "First time client",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `services`
```javascript
{
  name: "Volume Lashes",
  description: "Fuller, dramatic lashes",
  durationMinutes: 150,
  price: 150.00,
  serviceCode: "VOLUME",
  isActive: true,
  category: "lash-extensions"
}
```

#### `users`
```javascript
{
  email: "user@example.com",
  firstName: "Jane",
  lastName: "Doe",
  role: "client" | "esthetician" | "admin",
  phone: "(555) 123-4567",
  createdAt: Timestamp,
  lastActiveAt: Timestamp
}
```

#### `businessSettings`
```javascript
{
  businessName: "Lashed By Anna",
  businessPhone: "(555) 123-4567",
  businessEmail: "hello@lashedbyanna.com",
  autoConfirmBookings: false,
  bookingAdvanceDays: 30,
  cancellationHours: 24,
  depositRequired: true,
  depositPercentage: 25
}
```

## 🔒 Security & Permissions

### Firestore Rules
- **Public**: Read services, business settings, create appointments
- **Clients**: Read/write own data and appointments
- **Estheticians**: Full access to appointments, clients, business settings
- **Authentication**: Required for most operations via Clerk

### Role-Based Access
- **Clients**: Can book appointments, view own bookings
- **Estheticians**: Can approve/reject appointments, manage schedule
- **Admin**: Full system access including business settings

## 📧 Email System

### Automated Emails
1. **Pending Approval**: Sent when booking requires approval
2. **Confirmation**: Sent when appointment is approved/confirmed
3. **Reminders**: Sent 24 hours before appointment
4. **Status Changes**: Sent when appointments are modified

### Templates
- HTML and text versions
- Variable substitution (`{{clientName}}`, `{{serviceName}}`, etc.)
- Brand-consistent styling
- Mobile-responsive design

## 🚀 Deployment Setup

### Prerequisites
1. **Firebase Project**: Create project with Firestore enabled
2. **Clerk Account**: Set up authentication provider
3. **Email Service**: Configure SendGrid, AWS SES, or similar

### Environment Variables
```javascript
// Firebase Config
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... other config
};

// Clerk Config
const CLERK_PUBLISHABLE_KEY = "pk_test_your-key";
```

### Database Initialization
1. Deploy Firestore rules from `firebase/firestore-rules.rules`
2. Run seed script: `node firebase/seed-data.js`
3. Configure business settings in admin dashboard

## 📱 Features

### ✅ Implemented
- [x] Responsive website design
- [x] Firebase database integration
- [x] Clerk authentication system
- [x] Admin dashboard with real-time updates
- [x] Appointment approval workflow
- [x] Email notification system
- [x] Calendar availability checking
- [x] Service management
- [x] Client management
- [x] Business settings configuration

### 🔮 Future Enhancements
- [ ] SMS notifications integration
- [ ] Payment processing (Stripe/Square)
- [ ] Advanced analytics and reporting
- [ ] Client portal with booking history
- [ ] Instagram integration
- [ ] Multi-location support
- [ ] Staff scheduling system
- [ ] Inventory management
- [ ] Customer reviews and ratings

## 🛠️ Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Firestore, Functions, Hosting)
- **Authentication**: Clerk
- **Email**: SendGrid (or similar service)
- **Styling**: Custom CSS with modern design patterns
- **Database**: NoSQL (Firestore)
- **Real-time**: Firebase onSnapshot listeners

## 📞 Support

For technical support or feature requests:
- Check browser console for error messages
- Ensure Firebase and Clerk configurations are correct
- Verify Firestore rules allow required operations
- Test with different user roles for permission issues

---

**Built with ❤️ for Lashed By Anna**
*Modern lash extension booking made simple*