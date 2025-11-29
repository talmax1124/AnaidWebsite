require('dotenv').config();
const db = require('../config/database');

async function checkTables() {
  try {
    console.log('Checking existing table structures...');

    // Check if products table exists and its columns
    try {
      const columns = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'products'
        ORDER BY ordinal_position
      `);
      console.log('Products table columns:', columns);
    } catch (error) {
      console.log('Products table does not exist');
    }

    // Check if carts table exists
    try {
      const carts = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'carts'
        ORDER BY ordinal_position
      `);
      console.log('Carts table columns:', carts);
    } catch (error) {
      console.log('Carts table does not exist');
    }

    // List all tables
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('All tables:', tables);

  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

checkTables();