const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

// PayPal API configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.paypal.com' 
  : 'https://api.sandbox.paypal.com';

// Get PayPal access token
async function getPayPalAccessToken() {
  try {
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`PayPal Auth Error: ${data.error_description || data.error}`);
    }

    return data.access_token;
  } catch (error) {
    console.error('PayPal authentication error:', error);
    throw new Error('Failed to authenticate with PayPal');
  }
}

// Create PayPal order
router.post('/create-order', async (req, res) => {
  try {
    const accessToken = await getPayPalAccessToken();
    const orderData = req.body;

    // Validate required fields
    if (!orderData.purchase_units || !orderData.purchase_units[0]) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `order-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      },
      body: JSON.stringify({
        intent: orderData.intent || 'CAPTURE',
        purchase_units: orderData.purchase_units,
        payment_source: {
          paypal: {
            experience_context: {
              payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
              brand_name: 'Anna Beauty Services',
              locale: 'en-US',
              landing_page: 'LOGIN',
              shipping_preference: 'GET_FROM_FILE',
              user_action: 'PAY_NOW'
            }
          }
        }
      })
    });

    const orderResponse = await response.json();

    if (!response.ok) {
      console.error('PayPal order creation error:', orderResponse);
      return res.status(400).json({ 
        error: 'Failed to create PayPal order',
        details: orderResponse 
      });
    }

    // Store order creation in database for tracking
    try {
      await sql`
        INSERT INTO paypal_orders (
          paypal_order_id,
          amount,
          currency,
          status,
          created_at
        ) VALUES (
          ${orderResponse.id},
          ${orderData.purchase_units[0].amount.value},
          ${orderData.purchase_units[0].amount.currency_code || 'USD'},
          'created',
          NOW()
        )
      `;
    } catch (dbError) {
      console.error('Error storing PayPal order in database:', dbError);
      // Don't fail the request if database storage fails
    }

    res.json({
      id: orderResponse.id,
      status: orderResponse.status,
      links: orderResponse.links
    });

  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Capture PayPal payment
router.post('/capture-order', async (req, res) => {
  try {
    const { orderID } = req.body;

    if (!orderID) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `capture-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      },
    });

    const captureResponse = await response.json();

    if (!response.ok) {
      console.error('PayPal capture error:', captureResponse);
      return res.status(400).json({ 
        error: 'Failed to capture PayPal payment',
        details: captureResponse 
      });
    }

    // Update order status in database
    try {
      await sql`
        UPDATE paypal_orders 
        SET 
          status = 'captured',
          captured_at = NOW(),
          capture_id = ${captureResponse.purchase_units[0]?.payments?.captures?.[0]?.id || null}
        WHERE paypal_order_id = ${orderID}
      `;
    } catch (dbError) {
      console.error('Error updating PayPal order in database:', dbError);
    }

    // Extract payment details
    const capture = captureResponse.purchase_units[0]?.payments?.captures?.[0];
    
    res.json({
      id: orderID,
      status: captureResponse.status,
      captureId: capture?.id,
      amount: capture?.amount,
      createTime: capture?.create_time,
      updateTime: capture?.update_time,
      payer: captureResponse.payer,
      purchase_units: captureResponse.purchase_units
    });

  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get PayPal order details
router.get('/orders/:orderID', async (req, res) => {
  try {
    const { orderID } = req.params;
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const orderDetails = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(orderDetails);
    }

    res.json(orderDetails);

  } catch (error) {
    console.error('Error fetching PayPal order:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Refund PayPal payment
router.post('/refund', async (req, res) => {
  try {
    const { captureId, amount, note } = req.body;

    if (!captureId) {
      return res.status(400).json({ error: 'Capture ID is required' });
    }

    const accessToken = await getPayPalAccessToken();

    const refundData = {
      note_to_payer: note || 'Refund processed'
    };

    if (amount) {
      refundData.amount = {
        currency_code: 'USD',
        value: amount.toString()
      };
    }

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `refund-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      },
      body: JSON.stringify(refundData)
    });

    const refundResponse = await response.json();

    if (!response.ok) {
      console.error('PayPal refund error:', refundResponse);
      return res.status(400).json({ 
        error: 'Failed to process PayPal refund',
        details: refundResponse 
      });
    }

    // Log refund in database
    try {
      await sql`
        INSERT INTO paypal_refunds (
          refund_id,
          capture_id,
          amount,
          currency,
          status,
          created_at
        ) VALUES (
          ${refundResponse.id},
          ${captureId},
          ${refundResponse.amount?.value || amount},
          ${refundResponse.amount?.currency_code || 'USD'},
          ${refundResponse.status},
          NOW()
        )
      `;
    } catch (dbError) {
      console.error('Error storing PayPal refund in database:', dbError);
    }

    res.json({
      id: refundResponse.id,
      status: refundResponse.status,
      amount: refundResponse.amount,
      createTime: refundResponse.create_time,
      updateTime: refundResponse.update_time
    });

  } catch (error) {
    console.error('Error processing PayPal refund:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Webhook handler for PayPal events
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    
    console.log('PayPal webhook received:', {
      event_type: event.event_type,
      id: event.id,
      create_time: event.create_time
    });

    // Verify webhook signature (optional but recommended for production)
    // Implementation depends on PayPal webhook verification

    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        console.log('Order approved:', event.resource.id);
        break;
      
      case 'PAYMENT.CAPTURE.COMPLETED':
        console.log('Payment captured:', event.resource.id);
        
        // Update internal order status
        try {
          await sql`
            UPDATE paypal_orders 
            SET status = 'completed'
            WHERE capture_id = ${event.resource.id}
          `;
        } catch (dbError) {
          console.error('Error updating order status:', dbError);
        }
        break;
      
      case 'PAYMENT.CAPTURE.DENIED':
        console.log('Payment denied:', event.resource.id);
        break;
      
      case 'PAYMENT.CAPTURE.REFUNDED':
        console.log('Payment refunded:', event.resource.id);
        break;
      
      default:
        console.log('Unhandled webhook event:', event.event_type);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;