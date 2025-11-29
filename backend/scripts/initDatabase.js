const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');

    // Read the schema file
    const schemaPath = path.join(__dirname, '../../src/db/schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Split the schema into individual statements
    const statements = schemaSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          await sql.unsafe(statement);
        } catch (error) {
          console.error(`Error executing statement: ${error.message}`);
          console.error(`Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }

    console.log('✅ Database initialized successfully!');
    
    // Add some sample data
    await addSampleData();
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

async function addSampleData() {
  try {
    console.log('🔄 Adding sample data...');

    // Add sample shipping methods
    const shippingMethods = [
      {
        name: 'Standard Shipping',
        description: 'Standard shipping via USPS',
        price: 5.99,
        free_shipping_threshold: 50,
        estimated_days_min: 3,
        estimated_days_max: 7,
        weight_limit: 5000
      },
      {
        name: 'Express Shipping',
        description: 'Express shipping via FedEx',
        price: 12.99,
        free_shipping_threshold: 100,
        estimated_days_min: 1,
        estimated_days_max: 3,
        weight_limit: 3000
      },
      {
        name: 'Local Pickup',
        description: 'Pick up at our location',
        price: 0,
        estimated_days_min: 1,
        estimated_days_max: 1,
        weight_limit: null
      }
    ];

    for (const method of shippingMethods) {
      await sql`
        INSERT INTO shipping_methods (
          name, description, price, free_shipping_threshold,
          estimated_days_min, estimated_days_max, weight_limit, active
        ) VALUES (
          ${method.name}, ${method.description}, ${method.price}, ${method.free_shipping_threshold},
          ${method.estimated_days_min}, ${method.estimated_days_max}, ${method.weight_limit}, true
        )
        ON CONFLICT (name) DO NOTHING
      `;
    }

    // Add sample discount codes
    const discountCodes = [
      {
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        minimum_amount: 25,
        maximum_uses: 100,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        description: 'Welcome discount - 10% off orders over $25'
      },
      {
        code: 'FREESHIP',
        type: 'free-shipping',
        value: 0,
        minimum_amount: 35,
        maximum_uses: null,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        description: 'Free shipping on orders over $35'
      },
      {
        code: 'SAVE5',
        type: 'fixed',
        value: 5,
        minimum_amount: 20,
        maximum_uses: 50,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        description: '$5 off orders over $20'
      }
    ];

    for (const discount of discountCodes) {
      await sql`
        INSERT INTO discount_codes (
          code, type, value, minimum_amount, maximum_uses, current_uses,
          valid_from, valid_until, description, active
        ) VALUES (
          ${discount.code}, ${discount.type}, ${discount.value}, ${discount.minimum_amount},
          ${discount.maximum_uses}, 0, ${discount.valid_from.toISOString()},
          ${discount.valid_until.toISOString()}, ${discount.description}, true
        )
        ON CONFLICT (code) DO NOTHING
      `;
    }

    // Add sample products
    const products = [
      {
        name: 'Luxury Moisturizing Cream',
        description: 'A rich, nourishing moisturizer perfect for all skin types. Infused with natural botanicals and essential oils.',
        short_description: 'Rich, nourishing moisturizer for all skin types',
        price: 45.00,
        compare_at_price: 55.00,
        sku: 'LMC-001',
        category: 'Skincare',
        subcategory: 'Moisturizers',
        tags: ['moisturizer', 'skincare', 'luxury', 'natural'],
        inventory_quantity: 50,
        shipping_weight: 120,
        seo_slug: 'luxury-moisturizing-cream',
        featured: true
      },
      {
        name: 'Hydrating Face Serum',
        description: 'Lightweight serum that deeply hydrates and plumps the skin with hyaluronic acid and vitamin C.',
        short_description: 'Lightweight hydrating serum with hyaluronic acid',
        price: 38.00,
        sku: 'HFS-001',
        category: 'Skincare',
        subcategory: 'Serums',
        tags: ['serum', 'hydrating', 'hyaluronic acid', 'vitamin c'],
        inventory_quantity: 75,
        shipping_weight: 80,
        seo_slug: 'hydrating-face-serum',
        featured: true
      },
      {
        name: 'Gentle Cleansing Oil',
        description: 'A gentle yet effective cleansing oil that removes makeup and impurities while nourishing the skin.',
        short_description: 'Gentle cleansing oil for makeup removal',
        price: 32.00,
        sku: 'GCO-001',
        category: 'Skincare',
        subcategory: 'Cleansers',
        tags: ['cleanser', 'oil', 'makeup remover', 'gentle'],
        inventory_quantity: 40,
        shipping_weight: 150,
        seo_slug: 'gentle-cleansing-oil',
        featured: false
      },
      {
        name: 'Rejuvenating Eye Cream',
        description: 'Specially formulated eye cream to reduce dark circles, puffiness, and fine lines around the delicate eye area.',
        short_description: 'Anti-aging eye cream for dark circles and puffiness',
        price: 52.00,
        sku: 'REC-001',
        category: 'Skincare',
        subcategory: 'Eye Care',
        tags: ['eye cream', 'anti-aging', 'dark circles', 'puffiness'],
        inventory_quantity: 30,
        shipping_weight: 60,
        seo_slug: 'rejuvenating-eye-cream',
        featured: true
      }
    ];

    for (const product of products) {
      const result = await sql`
        INSERT INTO products (
          name, description, short_description, price, compare_at_price,
          sku, category, subcategory, tags, inventory_track_quantity,
          inventory_quantity, inventory_low_stock_threshold, inventory_allow_backorder,
          shipping_weight, shipping_requires_shipping, seo_slug, active, featured
        ) VALUES (
          ${product.name}, ${product.description}, ${product.short_description}, 
          ${product.price}, ${product.compare_at_price || null}, ${product.sku}, 
          ${product.category}, ${product.subcategory}, ${JSON.stringify(product.tags)}, 
          true, ${product.inventory_quantity}, 10, false, ${product.shipping_weight}, 
          true, ${product.seo_slug}, true, ${product.featured}
        )
        ON CONFLICT (sku) DO NOTHING
        RETURNING id
      `;

      // Add sample product images
      if (result.length > 0) {
        const productId = result[0].id;
        await sql`
          INSERT INTO product_images (
            product_id, url, alt_text, is_primary, sort_order
          ) VALUES (
            ${productId}, 
            ${'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600'}, 
            ${product.name}, 
            true, 
            0
          )
          ON CONFLICT DO NOTHING
        `;
      }
    }

    console.log('✅ Sample data added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  }
}

// Run initialization if this script is executed directly
if (require.main === module) {
  initializeDatabase().then(() => {
    console.log('🎉 Database setup complete!');
    process.exit(0);
  });
}

module.exports = { initializeDatabase, addSampleData };