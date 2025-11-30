const express = require('express');
const { SquareClient, SquareEnvironment } = require('square');
const router = express.Router();
const ShippoService = require('../services/shippoService');

// Public config for frontend (non-sensitive)
router.get('/public-config', (req, res) => {
  res.json({
    success: true,
    data: {
      applicationId: process.env.SQUARE_APPLICATION_ID || null,
      locationId: process.env.SQUARE_LOCATION_ID || null,
      environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
    },
  });
});

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

    // Add additional metadata for different payment methods
    if (paymentMethod === 'apple' || paymentMethod === 'google') {
      requestBody.note = `Payment via ${paymentMethod} Pay`;
    } else if (paymentMethod === 'cashapp') {
      requestBody.note = 'Payment via Cash App Pay';
    }

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
          paymentMethod: paymentMethod,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt
        }
      });
    } else {
      throw new Error('Payment creation failed');
    }
  } catch (error) {
    console.error('Square payment error:', error);
    
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
          referenceId: payment.referenceId,
          note: payment.note
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

// Webhook handler for Square payment events with order processing
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-square-hmacsha256-signature'];
    const body = req.body;
    
    // Note: In production, you should verify the webhook signature
    // using Square's webhook signature verification
    
    const event = JSON.parse(body.toString());
    
    console.log('Square webhook received:', {
      type: event.type,
      data: event.data
    });

    // Handle different webhook event types
    switch (event.type) {
      case 'payment.created':
      case 'payment.updated':
        const payment = event.data.object.payment;
        
        // If payment is completed, process the order
        if (payment.status === 'COMPLETED') {
          try {
            await processCompletedPayment(payment);
          } catch (processError) {
            console.error('Error processing completed payment:', processError);
          }
        }
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

// Helper function to process completed payments
async function processCompletedPayment(payment) {
  console.log('Processing completed payment:', payment.id);
  
  // Here you would:
  // 1. Extract order information from payment reference
  // 2. Create order in your database
  // 3. Send confirmation email
  // 4. Create shipping label via SHIPPO if needed
  // 5. Update inventory
  
  // For now, just log the successful payment
  console.log('Payment completed successfully:', {
    paymentId: payment.id,
    amount: payment.amountMoney,
    referenceId: payment.referenceId,
    status: payment.status
  });
}

// Create Square Payment Link with SHIPPO integration
router.post('/create-checkout', async (req, res) => {
  try {
    const { 
      cartItems = [], 
      customerData = {}, 
      shippingAddress = {},
      subtotal = 0,
      amount = 0,
      currency = 'USD', 
      referenceId 
    } = req.body;

    // Use either amount or subtotal parameter
    const orderAmount = amount || subtotal;

    console.log('Creating Square Payment Link with SHIPPO integration:', {
      cartItems: cartItems.length,
      orderAmount,
      customerData: !!customerData.email,
      shippingAddress: !!shippingAddress.city,
      requestBody: req.body
    });

    if (!orderAmount || orderAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    let shippingRates = [];
    let selectedShippingRate = null;
    let totalWithShipping = orderAmount;

    // Get SHIPPO shipping rates if address is provided
    if (shippingAddress && shippingAddress.city && shippingAddress.state && shippingAddress.zipCode) {
      try {
        console.log('Getting SHIPPO rates for address:', shippingAddress);
        
        // Convert cart items to SHIPPO format
        const items = cartItems.map(item => ({
          value: item.price || 25.99,
          quantity: item.quantity || 1,
          weight: item.weight || 1
        }));

        const shippoResult = await ShippoService.getShippingRates(
          {
            name: 'Esthetics By Anna',
            street1: '123 Business Street',
            city: 'Los Angeles',
            state: 'CA',
            zip: '90210',
            country: 'US'
          },
          {
            name: `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim(),
            street1: shippingAddress.street || shippingAddress.address,
            city: shippingAddress.city,
            state: shippingAddress.state,
            zip: shippingAddress.zipCode || shippingAddress.zip,
            country: shippingAddress.country || 'US'
          },
          [{
            length: '12',
            width: '8',
            height: '6',
            distance_unit: 'in',
            weight: Math.max(items.reduce((sum, item) => sum + (item.weight * item.quantity), 0), 1).toString(),
            mass_unit: 'lb'
          }]
        );

        if (shippoResult.success && shippoResult.rates.length > 0) {
          shippingRates = shippoResult.rates;
          // Select cheapest shipping option
          selectedShippingRate = shippoResult.rates[0];
          totalWithShipping = orderAmount + selectedShippingRate.price;
          
          console.log('SHIPPO rates found:', {
            ratesCount: shippingRates.length,
            selectedRate: selectedShippingRate.name,
            shippingCost: selectedShippingRate.price,
            total: totalWithShipping
          });
        } else {
          console.log('SHIPPO rates failed, using fallback:', shippoResult.error || 'No rates returned');
          // Fallback shipping
          selectedShippingRate = {
            name: 'Standard Shipping',
            price: 8.99,
            carrier: 'USPS'
          };
          totalWithShipping = orderAmount + selectedShippingRate.price;
        }
      } catch (shippoError) {
        console.error('SHIPPO integration error:', shippoError);
        // Fallback shipping
        selectedShippingRate = {
          name: 'Standard Shipping', 
          price: 8.99,
          carrier: 'USPS'
        };
        totalWithShipping = orderAmount + selectedShippingRate.price;
      }
    } else {
      console.log('No shipping address provided, using pickup/digital delivery');
      selectedShippingRate = {
        name: 'Pickup/Digital',
        price: 0,
        carrier: 'Pickup'
      };
    }

    // Try to create Square Payment Link using different API approaches
    const locationId = process.env.SQUARE_LOCATION_ID;

    if (!locationId) {
      throw new Error('Square Location ID is required for checkout creation');
    }

    // Prepare line items for Square
    const lineItems = cartItems.map(item => ({
      quantity: item.quantity?.toString() || '1',
      basePriceMoney: {
        amount: Math.round((item.price || 25.99) * 100), // Convert to cents
        currency: currency.toUpperCase()
      },
      name: item.productName || `Product ${item.productId?.slice(0, 8)}`,
      note: item.variantOptions ? JSON.stringify(item.variantOptions) : undefined
    }));

    // Add shipping as a line item if applicable
    if (selectedShippingRate && selectedShippingRate.price > 0) {
      lineItems.push({
        quantity: '1',
        basePriceMoney: {
          amount: Math.round(selectedShippingRate.price * 100), // Convert to cents
          currency: currency.toUpperCase()
        },
        name: `Shipping: ${selectedShippingRate.name}`,
        note: `Carrier: ${selectedShippingRate.carrier}`
      });
    }

    console.log('Creating Square checkout with request:', {
      lineItemsCount: lineItems.length,
      totalAmount: totalWithShipping,
      locationId,
      squareClient: Object.keys(squareClient)
    });

    // Try different Square API approaches
    let response;
    try {
      // Try approach 1: checkoutApi.createPaymentLink
      if (squareClient.checkoutApi && squareClient.checkoutApi.createPaymentLink) {
        const createCheckoutRequest = {
          idempotencyKey: `checkout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          order: {
            locationId: locationId,
            lineItems: lineItems,
            source: { name: 'Esthetics By Anna E-commerce' },
            metadata: {
              orderReference: referenceId || `order-${Date.now()}`,
              customerEmail: customerData.email || ''
            }
          },
          checkoutOptions: {
            redirectUrl: `${req.headers.origin || 'http://localhost:3000'}/checkout/success`,
            merchantSupportEmail: 'support@estheticsbyanna.net'
          }
        };
        
        response = await squareClient.checkoutApi.createPaymentLink(createCheckoutRequest);
        console.log('Square Payment Link created via checkoutApi:', response.result);
        
      } else if (squareClient.orderApi && squareClient.orderApi.createOrder) {
        // Try approach 2: Create order then redirect to Square hosted checkout
        const createOrderRequest = {
          order: {
            locationId: locationId,
            lineItems: lineItems,
            source: { name: 'Esthetics By Anna E-commerce' },
            metadata: {
              orderReference: referenceId || `order-${Date.now()}`,
              customerEmail: customerData.email || ''
            }
          },
          idempotencyKey: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        
        const orderResponse = await squareClient.orderApi.createOrder(createOrderRequest);
        console.log('Square Order created:', orderResponse.result);
        
        // Create a checkout URL for the order
        const checkoutUrl = `https://squareup.com/checkout/${orderResponse.result.order.id}?locationId=${locationId}`;
        
        response = {
          result: {
            paymentLink: {
              id: orderResponse.result.order.id,
              url: checkoutUrl,
              orderId: orderResponse.result.order.id
            }
          }
        };
        
      } else {
        throw new Error('No valid Square API method found. Available methods: ' + Object.keys(squareClient));
      }
    } catch (squareApiError) {
      console.error('Square API error details:', squareApiError);
      throw squareApiError;
    }

    if (response.result && response.result.paymentLink) {
      const paymentLink = response.result.paymentLink;
      
      console.log('Square Payment Link created successfully:', {
        paymentLinkId: paymentLink.id,
        paymentLinkUrl: paymentLink.url,
        orderId: paymentLink.orderId
      });

      // Store checkout session data for success page processing
      const sessionData = {
        paymentLinkId: paymentLink.id,
        orderId: paymentLink.orderId,
        subtotal: orderAmount,
        shippingCost: selectedShippingRate?.price || 0,
        shippingMethod: selectedShippingRate?.name || 'Standard',
        total: totalWithShipping,
        referenceId: referenceId || `order-${Date.now()}`,
        cartData: cartItems,
        customerData: customerData,
        shippingData: shippingAddress,
        shippingRates: shippingRates,
        selectedShipping: selectedShippingRate,
        provider: 'square-shippo',
        squareOrderId: paymentLink.orderId
      };

      return res.json({
        success: true,
        data: {
          checkoutUrl: paymentLink.url,
          paymentLinkId: paymentLink.id,
          orderId: paymentLink.orderId,
          version: 1,
          subtotal: orderAmount,
          shippingCost: selectedShippingRate?.price || 0,
          shippingMethod: selectedShippingRate?.name || 'Standard',
          total: totalWithShipping,
          shippingRates: shippingRates,
          selectedShipping: selectedShippingRate,
          sessionData: sessionData,
          message: 'Square Payment Link created successfully with SHIPPO integration'
        }
      });
    } else {
      throw new Error('Failed to create Square Payment Link');
    }

  } catch (error) {
    console.error('Square Payment Link creation error:', error);
    
    // Handle Square API errors
    if (error.errors && Array.isArray(error.errors)) {
      const errorMessages = error.errors.map(err => err.detail || err.code).join(', ');
      return res.status(400).json({
        success: false,
        message: `Square checkout failed: ${errorMessages}`,
        details: error.errors
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Square Payment Link creation failed'
    });
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

    // For now, return success if all config values are present
    // Real API testing can be done when payments are processed
    return res.json({
      success: true,
      message: 'Square configuration appears valid - credentials are set',
      config,
      availablePaymentMethods: [
        'Credit/Debit Cards',
        'Apple Pay (iOS/Safari)',
        'Google Pay (Chrome/Android)',
        'Cash App Pay'
      ],
      note: 'API connectivity will be tested during payment processing'
    });
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
