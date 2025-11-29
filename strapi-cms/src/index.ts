import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    console.log('🔄 Setting up public API permissions...');
    
    try {
      // Get the public role
      const publicRole = await strapi
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: 'public' } });

      if (publicRole) {
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

        for (const action of permissions) {
          try {
            // Check if permission exists
            const existingPermission = await strapi
              .query('plugin::users-permissions.permission')
              .findOne({
                where: {
                  action: action,
                  role: publicRole.id,
                },
              });

            if (existingPermission) {
              // Update existing permission
              await strapi
                .query('plugin::users-permissions.permission')
                .update({
                  where: { id: existingPermission.id },
                  data: { enabled: true },
                });
            } else {
              // Create new permission
              await strapi
                .query('plugin::users-permissions.permission')
                .create({
                  data: {
                    action: action,
                    enabled: true,
                    role: publicRole.id,
                  },
                });
            }
            console.log(`✅ Permission enabled: ${action}`);
          } catch (error) {
            console.error(`❌ Error setting permission ${action}:`, error.message);
          }
        }
        
        console.log('🎉 Public API permissions configured successfully!');
        console.log('API endpoints should now be accessible:');
        console.log('  - http://localhost:1337/api/products');
        console.log('  - http://localhost:1337/api/services');
        console.log('  - http://localhost:1337/api/categories');
        console.log('  - http://localhost:1337/api/add-ons');
      } else {
        console.error('❌ Public role not found');
      }
    } catch (error) {
      console.error('❌ Error setting up permissions:', error);
    }
  },
};
