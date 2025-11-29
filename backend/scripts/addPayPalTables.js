const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function addPayPalTables() {
  try {
    console.log('🔄 Adding PayPal tracking tables...');

    // Create paypal_orders table
    await sql`
      CREATE TABLE IF NOT EXISTS paypal_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paypal_order_id VARCHAR(255) UNIQUE NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status VARCHAR(50) NOT NULL,
        capture_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        captured_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create paypal_refunds table
    await sql`
      CREATE TABLE IF NOT EXISTS paypal_refunds (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        refund_id VARCHAR(255) UNIQUE NOT NULL,
        capture_id VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status VARCHAR(50) NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for better performance
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_paypal_orders_order_id ON paypal_orders(paypal_order_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_paypal_orders_status ON paypal_orders(status)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_paypal_orders_capture_id ON paypal_orders(capture_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_paypal_refunds_refund_id ON paypal_refunds(refund_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_paypal_refunds_capture_id ON paypal_refunds(capture_id)`;
    } catch (indexError) {
      console.log('Note: Some indexes may already exist:', indexError.message);
    }

    console.log('✅ PayPal tracking tables created successfully!');

  } catch (error) {
    console.error('❌ Error creating PayPal tables:', error);
  }
}

if (require.main === module) {
  addPayPalTables().then(() => {
    console.log('🎉 PayPal tables setup complete!');
    process.exit(0);
  });
}

module.exports = { addPayPalTables };