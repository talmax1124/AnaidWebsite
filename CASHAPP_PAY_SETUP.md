# Square Payments Integration Guide

This document explains how to set up and test the comprehensive Square payments integration in your e-commerce application.

## Overview

Square's unified payment system has been integrated into the checkout process using the Square Web Payments SDK. This provides customers with multiple payment options:

- **Credit/Debit Cards** - All major cards supported
- **Apple Pay** - For iOS and Safari users
- **Google Pay** - For Chrome and Android users  
- **Cash App Pay** - Direct payment from Cash App balance

## Features Added

1. **Frontend Integration**
   - Unified payment interface with method selection
   - Credit card form with Square styling
   - Apple Pay, Google Pay, and Cash App Pay buttons
   - Automatic payment method detection
   - Error handling and loading states
   - Responsive design

2. **Backend Integration**
   - Square API payment processing for all methods
   - Payment verification and validation
   - Refund capabilities
   - Webhook support for payment events
   - Comprehensive payment method tracking

## Setup Instructions

### 1. Square Account Setup

1. **Create a Square Developer Account**
   - Visit [Square Developer Dashboard](https://developer.squareup.com/)
   - Create an account or sign in
   - Create a new application

2. **Get Your Credentials**
   - Application ID (for frontend)
   - Location ID (for frontend)
   - Access Token (for backend)

### 2. Environment Variables

#### Frontend (.env)
```bash
# Square Configuration (for Cash App Pay)
REACT_APP_SQUARE_APPLICATION_ID=your_square_application_id_here
REACT_APP_SQUARE_LOCATION_ID=your_square_location_id_here
REACT_APP_SQUARE_ENVIRONMENT=sandbox
```

#### Backend (.env)
```bash
# Square/Cash App Pay Configuration
SQUARE_ACCESS_TOKEN=your_square_access_token_here
SQUARE_APPLICATION_ID=your_square_application_id_here
SQUARE_LOCATION_ID=your_square_location_id_here
SQUARE_ENVIRONMENT=sandbox
```

### 3. Testing Sandbox Setup

For testing, you'll use Square's sandbox environment:

1. **Sandbox Credentials**
   - Use sandbox application ID and access token
   - Set `SQUARE_ENVIRONMENT=sandbox` in both environments

2. **Test Cash App Pay**
   - Cash App Pay in sandbox mode simulates the payment flow
   - No real money is processed in sandbox

### 4. Production Setup

For production:

1. **Switch to Production**
   - Use production application ID and access token
   - Set `SQUARE_ENVIRONMENT=production`
   - Update all environment variables

2. **Webhook Setup**
   - Configure webhooks in Square Dashboard
   - Point to your server: `https://yourdomain.com/api/cashapp/webhook`
   - Subscribe to payment and refund events

## API Endpoints

### Payment Processing
- `POST /api/square/create-payment` - Process Square payment (all methods)
- `GET /api/square/payment/:paymentId` - Get payment details
- `POST /api/square/refund/:paymentId` - Process refund

### Configuration Testing
- `GET /api/square/test-config` - Test Square configuration

### Webhooks
- `POST /api/square/webhook` - Handle Square webhooks

## Usage in Checkout

The Square payment system provides a unified checkout experience:

1. **Payment Method Selection** - Customer chooses from available methods:
   - Credit/Debit Cards (always available)
   - Apple Pay (iOS/Safari only) 
   - Google Pay (Chrome/Android)
   - Cash App Pay

2. **Payment Processing**:
   - **Cards**: Customer fills out secure form
   - **Digital Wallets**: One-click authorization
   - **Cash App**: Direct balance payment

3. **Completion** - Payment processed through Square and order completed

## Testing

### Test the Configuration

1. **Check Backend Configuration**
   ```bash
   curl http://localhost:3001/api/square/test-config
   ```

2. **Expected Response (Success)**
   ```json
   {
     "success": true,
     "message": "Square configuration is valid",
     "config": {
       "accessToken": "Set",
       "applicationId": "Set",
       "locationId": "Set",
       "environment": "sandbox"
     },
     "availablePaymentMethods": [
       "Credit/Debit Cards",
       "Apple Pay (iOS/Safari)",
       "Google Pay (Chrome/Android)",
       "Cash App Pay"
     ],
     "locations": [
       {
         "id": "your-location-id",
         "name": "Default Test Account",
         "status": "ACTIVE"
       }
     ]
   }
   ```

### Test Payment Flow

1. Add items to cart
2. Proceed to checkout
3. Square payment interface will display available methods
4. **Testing Credit Cards**: Use Square's test cards
5. **Testing Digital Wallets**: Available on compatible devices/browsers
6. **Testing Cash App**: Available in sandbox mode
7. Complete payment and verify order completion

## Code Structure

### Frontend Components

1. **SquarePayments Component** (`src/components/SquarePayments.tsx`)
   - Unified payment interface for all Square methods
   - Handles Square Web SDK initialization
   - Manages all payment method selection and processing
   - Dynamic payment method availability detection

2. **CheckoutPage Updates** (`src/pages/CheckoutPage.tsx`)
   - Replaced multiple payment methods with unified Square interface
   - Integrated SquarePayments component
   - Updated order processing for all payment methods

### Backend Routes

1. **Square Route** (`backend/routes/square.js`)
   - Universal payment processing for all Square methods
   - Credit card, Apple Pay, Google Pay, Cash App Pay support
   - Square API integration
   - Error handling and validation
   - Comprehensive payment method tracking

## Security Considerations

1. **Environment Variables**
   - Never commit actual credentials to git
   - Use different credentials for sandbox/production
   - Rotate access tokens regularly

2. **Webhook Verification**
   - Implement webhook signature verification in production
   - Validate incoming webhook data

3. **Payment Validation**
   - Always verify payments server-side
   - Implement proper error handling
   - Log all payment activities

## Troubleshooting

### Common Issues

1. **SDK Loading Error**
   - Check if Square SDK is properly loaded
   - Verify application ID is correct

2. **Payment Button Not Appearing**
   - Check environment variables
   - Verify location ID is valid
   - Check browser console for errors

3. **Payment Processing Fails**
   - Check backend logs for Square API errors
   - Verify access token is valid
   - Check if location is active

4. **Backend Configuration Issues**
   - Test with `/api/cashapp/test-config` endpoint
   - Verify all environment variables are set
   - Check network connectivity to Square API

### Debug Mode

Enable debug logging by checking browser console and server logs:

```javascript
// Frontend debugging
console.log('Cash App Pay initialized with:', {
  applicationId,
  locationId,
  environment
});

// Backend debugging
console.log('Square client configured:', {
  environment: process.env.SQUARE_ENVIRONMENT,
  hasAccessToken: !!process.env.SQUARE_ACCESS_TOKEN
});
```

## Support

For additional support:

1. **Square Documentation**
   - [Square Web Payments SDK](https://developer.squareup.com/docs/web-payments)
   - [Cash App Pay Guide](https://developer.squareup.com/docs/payments-api/take-payments/cash-app-payments)

2. **Square Developer Community**
   - [Square Developer Forum](https://developer.squareup.com/forums)

## Next Steps

1. **Set up your Square sandbox account**
2. **Add the required environment variables**
3. **Test the payment flow**
4. **Configure webhooks for production**
5. **Test thoroughly before going live**

Remember to always test payments thoroughly in sandbox before enabling in production!