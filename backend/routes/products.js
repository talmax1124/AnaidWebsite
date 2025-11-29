const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { validateProduct, validateProductQuery } = require('../middleware/validation');

// GET /api/products - Get all products with filtering, search, and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      subcategory,
      search,
      sortBy = 'created_at',
      sortDirection = 'DESC',
      featured,
      active = 'true'
    } = req.query;

    let baseQuery = `
      SELECT 
        p.*,
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN pi.id IS NOT NULL 
              THEN JSON_BUILD_OBJECT(
                'id', pi.id,
                'url', pi.url,
                'alt_text', pi.alt_text,
                'is_primary', pi.is_primary,
                'sort_order', pi.sort_order
              )
              ELSE NULL
            END
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'
        ) as images
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Add filters
    if (active !== 'all') {
      baseQuery += ` AND p.active = $${paramIndex}`;
      queryParams.push(active === 'true');
      paramIndex++;
    }

    if (category) {
      baseQuery += ` AND p.category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    if (subcategory) {
      baseQuery += ` AND p.subcategory = $${paramIndex}`;
      queryParams.push(subcategory);
      paramIndex++;
    }

    if (featured !== undefined) {
      baseQuery += ` AND p.featured = $${paramIndex}`;
      queryParams.push(featured === 'true');
      paramIndex++;
    }

    // Add search functionality
    if (search) {
      const searchConditions = db.buildSearchConditions(search, ['p.name', 'p.description', 'p.short_description']);
      if (searchConditions.condition) {
        baseQuery += ` AND ${searchConditions.condition}`;
        searchConditions.params.forEach(param => {
          queryParams.push(param);
          paramIndex++;
        });
      }
    }

    baseQuery += ' GROUP BY p.id';

    // Add pagination
    const paginationQuery = db.buildPaginationQuery(baseQuery, {
      page: parseInt(page),
      limit: parseInt(limit),
      orderBy: `p.${sortBy}`,
      orderDirection: sortDirection.toUpperCase()
    });

    const products = await db.query(paginationQuery.query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      WHERE 1=1
    `;

    let countParamIndex = 1;
    const countParams = [];

    if (active !== 'all') {
      countQuery += ` AND p.active = $${countParamIndex}`;
      countParams.push(active === 'true');
      countParamIndex++;
    }

    if (category) {
      countQuery += ` AND p.category = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }

    if (subcategory) {
      countQuery += ` AND p.subcategory = $${countParamIndex}`;
      countParams.push(subcategory);
      countParamIndex++;
    }

    if (featured !== undefined) {
      countQuery += ` AND p.featured = $${countParamIndex}`;
      countParams.push(featured === 'true');
      countParamIndex++;
    }

    if (search) {
      const searchConditions = db.buildSearchConditions(search, ['p.name', 'p.description', 'p.short_description']);
      if (searchConditions.condition) {
        countQuery += ` AND ${searchConditions.condition}`;
        searchConditions.params.forEach(param => {
          countParams.push(param);
          countParamIndex++;
        });
      }
    }

    const [{ total }] = await db.query(countQuery, countParams);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: products,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_items: parseInt(total),
        total_pages: totalPages,
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});

// GET /api/products/:id - Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        p.*,
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN pi.id IS NOT NULL 
              THEN JSON_BUILD_OBJECT(
                'id', pi.id,
                'url', pi.url,
                'alt_text', pi.alt_text,
                'is_primary', pi.is_primary,
                'sort_order', pi.sort_order
              )
              ELSE NULL
            END
            ORDER BY pi.sort_order, pi.is_primary DESC
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'
        ) as images,
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN pv.id IS NOT NULL 
              THEN JSON_BUILD_OBJECT(
                'id', pv.id,
                'name', pv.name,
                'value', pv.value,
                'price_adjustment', pv.price_adjustment,
                'sku', pv.sku,
                'inventory', pv.inventory
              )
              ELSE NULL
            END
          ) FILTER (WHERE pv.id IS NOT NULL),
          '[]'
        ) as variants
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.id = $1
      GROUP BY p.id
    `;

    const result = await db.query(query, [id]);
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
});

// GET /api/products/slug/:slug - Get product by SEO slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const query = `
      SELECT 
        p.*,
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN pi.id IS NOT NULL 
              THEN JSON_BUILD_OBJECT(
                'id', pi.id,
                'url', pi.url,
                'alt_text', pi.alt_text,
                'is_primary', pi.is_primary,
                'sort_order', pi.sort_order
              )
              ELSE NULL
            END
            ORDER BY pi.sort_order, pi.is_primary DESC
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'
        ) as images,
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN pv.id IS NOT NULL 
              THEN JSON_BUILD_OBJECT(
                'id', pv.id,
                'name', pv.name,
                'value', pv.value,
                'price_adjustment', pv.price_adjustment,
                'sku', pv.sku,
                'inventory', pv.inventory
              )
              ELSE NULL
            END
          ) FILTER (WHERE pv.id IS NOT NULL),
          '[]'
        ) as variants
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.seo_slug = $1 AND p.active = true
      GROUP BY p.id
    `;

    const result = await db.query(query, [slug]);
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('Error fetching product by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
});

// GET /api/products/categories - Get all categories
router.get('/categories', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT category, subcategory
      FROM products 
      WHERE active = true AND category IS NOT NULL
      ORDER BY category, subcategory
    `;

    const results = await db.query(query);

    // Group by category
    const categories = results.reduce((acc, { category, subcategory }) => {
      if (!acc[category]) {
        acc[category] = [];
      }
      if (subcategory && !acc[category].includes(subcategory)) {
        acc[category].push(subcategory);
      }
      return acc;
    }, {});

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// POST /api/products - Create new product (Admin only)
router.post('/', validateProduct, async (req, res) => {
  try {
    const productData = req.body;

    const query = `
      INSERT INTO products (
        name, description, short_description, price, compare_at_price,
        sku, category, subcategory, tags, inventory_track_quantity,
        inventory_quantity, inventory_low_stock_threshold, inventory_allow_backorder,
        shipping_weight, shipping_dimensions, shipping_requires_shipping,
        seo_title, seo_meta_description, seo_slug, active, featured
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      ) RETURNING *
    `;

    const values = [
      productData.name,
      productData.description,
      productData.short_description,
      productData.price,
      productData.compare_at_price || null,
      productData.sku,
      productData.category,
      productData.subcategory || null,
      productData.tags || [],
      productData.inventory_track_quantity !== false,
      productData.inventory_quantity || 0,
      productData.inventory_low_stock_threshold || 10,
      productData.inventory_allow_backorder || false,
      productData.shipping_weight || null,
      productData.shipping_dimensions || null,
      productData.shipping_requires_shipping !== false,
      productData.seo_title || null,
      productData.seo_meta_description || null,
      productData.seo_slug,
      productData.active !== false,
      productData.featured || false
    ];

    const result = await db.query(query, values);

    res.status(201).json({
      success: true,
      data: result[0],
      message: 'Product created successfully'
    });

  } catch (error) {
    console.error('Error creating product:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU or slug already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
});

// PUT /api/products/:id - Update product (Admin only)
router.put('/:id', validateProduct, async (req, res) => {
  try {
    const { id } = req.params;
    const productData = req.body;

    const query = `
      UPDATE products SET
        name = $2, description = $3, short_description = $4, price = $5,
        compare_at_price = $6, sku = $7, category = $8, subcategory = $9,
        tags = $10, inventory_track_quantity = $11, inventory_quantity = $12,
        inventory_low_stock_threshold = $13, inventory_allow_backorder = $14,
        shipping_weight = $15, shipping_dimensions = $16, shipping_requires_shipping = $17,
        seo_title = $18, seo_meta_description = $19, seo_slug = $20,
        active = $21, featured = $22, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const values = [
      id,
      productData.name,
      productData.description,
      productData.short_description,
      productData.price,
      productData.compare_at_price || null,
      productData.sku,
      productData.category,
      productData.subcategory || null,
      productData.tags || [],
      productData.inventory_track_quantity !== false,
      productData.inventory_quantity || 0,
      productData.inventory_low_stock_threshold || 10,
      productData.inventory_allow_backorder || false,
      productData.shipping_weight || null,
      productData.shipping_dimensions || null,
      productData.shipping_requires_shipping !== false,
      productData.seo_title || null,
      productData.seo_meta_description || null,
      productData.seo_slug,
      productData.active !== false,
      productData.featured || false
    ];

    const result = await db.query(query, values);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: result[0],
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Error updating product:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU or slug already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
});

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM products WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
});

// POST /api/products/cache - Store product details in cache
router.post('/cache', async (req, res) => {
  try {
    const {
      product_id,
      name,
      description,
      price,
      image,
      sku,
      category
    } = req.body;

    if (!product_id || !name) {
      return res.status(400).json({
        success: false,
        message: 'product_id and name are required'
      });
    }

    const query = `
      INSERT INTO product_cache (
        product_id, name, description, price, image, sku, category, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (product_id) 
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        image = EXCLUDED.image,
        sku = EXCLUDED.sku,
        category = EXCLUDED.category,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      product_id,
      name,
      description || null,
      parseFloat(price) || 0,
      image || null,
      sku || null,
      category || null
    ];

    const result = await db.query(query, values);

    res.json({
      success: true,
      data: result[0],
      message: 'Product cached successfully'
    });

  } catch (error) {
    console.error('Error caching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cache product'
    });
  }
});

// GET /api/products/cache/:id - Get cached product details
router.get('/cache/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'SELECT * FROM product_cache WHERE product_id = $1';
    const result = await db.query(query, [id]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cached product not found'
      });
    }

    res.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('Error fetching cached product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cached product'
    });
  }
});

// POST /api/products/cache/batch - Get multiple cached products
router.post('/cache/batch', async (req, res) => {
  try {
    const { product_ids } = req.body;

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'product_ids array is required'
      });
    }

    // Create placeholders for the query
    const placeholders = product_ids.map((_, index) => `$${index + 1}`).join(',');
    const query = `SELECT * FROM product_cache WHERE product_id IN (${placeholders})`;

    const result = await db.query(query, product_ids);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching cached products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cached products'
    });
  }
});

module.exports = router;