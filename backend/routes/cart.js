const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyJWT } = require('../middleware/jwtAuth');
const { v4: uuidv4 } = require('uuid');
const sanityClient = require('../services/sanityClient');

const fetchSanityProducts = async (ids) => {
  if (!ids || ids.length === 0) return {};
  try {
    const query = `
      *[_type == "product" && _id in $ids]{
        _id,
        name,
        description,
        price,
        salePrice,
        inStock,
        "imageUrl": image.asset->url
      }
    `;
    const products = await sanityClient.fetch(query, { ids });
    return products.reduce((map, product) => {
      map[product._id] = product;
      return map;
    }, {});
  } catch (error) {
    console.error('Error fetching products from Sanity:', error);
    return {};
  }
};

const fetchSanityProductById = async (id) => {
  try {
    const query = `
      *[_type == "product" && _id == $id][0]{
        _id,
        name,
        description,
        price,
        salePrice,
        inStock
      }
    `;
    return await sanityClient.fetch(query, { id });
  } catch (error) {
    console.error('Error fetching product from Sanity:', error);
    return null;
  }
};

// GET /api/cart - Get authenticated user's cart
router.get('/', verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if cart exists
    const cartQuery = `
      SELECT * FROM carts WHERE user_id = $1
    `;

    let cart = await db.query(cartQuery, [userId]);

    if (cart.length === 0) {
      // Create new cart if none exists
      const cartId = uuidv4();
      const newCartQuery = `
        INSERT INTO carts (id, user_id, subtotal, total, created_at, updated_at)
        VALUES ($1, $2, 0, 0, NOW(), NOW())
        RETURNING *
      `;
      
      const newCart = await db.query(newCartQuery, [cartId, userId]);
      cart = newCart[0];
      cart.items = [];
    } else {
      cart = cart[0];
      
      const itemsQuery = `
        SELECT 
          id,
          cart_id,
          product_id,
          variant_options,
          quantity,
          price,
          product_name,
          product_image,
          product_description,
          product_sku,
          created_at
        FROM cart_items
        WHERE cart_id = $1
      `;
      
      const items = await db.query(itemsQuery, [cart.id]);
      const productMap = await fetchSanityProducts(items.map(item => item.product_id));
      cart.items = items.map(item => {
        let parsedVariantOptions = item.variant_options;
        if (typeof parsedVariantOptions === 'string') {
          try {
            parsedVariantOptions = JSON.parse(parsedVariantOptions);
          } catch {
            parsedVariantOptions = null;
          }
        }

        return {
          ...item,
          variant_options: parsedVariantOptions,
          product: productMap[item.product_id] || null
        };
      }) || [];
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
    const { 
      product_id, 
      quantity = 1, 
      variant_options,
      // Accept product details for caching
      product_name,
      product_image,
      product_description,
      product_sku,
      product_price
    } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const sanityProduct = await fetchSanityProductById(product_id);

    if (!sanityProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const inStock = sanityProduct.inStock !== false;

    if (!inStock) {
      return res.status(400).json({
        success: false,
        message: 'Product is out of stock'
      });
    }

    const rawPrice = sanityProduct.salePrice ?? sanityProduct.price;
    const price = Number(rawPrice);

    if (!Number.isFinite(price)) {
      return res.status(400).json({
        success: false,
        message: 'Product price is unavailable'
      });
    }

    // Get or create cart
    let cartQuery = `
      SELECT id FROM carts WHERE user_id = $1
    `;
    
    let cart = await db.query(cartQuery, [userId]);
    let cartId;

    if (cart.length === 0) {
      cartId = uuidv4();
      const newCartQuery = `
        INSERT INTO carts (id, user_id, subtotal, total, created_at, updated_at)
        VALUES ($1, $2, 0, 0, NOW(), NOW())
        RETURNING id
      `;
      const newCart = await db.query(newCartQuery, [cartId, userId]);
      cartId = newCart[0].id;
    } else {
      cartId = cart[0].id;
    }

    // Check if item already exists in cart - convert product_id to UUID string for storage
    const variantOptionsString = variant_options ? JSON.stringify(variant_options) : null;
    const existingItemQuery = `
      SELECT id, quantity FROM cart_items 
      WHERE cart_id = $1 
        AND product_id = $2
        AND (
          (variant_options IS NULL AND $3::jsonb IS NULL) OR
          (variant_options = $3::jsonb)
        )
    `;
    
    const existingItem = await db.query(existingItemQuery, [cartId, product_id, variantOptionsString]);

    if (existingItem.length > 0) {
      // Update quantity of existing item
      const newQuantity = existingItem[0].quantity + quantity;
      const updateItemQuery = `
        UPDATE cart_items 
        SET quantity = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      
      await db.query(updateItemQuery, [newQuantity, existingItem[0].id]);
    } else {
      // Add new item to cart - store product_id as UUID
      const itemId = uuidv4();
      const addItemQuery = `
        INSERT INTO cart_items (
          id, cart_id, product_id, variant_options, quantity, price, 
          product_name, product_image, product_description, product_sku,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      `;
      
      await db.query(addItemQuery, [
        itemId, 
        cartId, 
        product_id, 
        variantOptionsString, 
        quantity, 
        product_price || price,  // Use provided price or fallback to Sanity price
        product_name || sanityProduct.name, // Use provided name or fallback to Sanity name
        product_image, 
        product_description, 
        product_sku
      ]);
    }

    // Update cart totals
    const updateCartQuery = `
      UPDATE carts 
      SET 
        subtotal = (
          SELECT COALESCE(SUM(ci.quantity * ci.price), 0)
          FROM cart_items ci 
          WHERE ci.cart_id = $1
        ),
        total = (
          SELECT COALESCE(SUM(ci.quantity * ci.price), 0)
          FROM cart_items ci 
          WHERE ci.cart_id = $1
        ) + COALESCE(shipping_cost, 0),
        updated_at = NOW()
      WHERE id = $1
    `;
    
    await db.query(updateCartQuery, [cartId]);

    // Get updated cart
    const updatedCart = await db.query(cartQuery, [userId]);

    res.json({
      success: true,
      message: 'Item added to cart successfully',
      data: updatedCart[0]
    });

  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart'
    });
  }
});

// PUT /api/cart/items/:id - Update cart item quantity
router.put('/items/:id', verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    // Verify the item belongs to the user's cart
    const itemQuery = `
      SELECT ci.*, c.user_id 
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      WHERE ci.id = $1 AND c.user_id = $2
    `;
    
    const item = await db.query(itemQuery, [itemId, userId]);
    
    if (item.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Update item quantity
    const updateItemQuery = `
      UPDATE cart_items 
      SET quantity = $1, updated_at = NOW()
      WHERE id = $2
    `;
    
    await db.query(updateItemQuery, [quantity, itemId]);

    // Update cart totals
    const cartId = item[0].cart_id;
    const updateCartQuery = `
      UPDATE carts 
      SET 
        subtotal = (
          SELECT COALESCE(SUM(ci.quantity * ci.price), 0)
          FROM cart_items ci 
          WHERE ci.cart_id = $1
        ),
        total = (
          SELECT COALESCE(SUM(ci.quantity * ci.price), 0)
          FROM cart_items ci 
          WHERE ci.cart_id = $1
        ) + COALESCE(shipping_cost, 0),
        updated_at = NOW()
      WHERE id = $1
    `;
    
    await db.query(updateCartQuery, [cartId]);

    res.json({
      success: true,
      message: 'Cart item updated successfully'
    });

  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item'
    });
  }
});

// DELETE /api/cart/items/:id - Remove item from cart
router.delete('/items/:id', verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;

    // Verify the item belongs to the user's cart
    const itemQuery = `
      SELECT ci.*, c.user_id 
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      WHERE ci.id = $1 AND c.user_id = $2
    `;
    
    const item = await db.query(itemQuery, [itemId, userId]);
    
    if (item.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    const cartId = item[0].cart_id;

    // Delete item
    const deleteItemQuery = `DELETE FROM cart_items WHERE id = $1`;
    await db.query(deleteItemQuery, [itemId]);

    // Update cart totals
    const updateCartQuery = `
      UPDATE carts 
      SET 
        subtotal = (
          SELECT COALESCE(SUM(ci.quantity * ci.price), 0)
          FROM cart_items ci 
          WHERE ci.cart_id = $1
        ),
        total = (
          SELECT COALESCE(SUM(ci.quantity * ci.price), 0)
          FROM cart_items ci 
          WHERE ci.cart_id = $1
        ) + COALESCE(shipping_cost, 0),
        updated_at = NOW()
      WHERE id = $1
    `;
    
    await db.query(updateCartQuery, [cartId]);

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

// DELETE /api/cart - Clear entire cart
router.delete('/', verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get cart ID
    const cartQuery = `SELECT id FROM carts WHERE user_id = $1`;
    const cart = await db.query(cartQuery, [userId]);
    
    if (cart.length === 0) {
      return res.json({
        success: true,
        message: 'Cart is already empty'
      });
    }

    const cartId = cart[0].id;

    // Delete all cart items
    await db.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cartId]);

    // Reset cart totals
    const resetCartQuery = `
      UPDATE carts 
      SET subtotal = 0, total = 0, updated_at = NOW()
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

module.exports = router;
