require('dotenv').config();
const db = require('../config/database');

async function setupCartTables() {
  try {
    console.log('Setting up cart-related database tables...');

    // Create products table
    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        sku VARCHAR(100) UNIQUE,
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        compare_at_price DECIMAL(10,2),
        inventory_quantity INTEGER DEFAULT 0,
        track_quantity BOOLEAN DEFAULT true,
        low_stock_threshold INTEGER DEFAULT 10,
        category VARCHAR(100),
        tags TEXT[],
        active BOOLEAN DEFAULT true,
        featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Products table created/verified');

    // Create product images table
    await db.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        url VARCHAR(500) NOT NULL,
        alt_text VARCHAR(255),
        is_primary BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Product images table created/verified');

    // Create carts table
    await db.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(255),
        subtotal DECIMAL(10,2) DEFAULT 0.00,
        discount DECIMAL(10,2) DEFAULT 0.00,
        shipping_cost DECIMAL(10,2) DEFAULT 0.00,
        tax DECIMAL(10,2) DEFAULT 0.00,
        total DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Carts table created/verified');

    // Create cart items table
    await db.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        cart_id INTEGER REFERENCES carts(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        price DECIMAL(10,2) NOT NULL,
        variant_options JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(cart_id, product_id, variant_options)
      )
    `);
    console.log('✅ Cart items table created/verified');

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id)',
      'CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)',
      'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)'
    ];
    
    for (const indexQuery of indexes) {
      await db.query(indexQuery);
    }
    console.log('✅ Indexes created/verified');

    // Insert sample products if products table is empty
    const existingProducts = await db.query('SELECT COUNT(*) as count FROM products');
    if (existingProducts[0].count == 0) {
      await db.query(`
        INSERT INTO products (name, description, sku, price, category, active, featured) VALUES
        ('Hydrating Face Cream', 'Moisturizing cream for all skin types', 'CREAM-001', 45.00, 'skincare', true, true),
        ('Vitamin C Serum', 'Brightening serum with vitamin C', 'SERUM-001', 65.00, 'skincare', true, true),
        ('Gentle Cleanser', 'Gentle facial cleanser for daily use', 'CLEAN-001', 25.00, 'skincare', true, false),
        ('Anti-Aging Night Cream', 'Rich night cream with retinol', 'NIGHT-001', 85.00, 'skincare', true, true),
        ('Exfoliating Scrub', 'Gentle exfoliating face scrub', 'SCRUB-001', 35.00, 'skincare', true, false)
      `);
      console.log('✅ Sample products inserted');
    }

    console.log('🎉 Cart database setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up cart tables:', error);
    throw error;
  }
}

if (require.main === module) {
  setupCartTables()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupCartTables };