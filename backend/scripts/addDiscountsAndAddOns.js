const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function addDiscountsAndAddOnsTables() {
  try {
    console.log('🔄 Adding discount and add-on tables...');

    // Create discount_codes table (enhanced version)
    await sql`
      CREATE TABLE IF NOT EXISTS discount_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed', 'free_shipping', 'bxgy')),
        value DECIMAL(10, 2) NOT NULL,
        minimum_order_value DECIMAL(10, 2) DEFAULT 0,
        maximum_discount DECIMAL(10, 2),
        applicable_to VARCHAR(20) DEFAULT 'all' CHECK (applicable_to IN ('all', 'products', 'services', 'specific', 'categories')),
        valid_from TIMESTAMP NOT NULL,
        valid_until TIMESTAMP,
        usage_limit INTEGER,
        usage_per_customer INTEGER DEFAULT 1,
        current_uses INTEGER DEFAULT 0,
        first_time_customer_only BOOLEAN DEFAULT FALSE,
        combinable_with_others BOOLEAN DEFAULT FALSE,
        automatically_apply BOOLEAN DEFAULT FALSE,
        priority INTEGER DEFAULT 1,
        active BOOLEAN DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create discount_applications table to track usage
    await sql`
      CREATE TABLE IF NOT EXISTS discount_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        discount_id UUID,
        user_id INTEGER,
        order_id UUID,
        cart_id UUID,
        discount_amount DECIMAL(10, 2) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create enhanced add_ons table
    await sql`
      CREATE TABLE IF NOT EXISTS add_ons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE,
        description TEXT,
        detailed_description JSONB,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        applicable_to_products BOOLEAN DEFAULT FALSE,
        applicable_to_services BOOLEAN DEFAULT TRUE,
        duration INTEGER DEFAULT 0,
        image_url TEXT,
        featured BOOLEAN DEFAULT FALSE,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create table to link add-ons to specific products
    await sql`
      CREATE TABLE IF NOT EXISTS product_add_ons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID,
        add_on_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create table to link add-ons to specific services
    await sql`
      CREATE TABLE IF NOT EXISTS service_add_ons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_id UUID,
        add_on_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create table to track add-ons in orders
    await sql`
      CREATE TABLE IF NOT EXISTS order_add_ons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID,
        add_on_id UUID,
        quantity INTEGER NOT NULL DEFAULT 1,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create table to track add-ons in shopping cart
    await sql`
      CREATE TABLE IF NOT EXISTS cart_add_ons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cart_id UUID,
        cart_item_id UUID,
        add_on_id UUID,
        quantity INTEGER NOT NULL DEFAULT 1,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create table to link discounts to specific products
    await sql`
      CREATE TABLE IF NOT EXISTS discount_products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        discount_id UUID,
        product_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create table to link discounts to specific services
    await sql`
      CREATE TABLE IF NOT EXISTS discount_services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        discount_id UUID,
        service_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create useful indexes
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(active)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_discount_codes_valid ON discount_codes(valid_from, valid_until)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_add_ons_active ON add_ons(active)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_add_ons_slug ON add_ons(slug)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_product_add_ons_product ON product_add_ons(product_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_service_add_ons_service ON service_add_ons(service_id)`;
    } catch (indexError) {
      console.log('Note: Some indexes may already exist or failed to create:', indexError.message);
    }

    console.log('✅ Discount and add-on tables created successfully!');
    
    // Add some sample data
    await addSampleDiscountsAndAddOns();

  } catch (error) {
    console.error('❌ Error creating discount and add-on tables:', error);
  }
}

async function addSampleDiscountsAndAddOns() {
  try {
    console.log('🔄 Adding sample discounts and add-ons...');

    // Sample discounts
    await sql`
      INSERT INTO discount_codes (
        name, code, description, type, value, minimum_order_value, valid_from, valid_until, usage_limit, active
      ) VALUES 
        ('Welcome Discount', 'WELCOME10', '10% off your first purchase', 'percentage', 10, 25, NOW(), NOW() + INTERVAL '30 days', 100, TRUE),
        ('Free Shipping', 'FREESHIP50', 'Free shipping on orders over $50', 'free_shipping', 0, 50, NOW(), NOW() + INTERVAL '90 days', NULL, TRUE),
        ('Save Five', 'SAVE5', '$5 off your order', 'fixed', 5, 20, NOW(), NOW() + INTERVAL '60 days', 200, TRUE)
      ON CONFLICT (code) DO NOTHING
    `;

    // Sample add-ons (only insert if not already exists)
    const existingAddOns = await sql`SELECT COUNT(*) as count FROM add_ons`;
    if (existingAddOns[0].count == 0) {
      await sql`
        INSERT INTO add_ons (
          name, description, price, category, duration, active
        ) VALUES 
          ('Hot Towel Treatment', 'Relaxing hot towel application', 15.00, 'service-enhancement', 10, TRUE),
          ('Aftercare Kit', 'Complete aftercare products for post-treatment', 25.00, 'product-bundle', 0, TRUE),
          ('Extended Massage', '15 minutes of additional relaxing massage', 20.00, 'extended-treatment', 15, TRUE),
          ('Premium Face Mask', 'Luxury hydrating face mask upgrade', 30.00, 'premium-service', 20, TRUE)
      `;
    }

    console.log('✅ Sample discounts and add-ons added!');

  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  }
}

if (require.main === module) {
  addDiscountsAndAddOnsTables().then(() => {
    console.log('🎉 Discount and add-on setup complete!');
    process.exit(0);
  });
}

module.exports = { addDiscountsAndAddOnsTables };