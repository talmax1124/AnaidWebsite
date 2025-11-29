import type { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    locales: [
      'en',
    ],
  },
  bootstrap(app: StrapiApp) {
    // Configure preview URLs for content types
    app.registerHook('Admin/CM/pages/EditView/mutate-edit-view-layout', (layout: any, { contentType }: any) => {
      // Check if contentType exists and has uid property
      if (!contentType || !contentType.uid) {
        return layout;
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      // Define preview configurations for different content types
      const previewConfigs: Record<string, { path: string; label: string }> = {
        'api::product.product': { path: 'products', label: 'Preview Product' },
        'api::service.service': { path: 'services', label: 'Preview Service' },
        'api::category.category': { path: 'categories', label: 'Preview Category' },
        'api::add-on.add-on': { path: 'add-ons', label: 'Preview Add-on' },
      };

      const config = previewConfigs[contentType.uid];
      if (config) {
        layout.contentManagerEditViewComponents = {
          ...layout.contentManagerEditViewComponents,
          editViewRightLinks: [
            ...(layout.contentManagerEditViewComponents?.editViewRightLinks || []),
            {
              intlLabel: { id: 'app.utils.preview', defaultMessage: config.label },
              icon: 'eye',
              onClick: ({ modifiedData }: any) => {
                const documentId = modifiedData?.documentId;
                if (documentId) {
                  const previewUrl = `${frontendUrl}/preview/${config.path}/${documentId}?preview=true&status=draft`;
                  window.open(previewUrl, '_blank');
                }
              },
            },
          ],
        };
      }
      
      return layout;
    });
  },
};