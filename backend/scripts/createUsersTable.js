require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function createUsersTable() {
  try {
    console.log('Creating users table...');
    
    const result = await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
        email_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(64),
        verification_token_expires TIMESTAMP,
        reset_token VARCHAR(64),
        reset_token_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log('✅ Users table created successfully!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Error creating users table:', error);
  }
}

createUsersTable();