export default ({ env }) => ({
  // Cloudinary Upload Provider Configuration
  upload: {
    config: {
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_CLOUD_NAME'),
        api_key: env('CLOUDINARY_API_KEY'),
        api_secret: env('CLOUDINARY_API_SECRET'),
      },
      actionOptions: {
        upload: {
          folder: 'strapi-uploads',
          use_filename: true,
          unique_filename: false,
        },
        uploadStream: {
          folder: 'strapi-uploads',
          use_filename: true,
          unique_filename: false,
        },
        delete: {},
      },
    },
    security: {
      maxFileSize: 1024 * 1024 * 10, // 10MB
    },
  },

  // Email Configuration for Plunk
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST'),
        port: env.int('SMTP_PORT', 587),
        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD'),
        },
        secure: false, // true for 465, false for other ports
      },
      settings: {
        defaultFrom: `${env('EMAIL_FROM_NAME')} <${env('EMAIL_FROM')}>`,
        defaultReplyTo: env('EMAIL_FROM'),
      },
    },
  },
  
  // Users & Permissions Plugin Configuration
  'users-permissions': {
    config: {
      register: {
        allowedFields: ['firstName', 'lastName', 'phone'],
      },
      jwt: {
        expiresIn: '7d',
      },
    },
  },
});
