const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyJWT } = require('../middleware/jwtAuth');
const emailService = require('../services/emailService');

// Email service function for order status updates
const sendOrderStatusUpdateEmail = async (order, updates) => {
  try {
    const PLUNK_API_KEY = 'sk_257aa612793467b1234c042f0bf71ece77b621a27b1dc70d';
    const PLUNK_API_URL = 'https://api.useplunk.com/v1';
    
    // Parse shipping address
    let shippingAddress = '';
    if (order.shipping_address) {
      try {
        const address = typeof order.shipping_address === 'string' 
          ? JSON.parse(order.shipping_address) 
          : order.shipping_address;
        shippingAddress = `${address.firstName} ${address.lastName}, ${address.address1}, ${address.city}, ${address.province} ${address.postalCode}`;
      } catch (e) {
        shippingAddress = 'Address information unavailable';
      }
    }

    // Determine the main status update message
    let statusMessage = '';
    let statusColor = '#3b82f6';
    
    if (updates.fulfillment_status) {
      switch (updates.fulfillment_status) {
        case 'confirmed':
          statusMessage = 'Your order has been confirmed and is being prepared for shipment.';
          statusColor = '#10b981';
          break;
        case 'processing':
          statusMessage = 'Your order is currently being processed.';
          statusColor = '#f59e0b';
          break;
        case 'shipped':
          statusMessage = 'Great news! Your order has been shipped and is on its way to you.';
          statusColor = '#3b82f6';
          break;
        case 'delivered':
          statusMessage = 'Your order has been delivered! We hope you love your purchase.';
          statusColor = '#10b981';
          break;
        case 'cancelled':
          statusMessage = 'Your order has been cancelled. If you have any questions, please contact our support team.';
          statusColor = '#ef4444';
          break;
        default:
          statusMessage = `Your order status has been updated to: ${updates.fulfillment_status}`;
      }
    } else if (updates.payment_status) {
      switch (updates.payment_status) {
        case 'paid':
          statusMessage = 'Payment for your order has been successfully processed.';
          statusColor = '#10b981';
          break;
        case 'failed':
          statusMessage = 'There was an issue processing your payment. Please contact our support team.';
          statusColor = '#ef4444';
          break;
        case 'refunded':
          statusMessage = 'Your payment has been refunded and should appear in your account within 3-5 business days.';
          statusColor = '#6366f1';
          break;
        default:
          statusMessage = `Your payment status has been updated to: ${updates.payment_status}`;
      }
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update - Esthetics by Anna</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin-bottom: 10px;">Esthetics by Anna</h1>
          <h2 style="color: ${statusColor}; margin-top: 0;">Order Status Update</h2>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #2c3e50;">Hello ${order.customer_first_name}!</h3>
          <p style="margin-bottom: 15px; font-size: 16px;">${statusMessage}</p>
          
          ${updates.shipping_tracking_number ? `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <strong>Tracking Number:</strong> ${updates.shipping_tracking_number}
            </div>
          ` : ''}
        </div>

        <div style="background: #ffffff; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #2c3e50;">Order Details</h3>
          <p><strong>Order Number:</strong> ${order.order_number}</p>
          <p><strong>Order Total:</strong> $${(typeof order.total === 'number' ? order.total : parseFloat(order.total) || 0).toFixed(2)}</p>
          <p><strong>Fulfillment Status:</strong> ${updates.fulfillment_status || order.fulfillment_status}</p>
          <p><strong>Payment Status:</strong> ${updates.payment_status || order.payment_status}</p>
          
          ${shippingAddress ? `
            <div style="margin-top: 15px;">
              <strong>Shipping Address:</strong><br>
              ${shippingAddress}
            </div>
          ` : ''}
        </div>

        <div style="background: #e8f5e8; border: 1px solid #28a745; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #155724;">
            <strong>Need Help?</strong> Contact our support team at 
            <a href="mailto:support@estheticsbyanna.com" style="color: #155724;">support@estheticsbyanna.com</a>
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
          <p>Thank you for choosing Esthetics by Anna!</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `;

    const response = await fetch(`${PLUNK_API_URL}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PLUNK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: order.customer_email,
        subject: `Order Update: ${order.order_number} - ${updates.fulfillment_status || updates.payment_status}`,
        body: emailHtml,
        type: 'html'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Email API error: ${response.status} ${errorText}`);
    }

    console.log('Order status update email sent successfully to:', order.customer_email);
    
  } catch (error) {
    console.error('Error sending order status update email:', error);
    throw error;
  }
};

// Admin middleware to check if user is admin
const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// GET /api/orders/admin - Get all orders (Admin only)
router.get('/admin', verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;

    let whereClause = '1=1';
    const params = [];
    let paramIndex = 1;

    // Add status filter
    if (status && status !== 'all') {
      whereClause += ` AND o.fulfillment_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Add search filter
    if (search) {
      whereClause += ` AND (
        o.order_number ILIKE $${paramIndex} OR
        o.customer_email ILIKE $${paramIndex} OR
        CONCAT(o.customer_first_name, ' ', o.customer_last_name) ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const query = `
      SELECT 
        o.*,
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN oi.id IS NOT NULL 
              THEN JSON_BUILD_OBJECT(
                'id', oi.id,
                'product_id', oi.product_id,
                'product_name', oi.product_name,
                'sku', oi.sku,
                'variant_options', oi.variant_options,
                'quantity', oi.quantity,
                'price', oi.price,
                'image_url', oi.image_url
              )
              ELSE NULL
            END
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const orders = await db.query(query, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM orders o 
      WHERE ${whereClause}
    `;
    const countResult = await db.query(countQuery, params.slice(0, -2)); // Remove limit and offset params
    const total = Array.isArray(countResult) && countResult[0] ? countResult[0].total : 0;

    res.json({
      success: true,
      data: orders,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_items: parseInt(total),
        total_pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// GET /api/orders/user - Get authenticated user's orders  
router.get('/user', verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const query = `
      SELECT 
        o.*,
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN oi.id IS NOT NULL 
              THEN JSON_BUILD_OBJECT(
                'id', oi.id,
                'product_id', oi.product_id,
                'product_name', oi.product_name,
                'quantity', oi.quantity,
                'price', oi.price
              )
              ELSE NULL
            END
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const offset = (page - 1) * limit;
    const orders = await db.query(query, [userId, limit, offset]);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM orders WHERE user_id = $1`;
    const [{ total }] = await db.query(countQuery, [userId]);

    res.json({
      success: true,
      data: {
        orders: orders,
        total: parseInt(total),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// GET /api/orders/:userId - Get user's orders
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const query = `
      SELECT 
        o.*,
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN oi.id IS NOT NULL 
              THEN JSON_BUILD_OBJECT(
                'id', oi.id,
                'product_id', oi.product_id,
                'product_name', oi.product_name,
                'sku', oi.sku,
                'variant_options', oi.variant_options,
                'quantity', oi.quantity,
                'price', oi.price,
                'image_url', oi.image_url
              )
              ELSE NULL
            END
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const offset = (page - 1) * limit;
    const orders = await db.query(query, [userId, limit, offset]);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM orders WHERE user_id = $1`;
    const [{ total }] = await db.query(countQuery, [userId]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_items: parseInt(total),
        total_pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// GET /api/orders/:userId/:orderId - Get specific order
router.get('/:userId/:orderId', async (req, res) => {
  try {
    const { userId, orderId } = req.params;

    const query = `
      SELECT 
        o.*,
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN oi.id IS NOT NULL 
              THEN JSON_BUILD_OBJECT(
                'id', oi.id,
                'product_id', oi.product_id,
                'product_name', oi.product_name,
                'sku', oi.sku,
                'variant_options', oi.variant_options,
                'quantity', oi.quantity,
                'price', oi.price,
                'image_url', oi.image_url
              )
              ELSE NULL
            END
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1 AND o.user_id = $2
      GROUP BY o.id
    `;

    const result = await db.query(query, [orderId, userId]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
});

// POST /api/orders - Create order from cart
router.post('/', async (req, res) => {
  try {
    console.log('📦 Order creation request received:', {
      user_id: req.body.user_id,
      customer_email: req.body.customer_email,
      payment_method: req.body.payment_method,
      payment_id: req.body.payment_id
    });
    
    const {
      user_id,
      customer_email,
      customer_first_name,
      customer_last_name,
      customer_phone,
      shipping_address,
      payment_method,
      payment_id,
      notes
    } = req.body;

    if (!user_id || !customer_email) {
      return res.status(400).json({
        success: false,
        message: 'User ID and email are required'
      });
    }

    // Get cart with items - use stored product details from cart_items
    const cartQuery = `
      SELECT 
        c.*,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', ci.id,
            'product_id', ci.product_id,
            'quantity', ci.quantity,
            'price', ci.price,
            'variant_options', ci.variant_options,
            'product_name', ci.product_name,
            'product_sku', ci.product_sku,
            'product_image', ci.product_image,
            'product_description', ci.product_description
          )
        ) as items
      FROM carts c
      LEFT JOIN cart_items ci ON c.id = ci.cart_id
      WHERE c.user_id = $1 AND ci.id IS NOT NULL
      GROUP BY c.id
    `;

    const cart = await db.query(cartQuery, [user_id]);

    if (cart.length === 0 || !cart[0].items || cart[0].items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    const cartData = cart[0];

    // Skip inventory check for now since we're using Sanity CMS products
    // Inventory is managed in Sanity and would need to be checked there
    // For future: implement Sanity inventory check if needed

    // Generate order number
    const orderNumber = `EST-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Start transaction
    const orderQueries = [
      // Create order
      {
        query: `
          INSERT INTO orders (
            order_number, user_id, customer_email, customer_first_name,
            customer_last_name, customer_phone, subtotal, discount,
            shipping_cost, shipping_address, tax, total, payment_status, 
            fulfillment_status, payment_method, payment_id, notes
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
          ) RETURNING id
        `,
        params: [
          orderNumber,
          user_id,
          customer_email,
          customer_first_name,
          customer_last_name,
          customer_phone,
          cartData.subtotal,
          cartData.discount_amount || 0,  // Use discount column instead of separate discount fields
          cartData.shipping_cost || 0,
          shipping_address ? JSON.stringify(shipping_address) : null,
          cartData.subtotal * (cartData.tax_rate || 0.0875),
          cartData.total,
          'pending',
          'pending',
          payment_method,
          payment_id,
          notes
        ]
      }
    ];

    const results = await db.transaction(orderQueries);
    const orderId = results[0][0].id;

    // Create order items with enhanced product details
    const itemQueries = [];
    
    // Get all product IDs to fetch from cache
    const productIds = cartData.items.map(item => item.product_id);
    
    // Fetch product details from cache
    let productDetails = {};
    try {
      const cacheQuery = `
        SELECT product_id, name, image, sku, description 
        FROM product_cache 
        WHERE product_id = ANY($1)
      `;
      const cachedProducts = await db.query(cacheQuery, [productIds]);
      
      // Create a map for quick lookup
      cachedProducts.forEach(product => {
        productDetails[product.product_id] = product;
      });
    } catch (error) {
      console.warn('Could not fetch product details from cache:', error);
    }
    
    for (const item of cartData.items) {
      // Get cached product details if available
      const productCache = productDetails[item.product_id];
      
      // Use cached details or fallback to cart item data or generic data
      const productName = productCache?.name || item.product_name || `Product ${item.product_id.slice(0, 8)}`;
      const productImage = productCache?.image || item.product_image || item.image_url;
      const productSku = productCache?.sku || item.product_sku || item.sku || '';
      
      const itemTotal = (item.quantity * item.price);
      itemQueries.push({
        query: `
          INSERT INTO order_items (
            order_id, product_id, product_name, product_type, sku, 
            variant_options, quantity, price, total, image_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `,
        params: [
          orderId,
          item.product_id,
          productName,
          'product', // Default product type
          productSku,
          item.variant_options,
          item.quantity,
          item.price,
          itemTotal, // Calculate total (quantity * price)
          productImage
        ]
      });

      // Skip inventory update since we're using Sanity CMS for products
    }

    await db.transaction(itemQueries);

    // Clear cart
    await db.query('DELETE FROM cart_items WHERE cart_id = $1', [cartData.id]);
    await db.query(
      'UPDATE carts SET subtotal = 0, shipping_cost = 0, total = 0 WHERE id = $1',
      [cartData.id]
    );

    // Get created order with items
    const orderQuery = `
      SELECT 
        o.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', oi.product_name,
              'sku', oi.sku,
              'variant_options', oi.variant_options,
              'quantity', oi.quantity,
              'price', oi.price,
              'image_url', oi.image_url
            )
          ),
          '[]'
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `;

    const [order] = await db.query(orderQuery, [orderId]);

    // Send order confirmation email
    try {
      console.log('📧 Sending order confirmation email to:', order.customer_email);
      const emailResult = await emailService.sendOrderConfirmationEmail({
        ...order,
        items: order.items || cartData.items
      });
      console.log('✅ Order confirmation email sent successfully:', emailResult);
    } catch (emailError) {
      console.error('❌ Failed to send order confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
});

// PATCH /api/orders/:orderId/status - Update order status (Admin only)
router.patch('/:orderId/status', verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { payment_status, fulfillment_status, shipping_tracking_number } = req.body;

    const updateFields = [];
    const params = [orderId];
    let paramIndex = 2;

    if (payment_status) {
      updateFields.push(`payment_status = $${paramIndex}`);
      params.push(payment_status);
      paramIndex++;
    }

    if (fulfillment_status) {
      updateFields.push(`fulfillment_status = $${paramIndex}`);
      params.push(fulfillment_status);
      paramIndex++;
    }

    if (shipping_tracking_number) {
      updateFields.push(`shipping_tracking_number = $${paramIndex}`);
      params.push(shipping_tracking_number);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    const query = `
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, params);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const updatedOrder = result[0];

    // Send email notification if status was updated
    try {
      if (payment_status || fulfillment_status) {
        await sendOrderStatusUpdateEmail(updatedOrder, { payment_status, fulfillment_status, shipping_tracking_number });
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Order status updated successfully'
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

// POST /api/orders/backfill-product-details - Backfill existing orders with product details (Admin only)
router.post('/backfill-product-details', async (req, res) => {
  try {
    // Get all order items with generic product names
    const itemsToUpdate = await db.query(`
      SELECT DISTINCT product_id 
      FROM order_items 
      WHERE product_name LIKE 'Product %' OR product_name IS NULL
    `);

    if (itemsToUpdate.length === 0) {
      return res.json({
        success: true,
        message: 'No items need updating',
        updated: 0
      });
    }

    // Get product details from cache for these items
    console.log('Items to update:', itemsToUpdate);
    console.log('Items type:', typeof itemsToUpdate, 'Is Array:', Array.isArray(itemsToUpdate));
    
    const productIds = Array.isArray(itemsToUpdate) 
      ? itemsToUpdate.map(item => item.product_id)
      : [];
    
    if (productIds.length === 0) {
      return res.json({
        success: true,
        message: 'No valid product IDs found',
        updated: 0
      });
    }
    
    const cacheQuery = `
      SELECT product_id, name, image, sku, description 
      FROM product_cache 
      WHERE product_id = ANY($1)
    `;
    const cachedProducts = await db.query(cacheQuery, [productIds]);

    if (cachedProducts.length === 0) {
      return res.json({
        success: true,
        message: 'No cached product details found',
        updated: 0
      });
    }

    // Update order items with proper product details
    let updated = 0;
    for (const product of cachedProducts) {
      const updateResult = await db.query(`
        UPDATE order_items 
        SET 
          product_name = $1,
          image_url = COALESCE(image_url, $2),
          sku = COALESCE(sku, $3)
        WHERE product_id = $4 AND (product_name LIKE 'Product %' OR product_name IS NULL)
      `, [
        product.name,
        product.image,
        product.sku,
        product.product_id
      ]);
      
      // Count affected rows (this is database-specific, adjust if needed)
      updated += updateResult.length || 0;
    }

    res.json({
      success: true,
      message: `Successfully updated ${updated} order items with product details`,
      updated,
      productsProcessed: cachedProducts.length
    });

  } catch (error) {
    console.error('Error backfilling product details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to backfill product details'
    });
  }
});

module.exports = router;