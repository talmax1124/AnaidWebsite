const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/shipping/methods - Get available shipping methods
router.get('/methods', async (req, res) => {
  try {
    const { cart_total = 0, weight = 0 } = req.query;

    const query = `
      SELECT *
      FROM shipping_methods 
      WHERE active = true
        AND (weight_limit IS NULL OR $1 <= weight_limit)
      ORDER BY price ASC
    `;

    const methods = await db.query(query, [weight]);

    // Calculate shipping costs and apply free shipping thresholds
    const processedMethods = methods.map(method => {
      let finalPrice = method.price;
      
      // Apply free shipping threshold
      if (method.free_shipping_threshold && cart_total >= method.free_shipping_threshold) {
        finalPrice = 0;
      }

      return {
        ...method,
        final_price: finalPrice,
        is_free: finalPrice === 0
      };
    });

    res.json({
      success: true,
      data: processedMethods
    });

  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping methods'
    });
  }
});

// POST /api/shipping/calculate - Calculate shipping for cart
router.post('/calculate', async (req, res) => {
  try {
    const { user_id, shipping_method_id } = req.body;

    if (!user_id || !shipping_method_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID and shipping method ID are required'
      });
    }

    // Get cart details
    const cartQuery = `
      SELECT 
        c.*,
        COALESCE(SUM(p.shipping_weight * ci.quantity), 0) as total_weight
      FROM carts c
      LEFT JOIN cart_items ci ON c.id = ci.cart_id
      LEFT JOIN products p ON ci.product_id = p.id
      WHERE c.user_id = $1
      GROUP BY c.id
    `;

    const cart = await db.query(cartQuery, [user_id]);

    if (cart.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const cartData = cart[0];

    // Get shipping method
    const methodQuery = `
      SELECT * FROM shipping_methods 
      WHERE id = $1 AND active = true
    `;

    const method = await db.query(methodQuery, [shipping_method_id]);

    if (method.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shipping method not found'
      });
    }

    const methodData = method[0];

    // Check weight limit
    if (methodData.weight_limit && cartData.total_weight > methodData.weight_limit) {
      return res.status(400).json({
        success: false,
        message: 'Order weight exceeds shipping method limit'
      });
    }

    // Calculate shipping cost
    let shippingCost = methodData.price;

    // Apply free shipping threshold
    if (methodData.free_shipping_threshold && cartData.subtotal >= methodData.free_shipping_threshold) {
      shippingCost = 0;
    }

    // Check for free shipping discount
    if (cartData.discount_type === 'free-shipping') {
      shippingCost = 0;
    }

    // Update cart with shipping information
    const updateQuery = `
      UPDATE carts 
      SET 
        shipping_method = $1,
        shipping_cost = $2,
        total = subtotal - COALESCE(discount_amount, 0) + $2 + (subtotal * tax_rate)
      WHERE id = $3
      RETURNING *
    `;

    const updatedCart = await db.query(updateQuery, [
      methodData.name,
      shippingCost,
      cartData.id
    ]);

    res.json({
      success: true,
      data: {
        cart: updatedCart[0],
        shipping: {
          method: methodData.name,
          cost: shippingCost,
          estimated_days_min: methodData.estimated_days_min,
          estimated_days_max: methodData.estimated_days_max,
          is_free: shippingCost === 0
        }
      },
      message: 'Shipping calculated successfully'
    });

  } catch (error) {
    console.error('Error calculating shipping:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate shipping'
    });
  }
});

// POST /api/shipping/estimate - Get shipping estimate for address 
router.post('/estimate', async (req, res) => {
  try {
    const { 
      user_id, 
      shipping_address,
      items // Array of {product_id, quantity}
    } = req.body;

    // This would integrate with shipping APIs like USPS, FedEx, UPS
    // For now, return basic estimates based on shipping methods

    const methodsQuery = `
      SELECT * FROM shipping_methods WHERE active = true ORDER BY price ASC
    `;

    const methods = await db.query(methodsQuery);

    // Calculate total weight for items
    let totalWeight = 0;
    if (items && items.length > 0) {
      const productIds = items.map(item => item.product_id);
      const weightsQuery = `
        SELECT id, shipping_weight FROM products WHERE id = ANY($1)
      `;
      
      const products = await db.query(weightsQuery, [productIds]);
      
      totalWeight = items.reduce((total, item) => {
        const product = products.find(p => p.id === item.product_id);
        return total + (product?.shipping_weight || 0) * item.quantity;
      }, 0);
    }

    // Filter methods by weight limit and add estimates
    const estimates = methods
      .filter(method => !method.weight_limit || totalWeight <= method.weight_limit)
      .map(method => ({
        id: method.id,
        name: method.name,
        description: method.description,
        price: method.price,
        estimated_days_min: method.estimated_days_min,
        estimated_days_max: method.estimated_days_max,
        estimated_delivery: {
          min_date: new Date(Date.now() + (method.estimated_days_min || 3) * 24 * 60 * 60 * 1000),
          max_date: new Date(Date.now() + (method.estimated_days_max || 7) * 24 * 60 * 60 * 1000)
        }
      }));

    res.json({
      success: true,
      data: {
        estimates,
        total_weight: totalWeight
      }
    });

  } catch (error) {
    console.error('Error estimating shipping:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to estimate shipping'
    });
  }
});

// POST /api/shipping/dynamic-rates - Calculate dynamic shipping rates based on items and destination
router.post('/dynamic-rates', async (req, res) => {
  try {
    const { items, toAddress, fromAddress } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Items are required' 
      });
    }

    if (!toAddress || !toAddress.zipCode || !toAddress.state || !toAddress.country) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid destination address is required' 
      });
    }

    // Calculate total weight and value
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 4) * item.quantity, 0);
    const totalValue = items.reduce((sum, item) => sum + item.value * item.quantity, 0);
    
    // Base rates by distance/zone
    const isInternational = toAddress.country !== 'US';
    const isCanada = toAddress.country === 'CA';
    
    const rates = [
      {
        id: 'usps-standard',
        name: 'USPS Ground Advantage',
        description: 'Standard shipping',
        price: isInternational ? (isCanada ? 15.99 : 25.99) : Math.max(8.99, 8.99 + (totalWeight / 16) * 2.50),
        estimatedDays: isInternational ? '7-14 business days' : '3-5 business days',
        carrier: 'USPS',
        serviceType: 'standard',
      },
      {
        id: 'usps-priority',
        name: 'USPS Priority Mail',
        description: 'Faster delivery with tracking',
        price: isInternational ? (isCanada ? 28.99 : 45.99) : Math.max(15.99, 15.99 + (totalWeight / 16) * 3.50),
        estimatedDays: isInternational ? '6-10 business days' : '1-3 business days',
        carrier: 'USPS',
        serviceType: 'priority',
      },
    ];

    // Add domestic-only options
    if (!isInternational) {
      rates.push(
        {
          id: 'ups-ground',
          name: 'UPS Ground',
          description: 'Reliable ground shipping',
          price: Math.max(12.99, 12.99 + (totalWeight / 16) * 3.00),
          estimatedDays: '2-5 business days',
          carrier: 'UPS',
          serviceType: 'standard',
        },
        {
          id: 'fedex-2day',
          name: 'FedEx 2Day',
          description: 'Fast 2-day delivery',
          price: Math.max(24.99, 24.99 + (totalWeight / 16) * 4.00),
          estimatedDays: '2 business days',
          carrier: 'FedEx',
          serviceType: 'expedited',
        }
      );
    }

    // Add express option for high-value orders
    if (totalValue > 100) {
      rates.push({
        id: 'fedex-overnight',
        name: 'FedEx Overnight',
        description: 'Next business day delivery',
        price: isInternational ? 89.99 : Math.max(45.99, 45.99 + (totalWeight / 16) * 6.00),
        estimatedDays: isInternational ? '2-3 business days' : 'Next business day',
        carrier: 'FedEx',
        serviceType: 'overnight',
      });
    }

    res.json({
      success: true,
      data: rates.sort((a, b) => a.price - b.price)
    });

  } catch (error) {
    console.error('Error calculating dynamic shipping rates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to calculate shipping rates' 
    });
  }
});

// POST /api/shipping/validate-address - Validate shipping address
router.post('/validate-address', async (req, res) => {
  try {
    const address = req.body;

    // Basic validation
    const required = ['firstName', 'lastName', 'street', 'city', 'state', 'zipCode', 'country'];
    const missing = required.filter(field => !address[field]?.trim());

    if (missing.length > 0) {
      return res.json({
        success: false,
        valid: false,
        errors: missing.map(field => `${field} is required`),
      });
    }

    // Email validation
    if (address.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
      return res.json({
        success: false,
        valid: false,
        errors: ['Please enter a valid email address'],
      });
    }

    // ZIP code validation for US
    const isValidZip = address.country === 'US' 
      ? /^\d{5}(-\d{4})?$/.test(address.zipCode)
      : true; // Assume international zip codes are valid

    if (!isValidZip) {
      return res.json({
        success: false,
        valid: false,
        errors: ['Invalid ZIP/postal code format'],
      });
    }

    res.json({ 
      success: true, 
      valid: true 
    });

  } catch (error) {
    console.error('Error validating address:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to validate address' 
    });
  }
});

// GET /api/shipping/zones - Get shipping zones
router.get('/zones', async (req, res) => {
  try {
    const zones = [
      {
        id: 'domestic-us',
        name: 'United States',
        countries: ['US'],
        baseRate: 8.99,
        ratePerPound: 2.50,
      },
      {
        id: 'canada',
        name: 'Canada',
        countries: ['CA'],
        baseRate: 15.99,
        ratePerPound: 4.00,
      },
      {
        id: 'international',
        name: 'International',
        countries: ['*'],
        baseRate: 25.99,
        ratePerPound: 8.00,
      },
    ];

    res.json({ 
      success: true, 
      data: zones 
    });

  } catch (error) {
    console.error('Error fetching shipping zones:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch shipping zones' 
    });
  }
});

// GET /api/shipping/address-autocomplete - Address autocomplete suggestions
router.get('/address-autocomplete', async (req, res) => {
  try {
    const { input } = req.query;

    if (!input || input.length < 3) {
      return res.json({ 
        success: true, 
        data: [] 
      });
    }

    // Mock address suggestions - in production, integrate with Google Places API
    const mockSuggestions = [];
    
    // Common street types and diverse locations
    const streetTypes = ['Street', 'Avenue', 'Drive', 'Lane', 'Boulevard', 'Court', 'Way'];
    const locations = [
      { city: 'New York', state: 'NY', zip: '10001' },
      { city: 'Los Angeles', state: 'CA', zip: '90210' },
      { city: 'Chicago', state: 'IL', zip: '60601' },
      { city: 'Houston', state: 'TX', zip: '77001' },
      { city: 'Phoenix', state: 'AZ', zip: '85001' },
      { city: 'Miami', state: 'FL', zip: '33101' },
      { city: 'Seattle', state: 'WA', zip: '98101' },
      { city: 'Denver', state: 'CO', zip: '80201' },
      { city: 'Atlanta', state: 'GA', zip: '30301' },
      { city: 'Boston', state: 'MA', zip: '02101' }
    ];
    
    // Generate mock suggestions based on the input
    if (input.match(/^\d+/)) {
      // If starts with numbers, generate street addresses
      const inputNum = input.match(/^\d+/)[0];
      
      // Generate 3-4 suggestions with different street types and locations
      const selectedLocations = locations.slice(0, 4);
      selectedLocations.forEach((location, index) => {
        const streetType = streetTypes[index % streetTypes.length];
        const streetName = ['Main', 'Oak', 'Pine', 'Elm'][index] || 'Main';
        
        mockSuggestions.push({
          description: `${inputNum} ${streetName} ${streetType}, ${location.city}, ${location.state}, USA`,
          placeId: `mock-place-${inputNum}-${index + 1}`,
          structured: {
            street: `${inputNum} ${streetName} ${streetType}`,
            city: location.city,
            state: location.state,
            zipCode: location.zip,
            country: 'US',
          },
        });
      });
    } else {
      // For text inputs, create more intelligent suggestions
      const inputLower = input.toLowerCase();
      
      // Try to match street names
      const streetNames = ['main', 'oak', 'pine', 'elm', 'maple', 'cedar', 'first', 'second', 'third', 'broadway', 'park', 'washington', 'lincoln'];
      const matchingStreets = streetNames.filter(street => street.includes(inputLower) || inputLower.includes(street));
      
      // Try to match city names
      const matchingCities = locations.filter(loc => 
        loc.city.toLowerCase().includes(inputLower) || 
        loc.state.toLowerCase().includes(inputLower)
      );
      
      if (matchingStreets.length > 0) {
        // Generate suggestions based on matching street names
        matchingStreets.slice(0, 3).forEach((streetName, index) => {
          const location = locations[index % locations.length];
          const streetType = streetTypes[index % streetTypes.length];
          const number = 100 + index * 50;
          
          mockSuggestions.push({
            description: `${number} ${streetName.charAt(0).toUpperCase() + streetName.slice(1)} ${streetType}, ${location.city}, ${location.state}, USA`,
            placeId: `mock-place-street-${index + 1}`,
            structured: {
              street: `${number} ${streetName.charAt(0).toUpperCase() + streetName.slice(1)} ${streetType}`,
              city: location.city,
              state: location.state,
              zipCode: location.zip,
              country: 'US',
            },
          });
        });
      } else if (matchingCities.length > 0) {
        // Generate suggestions based on matching cities
        matchingCities.slice(0, 3).forEach((location, index) => {
          const streetName = ['Main', 'Oak', 'Pine'][index];
          const streetType = streetTypes[index % streetTypes.length];
          const number = 200 + index * 100;
          
          mockSuggestions.push({
            description: `${number} ${streetName} ${streetType}, ${location.city}, ${location.state}, USA`,
            placeId: `mock-place-city-${index + 1}`,
            structured: {
              street: `${number} ${streetName} ${streetType}`,
              city: location.city,
              state: location.state,
              zipCode: location.zip,
              country: 'US',
            },
          });
        });
      } else {
        // Default suggestions when no matches
        const defaultSuggestions = [
          {
            description: '123 Main Street, New York, NY, USA',
            placeId: 'mock-place-1',
            structured: { street: '123 Main Street', city: 'New York', state: 'NY', zipCode: '10001', country: 'US' },
          },
          {
            description: '456 Oak Avenue, Los Angeles, CA, USA',
            placeId: 'mock-place-2',
            structured: { street: '456 Oak Avenue', city: 'Los Angeles', state: 'CA', zipCode: '90210', country: 'US' },
          },
          {
            description: '789 Pine Drive, Chicago, IL, USA',
            placeId: 'mock-place-3',
            structured: { street: '789 Pine Drive', city: 'Chicago', state: 'IL', zipCode: '60601', country: 'US' },
          },
        ];
        
        mockSuggestions.push(...defaultSuggestions);
      }
    }

    res.json({ 
      success: true, 
      data: mockSuggestions 
    });

  } catch (error) {
    console.error('Error getting address suggestions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get address suggestions' 
    });
  }
});

// GET /api/shipping/place-details - Get place details from place ID
router.get('/place-details', async (req, res) => {
  try {
    const { placeId } = req.query;

    if (!placeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Place ID is required' 
      });
    }

    // Mock place details - in production, integrate with Google Places API
    let details = null;
    
    // Handle dynamic place IDs
    if (placeId.startsWith('mock-place-') && placeId.includes('-')) {
      const parts = placeId.split('-');
      if (parts.length >= 4) {
        const addressNumber = parts[2];
        const locationIndex = parts[3];
        
        const locations = [
          { street: `${addressNumber} Main Street`, city: 'New York', state: 'NY', zipCode: '10001' },
          { street: `${addressNumber} Oak Avenue`, city: 'Los Angeles', state: 'CA', zipCode: '90210' },
          { street: `${addressNumber} Pine Street`, city: 'Chicago', state: 'IL', zipCode: '60601' },
        ];
        
        const locationIdx = parseInt(locationIndex) - 1;
        if (locationIdx >= 0 && locationIdx < locations.length) {
          details = {
            ...locations[locationIdx],
            country: 'US',
            firstName: '',
            lastName: '',
            email: '',
            phone: ''
          };
        }
      }
    }
    
    // Fallback for static place IDs
    if (!details) {
      const mockDetails = {
        'mock-place-1': {
          street: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
          firstName: '',
          lastName: '',
          email: '',
          phone: ''
        },
        'mock-place-2': {
          street: '456 Oak Avenue',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'US',
          firstName: '',
          lastName: '',
          email: '',
          phone: ''
        },
        'mock-place-3': {
          street: '789 Pine Street',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'US',
          firstName: '',
          lastName: '',
          email: '',
          phone: ''
        },
      };
      
      details = mockDetails[placeId];
    }
    
    if (!details) {
      return res.status(404).json({ 
        success: false, 
        message: 'Place not found' 
      });
    }

    res.json({ 
      success: true, 
      data: details 
    });

  } catch (error) {
    console.error('Error getting place details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get place details' 
    });
  }
});

module.exports = router;