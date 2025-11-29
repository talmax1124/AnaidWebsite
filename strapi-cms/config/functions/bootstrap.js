'use strict';

module.exports = async () => {
  // Set public permissions for content types
  const publicRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (publicRole) {
    const permissions = [
      // Products
      { action: 'api::product.product.find', enabled: true },
      { action: 'api::product.product.findOne', enabled: true },
      // Services
      { action: 'api::service.service.find', enabled: true },
      { action: 'api::service.service.findOne', enabled: true },
      // Categories
      { action: 'api::category.category.find', enabled: true },
      { action: 'api::category.category.findOne', enabled: true },
      // Add-ons
      { action: 'api::add-on.add-on.find', enabled: true },
      { action: 'api::add-on.add-on.findOne', enabled: true },
    ];

    for (const permission of permissions) {
      try {
        await strapi.query('plugin::users-permissions.permission').create({
          data: {
            action: permission.action,
            enabled: permission.enabled,
            role: publicRole.id,
          },
        });
      } catch (error) {
        // Permission might already exist
        await strapi.query('plugin::users-permissions.permission').update({
          where: { action: permission.action, role: publicRole.id },
          data: { enabled: permission.enabled },
        });
      }
    }
    
    console.log('✅ Public API permissions configured successfully');
  }
};