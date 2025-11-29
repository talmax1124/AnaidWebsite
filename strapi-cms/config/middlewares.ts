export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'http:', 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com', 'https://cdn.honey.io'],
          'media-src': ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
          'frame-src': ["'self'", 'http://localhost:3000', 'https://localhost:3000'],
          'frame-ancestors': ["'self'", 'http://localhost:3000', 'https://localhost:3000'],
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
