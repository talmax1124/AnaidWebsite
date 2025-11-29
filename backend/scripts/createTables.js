const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function createTables() {
  try {
    console.log('🔄 Creating database tables...');

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clerk_id VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'customer',
        email_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(64),
        verification_token_expires TIMESTAMP,
        reset_token VARCHAR(64),
        reset_token_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        short_description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        compare_at_price DECIMAL(10, 2),
        sku VARCHAR(100) UNIQUE,
        category VARCHAR(100),
        subcategory VARCHAR(100),
        tags TEXT[],
        inventory_track_quantity BOOLEAN DEFAULT true,
        inventory_quantity INTEGER DEFAULT 0,
        inventory_low_stock_threshold INTEGER DEFAULT 10,
        inventory_allow_backorder BOOLEAN DEFAULT false,
        shipping_weight INTEGER,
        shipping_dimensions JSONB,
        shipping_requires_shipping BOOLEAN DEFAULT true,
        seo_title VARCHAR(255),
        seo_meta_description TEXT,
        seo_slug VARCHAR(255) UNIQUE,
        active BOOLEAN DEFAULT true,
        featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create carts table (user_id as integer to match existing users table)
    await sql`
      CREATE TABLE IF NOT EXISTS carts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER,
        session_id VARCHAR(255),
        subtotal DECIMAL(10, 2) DEFAULT 0,
        discount_code VARCHAR(50),
        discount_amount DECIMAL(10, 2),
        discount_type VARCHAR(20),
        shipping_method VARCHAR(100),
        shipping_cost DECIMAL(10, 2),
        tax_rate DECIMAL(5, 4) DEFAULT 0.0875,
        total DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create cart_items table
    await sql`
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cart_id UUID,
        product_id UUID,
        variant_options JSONB,
        quantity INTEGER NOT NULL DEFAULT 1,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create product_images table
    await sql`
      CREATE TABLE IF NOT EXISTS product_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID,
        url TEXT NOT NULL,
        alt_text VARCHAR(255),
        is_primary BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create services table
    await sql`
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        duration INTEGER NOT NULL,
        icon VARCHAR(50),
        category VARCHAR(100),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create product_cache table for storing product details
    await sql`
      CREATE TABLE IF NOT EXISTS product_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0,
        image TEXT,
        sku VARCHAR(100),
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_products_active ON products(active)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_services_active ON services(active)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_product_cache_product_id ON product_cache(product_id)`;
    } catch (error) {
      console.log('Indexes already exist or creation failed:', error.message);
    }

    console.log('✅ Tables created successfully!');
    
    // Add some sample data
    await addSampleData();

  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
}

async function addSampleData() {
  try {
    console.log('🔄 Adding sample services...');

    // Add sample services
    await sql`
      INSERT INTO services (name, description, price, duration, category, active)
      VALUES 
        ('Classic Facial', 'A relaxing and rejuvenating facial treatment', 85.00, 60, 'Facial', true),
        ('Deep Cleansing Facial', 'Intensive deep cleansing treatment', 95.00, 75, 'Facial', true),
        ('Anti-Aging Treatment', 'Advanced anti-aging facial therapy', 120.00, 90, 'Facial', true)
      ON CONFLICT DO NOTHING
    `;

    console.log('✅ Sample data added!');

  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  }
}

if (require.main === module) {
  createTables().then(() => {
    console.log('🎉 Database setup complete!');
    process.exit(0);
  });
}

module.exports = { createTables };