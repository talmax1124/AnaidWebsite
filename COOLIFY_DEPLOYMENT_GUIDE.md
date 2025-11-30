# Coolify Deployment Guide for Esthetics by Anna

## Overview
This guide will help you deploy the Esthetics by Anna website to Coolify. The application consists of:
- React TypeScript frontend
- Node.js Express backend
- Sanity CMS for content management
- Neon PostgreSQL database

## Prerequisites
1. Coolify instance running
2. Domain names configured
3. SSL certificates setup (handled by Coolify)
4. Environment variables ready

## Deployment Steps

### 1. Prepare Your Repository
Ensure all Docker files are in place:
- `Dockerfile` (frontend)
- `backend/Dockerfile` (backend)
- `docker-compose.yml`
- `.dockerignore` files

### 2. Set Up Environment Variables in Coolify

#### Frontend Environment Variables:
```
NODE_ENV=production
REACT_APP_API_URL=https://backend.estheticsbyanna.net
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
REACT_APP_SQUARE_APPLICATION_ID=your_square_application_id
REACT_APP_SQUARE_LOCATION_ID=your_square_location_id
```

#### Backend Environment Variables:
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your_super_secure_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://estheticsbyanna.net
CORS_ORIGIN=https://estheticsbyanna.net
PLUNK_API_KEY=sk_your_plunk_api_key
PLUNK_FROM_EMAIL=noreply@estheticsbyanna.net
PLUNK_FROM_NAME=Esthetics By Anna
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Deploy Backend First

1. In Coolify, create a new application
2. Connect your repository
3. Set build context to `backend`
4. Set Dockerfile path to `backend/Dockerfile`
5. Configure port `3001`
6. Add all backend environment variables
7. Set up domain: backend.estheticsbyanna.net
8. Deploy

### 4. Deploy Sanity CMS

1. Create a third application in Coolify
2. Use the same repository
3. Set build context to `sanity-cms`
4. Set Dockerfile path to `sanity-cms/Dockerfile`
5. Configure port `3333`
6. Add Sanity environment variables:
   ```
   SANITY_STUDIO_PROJECT_ID=your_sanity_project_id
   SANITY_STUDIO_DATASET=production
   SANITY_STUDIO_API_VERSION=2023-05-03
   ```
7. Set up domain: sanity.estheticsbyanna.net
8. Deploy

### 5. Deploy Frontend

1. Create another application in Coolify
2. Use the same repository
3. Set build context to root (`.`)
4. Set Dockerfile path to `Dockerfile`
5. Configure port `80`
6. Add frontend environment variables
7. Update `REACT_APP_API_URL` to point to your backend domain
8. Set up domain: estheticsbyanna.net
9. Deploy

### 5. Configure Database

Ensure your Neon PostgreSQL database is accessible from your Coolify server:
1. Add your server's IP to Neon's allowed IPs
2. Test connection from your backend container
3. Run any necessary migrations

### 6. Verify Deployment

1. Check backend health: `https://backend.estheticsbyanna.net/api/health`
2. Test Sanity CMS: `https://sanity.estheticsbyanna.net`
3. Test frontend: `https://estheticsbyanna.net`
4. Verify API connectivity between all services
5. Test key features:
   - User registration/login
   - Product browsing (from Sanity CMS)
   - Cart functionality
   - Checkout process
   - Email notifications
   - Content management in Sanity Studio

## Post-Deployment Configuration

### SSL Certificates
- Coolify handles SSL automatically with Let's Encrypt
- Ensure both domains have valid certificates

### Monitoring
- Set up health checks for both services
- Configure alerts for service failures
- Monitor application logs

### Backups
- Configure database backups in Neon
- Consider backing up uploaded files if any

## Environment-Specific Notes

### Production Considerations:
- Use live Stripe keys
- Configure production email settings
- Set up proper CORS origins
- Enable security headers
- Configure rate limiting

### Security Checklist:
- [ ] All environment variables are properly set
- [ ] JWT secrets are secure and unique
- [ ] Database credentials are secure
- [ ] API keys are production-ready
- [ ] CORS is properly configured
- [ ] SSL certificates are active

## Troubleshooting

### Common Issues:

1. **Frontend can't reach backend**
   - Check REACT_APP_API_URL is correct
   - Verify backend is running and healthy
   - Check CORS configuration

2. **Database connection issues**
   - Verify DATABASE_URL is correct
   - Check if server IP is whitelisted in Neon
   - Test database connectivity

3. **Build failures**
   - Check Dockerfile syntax
   - Verify all dependencies are listed in package.json
   - Check for missing environment variables during build

4. **Email not working**
   - Verify Plunk API key is correct
   - Check email configuration in environment variables

### Useful Commands:

```bash
# Test backend health
curl https://backend.estheticsbyanna.net/api/health

# Check frontend build
docker build -t frontend-test .

# Check backend build
docker build -t backend-test ./backend

# Test locally with Docker Compose
docker-compose up --build
```

## Support

For deployment issues:
1. Check Coolify logs
2. Verify all environment variables
3. Test individual services
4. Check network connectivity between services

## Additional Resources
- [Coolify Documentation](https://coolify.io/docs)
- [Docker Documentation](https://docs.docker.com)
- [Neon Database Documentation](https://neon.tech/docs)