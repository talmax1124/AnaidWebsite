const express = require('express');
const Stripe = require('stripe');

const router = express.Router();

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

// Return non-sensitive public config
router.get('/public-key', (req, res) => {
  console.log('[Stripe] public-key requested');
  return res.json({
    success: true,
    data: {
      publishableKey: publishableKey || null,
      environment: process.env.NODE_ENV || 'development',
    }
  });
});

// Create PaymentIntent for Stripe Payment Element
router.post('/create-payment-intent', async (req, res) => {
  try {
    console.log('[Stripe] create-payment-intent hit with body:', req.body);

    if (!stripeSecret) {
      console.error('[Stripe] Secret key missing on server');
      return res.status(500).json({
        success: false,
        message: 'Stripe secret key is not configured on the server.',
      });
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: '2024-09-30.acacia',
    });

    const {
      amount,
      currency = 'usd',
      shipping = {},
      customerData = {},
      cartData = {},
    } = req.body;

    if (!amount || isNaN(amount)) {
      console.error('[Stripe] Invalid amount provided:', amount);
      return res.status(400).json({
        success: false,
        message: 'A valid amount is required to create a payment intent.',
      });
    }

    const amountInCents = Math.round(Number(amount) * 100);

    const shippingForStripe = shipping?.address ? {
      name: `${shipping.address.firstName || ''} ${shipping.address.lastName || ''}`.trim(),
      phone: shipping.address.phone || customerData.phone || undefined,
      address: {
        line1: shipping.address.street || shipping.address.address,
        city: shipping.address.city,
        state: shipping.address.state,
        postal_code: shipping.address.zipCode || shipping.address.zip,
        country: (shipping.address.country || 'US').toUpperCase(),
      }
    } : undefined;

    const intent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      shipping: shippingForStripe,
      metadata: {
        cart: JSON.stringify(cartData?.items || []),
        customerEmail: customerData.email || '',
        customerName: `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim(),
        referenceId: req.body.referenceId || '',
      }
    });

    console.log('[Stripe] PaymentIntent created:', intent.id);

    return res.json({
      success: true,
      data: {
        clientSecret: intent.client_secret,
        publishableKey: publishableKey || null,
      }
    });
  } catch (error) {
    console.error('Stripe create-payment-intent error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment intent',
    });
  }
});

module.exports = router;
