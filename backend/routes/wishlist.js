const express = require('express');
const { neon } = require('@neondatabase/serverless');
const { verifyJWT } = require('../middleware/jwtAuth');
const router = express.Router();

const sql = neon(process.env.DATABASE_URL);

// Get user's wishlist items
router.get('/', verifyJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const wishlistItems = await sql`
      SELECT 
        w.*,
        pc.name,
        pc.description,
        pc.price,
        pc.image as image_url,
        pc.sku,
        pc.category,
        pc.price as sale_price
      FROM wishlists w
      LEFT JOIN product_cache pc ON w.product_id = pc.product_id
      WHERE w.user_id = ${userId.toString()}
      ORDER BY w.created_at DESC
    `;

    res.json(wishlistItems);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// Add item to wishlist
router.post('/add', verifyJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId, productData } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if already in wishlist
    const existingItem = await sql`
      SELECT id FROM wishlists 
      WHERE user_id = ${userId.toString()} AND product_id = ${productId}
    `;

    if (existingItem.length > 0) {
      return res.status(400).json({ error: 'Item already in wishlist' });
    }

    // If product data is provided, cache it
    if (productData && productData.name) {
      try {
        await sql`
          INSERT INTO product_cache (
            product_id, name, description, price, image, sku, category, updated_at
          ) VALUES (
            ${productId}, 
            ${productData.name}, 
            ${productData.description || null}, 
            ${productData.price || 0}, 
            ${productData.imageUrl || null}, 
            ${productData.sku || null}, 
            ${productData.category || null},
            NOW()
          )
          ON CONFLICT (product_id) 
          DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            image = EXCLUDED.image,
            sku = EXCLUDED.sku,
            category = EXCLUDED.category,
            updated_at = NOW()
        `;
      } catch (cacheError) {
        console.error('Error caching product data:', cacheError);
        // Continue even if caching fails
      }
    }

    // Add to wishlist
    const wishlistItem = await sql`
      INSERT INTO wishlists (user_id, product_id)
      VALUES (${userId.toString()}, ${productId})
      RETURNING *
    `;

    res.status(201).json({ 
      success: true, 
      message: 'Item added to wishlist',
      item: wishlistItem[0]
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ error: 'Failed to add item to wishlist' });
  }
});

// Remove item from wishlist
router.delete('/remove/:productId', verifyJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await sql`
      DELETE FROM wishlists 
      WHERE user_id = ${userId.toString()} AND product_id = ${productId}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Item not found in wishlist' });
    }

    res.json({ 
      success: true, 
      message: 'Item removed from wishlist' 
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove item from wishlist' });
  }
});

// Check if item is in wishlist
router.get('/check/:productId', verifyJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const item = await sql`
      SELECT id FROM wishlists 
      WHERE user_id = ${userId.toString()} AND product_id = ${productId}
    `;

    res.json({ isWishlisted: item.length > 0 });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({ error: 'Failed to check wishlist status' });
  }
});

// Get wishlist count for user
router.get('/count', verifyJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await sql`
      SELECT COUNT(*) as count 
      FROM wishlists 
      WHERE user_id = ${userId.toString()}
    `;

    res.json({ count: parseInt(result[0].count) });
  } catch (error) {
    console.error('Error getting wishlist count:', error);
    res.status(500).json({ error: 'Failed to get wishlist count' });
  }
});

module.exports = router;