const express = require('express');
const router = express.Router();
const { createClient } = require('@sanity/client');

// Sanity client configuration
const sanityClient = createClient({
  projectId: 'rtfvvoxt',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2023-11-28',
  token: undefined, // Public access for read operations
  perspective: 'published',
});

// Temporary in-memory discount storage for testing
const discounts = [
  {
    id: 1,
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    description: '10% off your first order',
    minimum_order_value: 0,
    usage_limit: null,
    current_uses: 0,
    valid_from: new Date('2025-01-01'),
    valid_until: new Date('2025-12-31'),
    active: true,
    automatically_apply: false,
    applicable_to: 'all'
  },
  {
    id: 2,
    code: 'FREESHIP50',
    type: 'free_shipping',
    value: 0,
    description: 'Free shipping on orders over $50',
    minimum_order_value: 50,
    usage_limit: null,
    current_uses: 0,
    valid_from: new Date('2025-01-01'),
    valid_until: new Date('2025-12-31'),
    active: true,
    automatically_apply: false,
    applicable_to: 'all'
  },
  {
    id: 3,
    code: 'SAVE5',
    type: 'fixed',
    value: 5,
    description: '$5 off any order',
    minimum_order_value: 25,
    usage_limit: 100,
    current_uses: 0,
    valid_from: new Date('2025-01-01'),
    valid_until: new Date('2025-12-31'),
    active: true,
    automatically_apply: false,
    applicable_to: 'all'
  }
];

// GET /api/discounts/active - Get all active discounts
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    
    // Filter active and valid discounts
    const activeDiscounts = discounts.filter(discount => 
      discount.active && 
      discount.valid_from <= now &&
      (!discount.valid_until || discount.valid_until >= now) &&
      (!discount.usage_limit || discount.current_uses < discount.usage_limit)
    );

    res.json({
      success: true,
      data: activeDiscounts,
      message: 'Active discounts retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching active discounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active discounts'
    });
  }
});

// POST /api/discounts/validate - Validate discount code
router.post('/validate', async (req, res) => {
  try {
    const { code, cart_total, user_id } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Discount code is required'
      });
    }

    // Find discount by code from Sanity CMS
    const discount = await sanityClient.fetch(`
      *[_type == "discount" && code == $code && active == true][0] {
        _id,
        code,
        type,
        value,
        description,
        minimumOrderValue,
        usageLimit,
        currentUses,
        validFrom,
        validUntil,
        active,
        automaticallyApply,
        applicableTo,
        applicableProducts,
        applicableCategories
      }
    `, { code: code.toUpperCase() });

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired discount code'
      });
    }

    // Check validity dates
    const now = new Date();
    if (discount.validFrom && new Date(discount.validFrom) > now) {
      return res.status(400).json({
        success: false,
        message: 'Discount code is not yet valid'
      });
    }
    
    if (discount.validUntil && new Date(discount.validUntil) < now) {
      return res.status(400).json({
        success: false,
        message: 'Discount code has expired'
      });
    }

    // Check usage limit
    if (discount.usageLimit && discount.currentUses && discount.currentUses >= discount.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Discount code has reached its usage limit'
      });
    }

    // Check minimum amount requirement
    if (discount.minimumOrderValue && cart_total < discount.minimumOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of $${discount.minimumOrderValue} required for this discount`
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    
    switch (discount.type) {
      case 'percentage':
        discountAmount = (cart_total * discount.value) / 100;
        break;
      case 'fixed':
        discountAmount = Math.min(discount.value, cart_total);
        break;
      case 'free_shipping':
        discountAmount = 0; // Will be handled in shipping calculation
        break;
    }

    res.json({
      success: true,
      data: {
        id: discount._id,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        description: discount.description,
        discountAmount,
        minimumOrderValue: discount.minimumOrderValue,
        applicableTo: discount.applicableTo || 'all'
      },
      message: 'Discount code applied successfully'
    });

  } catch (error) {
    console.error('Error validating discount code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate discount code'
    });
  }
});

module.exports = router;