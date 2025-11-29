const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyJWT } = require('../middleware/jwtAuth');

// GET /api/cart - Get authenticated user's cart
router.get('/', verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get cart with items
    const cartQuery = `
      SELECT 
        c.*,
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN ci.id IS NOT NULL 
              THEN JSON_BUILD_OBJECT(
                'id', ci.id,
                'product_id', ci.product_id,
                'quantity', ci.quantity,
                'price', ci.price,
                'variant_options', ci.variant_options,
                'product', JSON_BUILD_OBJECT(
                  'id', p.id,
                  'name', p.name,
                  'description', p.description,
                  'sku', p.sku,
                  'inventory_quantity', p.inventory_quantity,
                  'images', (
                    SELECT COALESCE(
                      JSON_AGG(
                        JSON_BUILD_OBJECT(
                          'url', pi.url,
                          'alt_text', pi.alt_text,
                          'is_primary', pi.is_primary
                        )
                        ORDER BY pi.sort_order, pi.is_primary DESC
                      ),
                      '[]'
                    )
                    FROM product_images pi 
                    WHERE pi.product_id = p.id
                  )
                )
              )
              ELSE NULL
            END
          ) FILTER (WHERE ci.id IS NOT NULL),
          '[]'
        ) as items
      FROM carts c
      LEFT JOIN cart_items ci ON c.id = ci.cart_id
      LEFT JOIN products p ON ci.product_id = p.id
      WHERE c.user_id = $1
      GROUP BY c.id
    `;

    let cart = await db.query(cartQuery, [userId]);

    if (cart.length === 0) {
      // Create new cart if none exists
      const newCartQuery = `
        INSERT INTO carts (user_id, subtotal, total)
        VALUES ($1, 0, 0)
        RETURNING *
      `;
      
      const newCart = await db.query(newCartQuery, [userId]);
      cart = [{
        ...newCart[0],
        items: []
      }];
    } else {
      cart = cart[0];
    }

    res.json({
      success: true,
      data: cart
    });

  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart'
    });
  }
});

// POST /api/cart/items - Add item to authenticated user's cart
router.post('/items', verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity = 1, variant_options = null } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Get or create cart
    let cartQuery = `
      SELECT id FROM carts WHERE user_id = $1
    `;
    
    let cart = await db.query(cartQuery, [userId]);
    let cartId;

    if (cart.length === 0) {
      const newCartQuery = `
        INSERT INTO carts (user_id, subtotal, total)
        VALUES ($1, 0, 0)
        RETURNING id
      `;
      const newCart = await db.query(newCartQuery, [userId]);
      cartId = newCart[0].id;
    } else {
      cartId = cart[0].id;
    }

    // Get product details and price
    const productQuery = `
      SELECT id, name, price, inventory_quantity, inventory_track_quantity
      FROM products 
      WHERE id = $1 AND active = true
    `;
    
    const product = await db.query(productQuery, [product_id]);
    
    if (product.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or inactive'
      });
    }

    const productData = product[0];

    // Check inventory
    if (productData.inventory_track_quantity && productData.inventory_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient inventory'
      });
    }

    // Check if item already exists in cart
    const existingItemQuery = `
      SELECT id, quantity FROM cart_items 
      WHERE cart_id = $1 AND product_id = $2 AND variant_options = $3
    `;
    
    const existingItem = await db.query(existingItemQuery, [cartId, product_id, variant_options ? JSON.stringify(variant_options) : null]);

    let cartItem;

    if (existingItem.length > 0) {
      // Update existing item
      const newQuantity = existingItem[0].quantity + quantity;
      
      // Check inventory for updated quantity
      if (productData.inventory_track_quantity && productData.inventory_quantity < newQuantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient inventory for requested quantity'
        });
      }

      const updateItemQuery = `
        UPDATE cart_items 
        SET quantity = $1
        WHERE id = $2
        RETURNING *
      `;
      
      cartItem = await db.query(updateItemQuery, [newQuantity, existingItem[0].id]);
    } else {
      // Add new item
      const addItemQuery = `
        INSERT INTO cart_items (cart_id, product_id, variant_options, quantity, price)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      cartItem = await db.query(addItemQuery, [
        cartId,
        product_id,
        variant_options ? JSON.stringify(variant_options) : null,
        quantity,
        productData.price
      ]);
    }

    // Update cart totals
    await updateCartTotals(cartId);

    res.json({
      success: true,
      data: cartItem[0],
      message: 'Item added to cart successfully'
    });

  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart'
    });
  }
});

// PUT /api/cart/items/:itemId - Update authenticated user's cart item quantity
router.put('/items/:itemId', verifyJWT, async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    // Get cart item with product info
    const itemQuery = `
      SELECT ci.*, c.user_id, p.inventory_quantity, p.inventory_track_quantity
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      JOIN products p ON ci.product_id = p.id
      WHERE ci.id = $1 AND c.user_id = $2
    `;
    
    const item = await db.query(itemQuery, [itemId, userId]);

    if (item.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    const itemData = item[0];

    // Check inventory
    if (itemData.inventory_track_quantity && itemData.inventory_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient inventory'
      });
    }

    // Update item quantity
    const updateQuery = `
      UPDATE cart_items 
      SET quantity = $1
      WHERE id = $2
      RETURNING *
    `;
    
    const updatedItem = await db.query(updateQuery, [quantity, itemId]);

    // Update cart totals
    const cartQuery = `SELECT id FROM carts WHERE user_id = $1`;
    const cart = await db.query(cartQuery, [userId]);
    await updateCartTotals(cart[0].id);

    res.json({
      success: true,
      data: updatedItem[0],
      message: 'Item updated successfully'
    });

  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item'
    });
  }
});

// DELETE /api/cart/items/:itemId - Remove item from authenticated user's cart
router.delete('/items/:itemId', verifyJWT, async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    // Verify item belongs to user's cart
    const verifyQuery = `
      SELECT ci.id, c.id as cart_id
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      WHERE ci.id = $1 AND c.user_id = $2
    `;
    
    const item = await db.query(verifyQuery, [itemId, userId]);

    if (item.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Delete item
    const deleteQuery = `
      DELETE FROM cart_items 
      WHERE id = $1
      RETURNING *
    `;
    
    await db.query(deleteQuery, [itemId]);

    // Update cart totals
    await updateCartTotals(item[0].cart_id);

    res.json({
      success: true,
      message: 'Item removed from cart successfully'
    });

  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove cart item'
    });
  }
});

// DELETE /api/cart - Clear authenticated user's cart
router.delete('/', verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get cart ID
    const cartQuery = `SELECT id FROM carts WHERE user_id = $1`;
    const cart = await db.query(cartQuery, [userId]);

    if (cart.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const cartId = cart[0].id;

    // Delete all cart items
    const deleteItemsQuery = `DELETE FROM cart_items WHERE cart_id = $1`;
    await db.query(deleteItemsQuery, [cartId]);

    // Reset cart totals
    const resetCartQuery = `
      UPDATE carts 
      SET subtotal = 0, discount_amount = 0, shipping_cost = 0, total = 0,
          discount_code = NULL, discount_type = NULL, shipping_method = NULL
      WHERE id = $1
    `;
    await db.query(resetCartQuery, [cartId]);

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart'
    });
  }
});

// Helper function to update cart totals
async function updateCartTotals(cartId) {
  const totalsQuery = `
    UPDATE carts 
    SET subtotal = (
      SELECT COALESCE(SUM(price * quantity), 0)
      FROM cart_items 
      WHERE cart_id = $1
    )
    WHERE id = $1
  `;
  
  await db.query(totalsQuery, [cartId]);

  // Calculate final total (subtotal - discount + shipping + tax)
  const finalTotalQuery = `
    UPDATE carts 
    SET total = subtotal - COALESCE(discount_amount, 0) + COALESCE(shipping_cost, 0) + (subtotal * tax_rate)
    WHERE id = $1
  `;
  
  await db.query(finalTotalQuery, [cartId]);
}

module.exports = router;