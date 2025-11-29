const express = require('express');
const { SquareClient, SquareEnvironment } = require('square');
const router = express.Router();

// Initialize Square client
const squareClient = new SquareClient({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

// Create a payment with Square (supports all payment methods)
router.post('/create-payment', async (req, res) => {
  try {
    const { sourceId, amount, currency = 'USD', referenceId, orderId, paymentMethod = 'card' } = req.body;

    if (!sourceId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sourceId and amount'
      });
    }

    const requestBody = {
      sourceId,
      amountMoney: {
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toUpperCase()
      },
      idempotencyKey: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      referenceId: referenceId || `${paymentMethod}-${orderId || Date.now()}`,
    };

    const response = await squareClient.paymentsApi.createPayment(requestBody);

    if (response.result.payment) {
      const payment = response.result.payment;
      
      return res.json({
        success: true,
        data: {
          paymentId: payment.id,
          status: payment.status,
          amount: payment.amountMoney,
          sourceType: payment.sourceType,
          receiptUrl: payment.receiptUrl,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt
        }
      });
    } else {
      throw new Error('Payment creation failed');
    }
  } catch (error) {
    console.error('Cash App Pay payment error:', error);
    
    // Handle Square API errors
    if (error.errors && Array.isArray(error.errors)) {
      const errorMessages = error.errors.map(err => err.detail || err.code).join(', ');
      return res.status(400).json({
        success: false,
        message: `Payment failed: ${errorMessages}`
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Payment processing failed'
    });
  }
});

// Get payment details
router.get('/payment/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    const response = await squareClient.paymentsApi.getPayment(paymentId);

    if (response.result.payment) {
      const payment = response.result.payment;
      
      return res.json({
        success: true,
        data: {
          paymentId: payment.id,
          status: payment.status,
          amount: payment.amountMoney,
          sourceType: payment.sourceType,
          receiptUrl: payment.receiptUrl,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
          referenceId: payment.referenceId
        }
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
  } catch (error) {
    console.error('Get payment error:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve payment details'
    });
  }
});

// Cancel/refund a payment (for order cancellations)
router.post('/refund/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason = 'Customer refund request' } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    // First get the payment details to validate
    const paymentResponse = await squareClient.paymentsApi.getPayment(paymentId);
    const payment = paymentResponse.result.payment;

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Create refund
    const refundAmount = amount ? Math.round(amount * 100) : payment.amountMoney.amount;
    
    const requestBody = {
      idempotencyKey: `refund-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amountMoney: {
        amount: refundAmount,
        currency: payment.amountMoney.currency
      },
      paymentId: paymentId,
      reason: reason
    };

    const refundResponse = await squareClient.refundsApi.refundPayment(requestBody);

    if (refundResponse.result.refund) {
      const refund = refundResponse.result.refund;
      
      return res.json({
        success: true,
        data: {
          refundId: refund.id,
          status: refund.status,
          amountMoney: refund.amountMoney,
          paymentId: refund.paymentId,
          reason: refund.reason,
          createdAt: refund.createdAt,
          updatedAt: refund.updatedAt
        }
      });
    } else {
      throw new Error('Refund creation failed');
    }
  } catch (error) {
    console.error('Refund error:', error);
    
    if (error.errors && Array.isArray(error.errors)) {
      const errorMessages = error.errors.map(err => err.detail || err.code).join(', ');
      return res.status(400).json({
        success: false,
        message: `Refund failed: ${errorMessages}`
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Refund processing failed'
    });
  }
});

// Webhook handler for Cash App Pay events (optional)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-square-hmacsha256-signature'];
    const body = req.body;
    
    // Note: In production, you should verify the webhook signature
    // using Square's webhook signature verification
    
    const event = JSON.parse(body.toString());
    
    console.log('Cash App Pay webhook received:', {
      type: event.type,
      data: event.data
    });

    // Handle different webhook event types
    switch (event.type) {
      case 'payment.created':
        console.log('Payment created:', event.data.object.payment);
        break;
      case 'payment.updated':
        console.log('Payment updated:', event.data.object.payment);
        break;
      case 'refund.created':
        console.log('Refund created:', event.data.object.refund);
        break;
      case 'refund.updated':
        console.log('Refund updated:', event.data.object.refund);
        break;
      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// Test endpoint to check Square configuration
router.get('/test-config', async (req, res) => {
  try {
    const hasAccessToken = !!process.env.SQUARE_ACCESS_TOKEN;
    const hasApplicationId = !!process.env.SQUARE_APPLICATION_ID;
    const hasLocationId = !!process.env.SQUARE_LOCATION_ID;
    const environment = process.env.SQUARE_ENVIRONMENT || 'sandbox';

    const config = {
      accessToken: hasAccessToken ? 'Set' : 'Missing',
      applicationId: hasApplicationId ? 'Set' : 'Missing',
      locationId: hasLocationId ? 'Set' : 'Missing',
      environment
    };

    if (!hasAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Square Access Token is required',
        config
      });
    }

    // Try to fetch location details to test connectivity
    try {
      const locationsResponse = await squareClient.locationsApi.listLocations();
      const locations = locationsResponse.result.locations || [];
      
      return res.json({
        success: true,
        message: 'Square configuration is valid',
        config,
        locations: locations.map(loc => ({
          id: loc.id,
          name: loc.name,
          status: loc.status
        }))
      });
    } catch (apiError) {
      return res.status(400).json({
        success: false,
        message: 'Square API connection failed',
        config,
        error: apiError.message
      });
    }
  } catch (error) {
    console.error('Test config error:', error);
    res.status(500).json({
      success: false,
      message: 'Configuration test failed',
      error: error.message
    });
  }
});

module.exports = router;