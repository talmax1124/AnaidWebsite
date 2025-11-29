const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function setPublicPermissions() {
  try {
    console.log('🔄 Setting public API permissions...');

    // First, get the public role ID
    const publicRole = await sql`
      SELECT id FROM up_roles WHERE type = 'public' LIMIT 1
    `;

    if (publicRole.length === 0) {
      console.error('❌ Public role not found');
      return;
    }

    const publicRoleId = publicRole[0].id;
    console.log(`Found public role with ID: ${publicRoleId}`);

    // Define permissions to enable
    const permissions = [
      // Products
      'api::product.product.find',
      'api::product.product.findOne',
      // Services
      'api::service.service.find',
      'api::service.service.findOne',
      // Categories
      'api::category.category.find',
      'api::category.category.findOne',
      // Add-ons
      'api::add-on.add-on.find',
      'api::add-on.add-on.findOne',
    ];

    // Enable each permission
    for (const action of permissions) {
      try {
        // Check if permission exists
        const existing = await sql`
          SELECT p.id, p.document_id FROM up_permissions p
          LEFT JOIN up_permissions_role_lnk prl ON prl.permission_id = p.id
          WHERE p.action = ${action} AND prl.role_id = ${publicRoleId}
        `;

        if (existing.length > 0) {
          // Permission exists, just ensure it's published
          await sql`
            UPDATE up_permissions 
            SET published_at = NOW(), updated_at = NOW()
            WHERE id = ${existing[0].id}
          `;
          console.log(`✅ Updated permission: ${action}`);
        } else {
          // Create new permission
          const documentId = 'perm_' + Math.random().toString(36).substr(2, 9);
          
          // Insert permission
          const result = await sql`
            INSERT INTO up_permissions (document_id, action, created_at, updated_at, published_at)
            VALUES (${documentId}, ${action}, NOW(), NOW(), NOW())
            RETURNING id
          `;
          
          if (result.length > 0) {
            // Link to role
            await sql`
              INSERT INTO up_permissions_role_lnk (permission_id, role_id, permission_ord)
              VALUES (${result[0].id}, ${publicRoleId}, 1)
            `;
          }
          
          console.log(`✅ Created permission: ${action}`);
        }
      } catch (error) {
        console.error(`❌ Error setting permission ${action}:`, error.message);
      }
    }

    console.log('\n🎉 Public API permissions configured successfully!');
    console.log('You should now be able to access:');
    console.log('  - http://localhost:1337/api/products');
    console.log('  - http://localhost:1337/api/services');
    console.log('  - http://localhost:1337/api/categories');
    console.log('  - http://localhost:1337/api/add-ons');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  setPublicPermissions().then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  });
}

module.exports = { setPublicPermissions };