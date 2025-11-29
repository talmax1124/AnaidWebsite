const express = require('express');
const router = express.Router();
const ShippoService = require('../services/shippoService');

// Calculate shipping rates using SHIPPO
router.post('/calculate', async (req, res) => {
  try {
    const { cartItems = [], shippingAddress = {} } = req.body;

    console.log('Calculating shipping rates:', {
      cartItems: cartItems.length,
      shippingAddress: !!shippingAddress.city
    });

    // Validate shipping address
    if (!shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      return res.status(400).json({
        success: false,
        message: 'Complete shipping address is required (city, state, zip code)'
      });
    }

    // Get shipping rates from SHIPPO
    try {
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
        const rates = shippoResult.rates;
        // Select cheapest shipping option as default
        const selectedRate = rates[0];
        
        console.log('SHIPPO rates calculated successfully:', {
          ratesCount: rates.length,
          selectedRate: selectedRate.name,
          shippingCost: selectedRate.price
        });

        return res.json({
          success: true,
          data: {
            rates: rates,
            selectedRate: selectedRate,
            provider: 'shippo'
          }
        });
      } else {
        console.log('SHIPPO rates failed, using fallback rates');
        // Fallback shipping options
        const fallbackRates = [
          {
            id: 'fallback-standard',
            name: 'Standard Shipping',
            description: 'Standard ground shipping',
            price: 8.99,
            estimatedDays: '5-7 business days',
            carrier: 'USPS',
            serviceType: 'standard'
          },
          {
            id: 'fallback-expedited',
            name: 'Expedited Shipping',
            description: 'Faster delivery',
            price: 15.99,
            estimatedDays: '2-3 business days',
            carrier: 'USPS',
            serviceType: 'expedited'
          }
        ];

        return res.json({
          success: true,
          data: {
            rates: fallbackRates,
            selectedRate: fallbackRates[0],
            provider: 'fallback',
            message: 'Using fallback shipping rates'
          }
        });
      }
    } catch (shippoError) {
      console.error('SHIPPO calculation error:', shippoError);
      
      // Fallback shipping options
      const fallbackRates = [
        {
          id: 'fallback-standard',
          name: 'Standard Shipping',
          description: 'Standard ground shipping',
          price: 8.99,
          estimatedDays: '5-7 business days',
          carrier: 'USPS',
          serviceType: 'standard'
        }
      ];

      return res.json({
        success: true,
        data: {
          rates: fallbackRates,
          selectedRate: fallbackRates[0],
          provider: 'fallback-error',
          message: 'Error calculating rates, using standard shipping'
        }
      });
    }

  } catch (error) {
    console.error('Shipping calculation error:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate shipping rates'
    });
  }
});

// Validate shipping address using SHIPPO
router.post('/validate-address', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address || !address.street || !address.city || !address.state) {
      return res.status(400).json({
        success: false,
        message: 'Complete address is required for validation'
      });
    }

    const validationResult = await ShippoService.validateAddress(address);
    
    if (validationResult.success) {
      return res.json({
        success: true,
        data: {
          valid: validationResult.valid,
          formatted: validationResult.formatted,
          messages: validationResult.messages || []
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Address validation failed'
      });
    }
  } catch (error) {
    console.error('Address validation error:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Address validation service unavailable'
    });
  }
});

// Get address autocomplete suggestions using SHIPPO
router.get('/address-suggestions', async (req, res) => {
  try {
    const { input } = req.query;

    if (!input || input.length < 3) {
      return res.json({
        success: true,
        data: {
          suggestions: []
        }
      });
    }

    const suggestionsResult = await ShippoService.getAddressSuggestions(input);
    
    return res.json({
      success: true,
      data: {
        suggestions: suggestionsResult.suggestions || []
      }
    });
  } catch (error) {
    console.error('Address suggestions error:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Address suggestions service unavailable'
    });
  }
});

module.exports = router;