const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database tables...');

    // Check if users table exists and get its structure
    const existingTables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    const tableNames = existingTables.map(row => row.table_name);
    console.log('Existing tables:', tableNames);

    // Create carts table (without foreign key constraints to avoid conflicts)
    await sql`
      CREATE TABLE IF NOT EXISTS carts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER,
        session_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create cart_items table
    await sql`
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cart_id UUID,
        product_id VARCHAR(255) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_type VARCHAR(50) DEFAULT 'product' CHECK (product_type IN ('product', 'service')),
        price DECIMAL(10, 2) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        variant_options JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create orders table (without foreign key constraints)
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number VARCHAR(50) UNIQUE NOT NULL,
        user_id INTEGER,
        customer_email VARCHAR(255) NOT NULL,
        customer_first_name VARCHAR(100),
        customer_last_name VARCHAR(100),
        customer_phone VARCHAR(20),
        subtotal DECIMAL(10, 2) NOT NULL,
        discount DECIMAL(10, 2) DEFAULT 0,
        shipping_cost DECIMAL(10, 2) DEFAULT 0,
        tax DECIMAL(10, 2) DEFAULT 0,
        total DECIMAL(10, 2) NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
        fulfillment_status VARCHAR(20) DEFAULT 'pending' CHECK (fulfillment_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
        payment_method VARCHAR(50),
        payment_id VARCHAR(255),
        shipping_address JSONB,
        billing_address JSONB,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create order_items table
    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID,
        product_id VARCHAR(255) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_type VARCHAR(50) DEFAULT 'product' CHECK (product_type IN ('product', 'service')),
        sku VARCHAR(255),
        variant_options JSONB,
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create appointments table (without foreign key constraint)
    await sql`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER,
        service_id VARCHAR(255) NOT NULL,
        service_name VARCHAR(255) NOT NULL,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        duration INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no-show')),
        notes TEXT,
        reminder_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for better performance
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date)`;
    } catch (indexError) {
      console.log('Note: Some indexes may already exist:', indexError.message);
    }

    console.log('✅ Core database tables created successfully!');

  } catch (error) {
    console.error('❌ Error creating database tables:', error);
    throw error;
  }
}

if (require.main === module) {
  initializeDatabase().then(() => {
    console.log('🎉 Database initialization complete!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Database initialization failed:', error);
    process.exit(1);
  });
}

module.exports = { initializeDatabase };