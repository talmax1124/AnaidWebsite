const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function updateSchema() {
  try {
    console.log('Updating cart_items schema...');
    await sql`ALTER TABLE cart_items ALTER COLUMN product_id TYPE TEXT USING product_id::text`;
    await sql`ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
    
    // Add product details columns to cart_items for better persistence
    await sql`ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255)`;
    await sql`ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS product_image TEXT`;
    await sql`ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS product_description TEXT`;
    await sql`ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS product_sku VARCHAR(100)`;
    
    console.log('cart_items schema updated.');
  } catch (error) {
    console.error('Failed to update cart_items schema:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  updateSchema().then(() => process.exit(0));
}

module.exports = { updateSchema };
