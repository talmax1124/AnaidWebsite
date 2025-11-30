# Complete Production Deployment Guide for Esthetics by Anna

## Overview
This guide provides step-by-step instructions to deploy the Esthetics by Anna website to Coolify with all three services: Frontend, Backend API, and Sanity CMS.

## Architecture
- **Frontend**: React TypeScript app (Port 80) - `estheticsbyanna.net`
- **Backend API**: Node.js Express server (Port 3001) - `backend.estheticsbyanna.net`  
- **Sanity CMS**: Content management studio (Port 3333) - `sanity.estheticsbyanna.net`
- **Database**: Neon PostgreSQL (External)
- **Email**: Plunk API service
- **Payments**: Stripe & Square integration

---

## Prerequisites

### 1. External Services Setup
- [ ] Neon PostgreSQL database created and accessible
- [ ] Plunk account with API key for email service
- [ ] Stripe account with live API keys
- [ ] Square account with production application ID and location ID
- [ ] Domain DNS configured to point to Coolify server
- [ ] Coolify instance running and accessible

### 2. Repository Preparation
Ensure your repository has these files:
- [ ] `Dockerfile` (frontend)
- [ ] `backend/Dockerfile` (backend)
- [ ] `sanity-cms/Dockerfile` (Sanity CMS)
- [ ] `docker-compose.yml` (local testing)
- [ ] `coolify.json` (Coolify configuration)

---

## Service 1: Backend API Deployment

### Step 1: Create Backend Application in Coolify
1. In Coolify dashboard, click "New Application"
2. Connect your GitHub repository
3. Application settings:
   - **Name**: `esthetics-backend`
   - **Build Context**: `backend`
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Port**: `3001`
   - **Domain**: `backend.estheticsbyanna.net`

### Step 2: Backend Environment Variables
Add these environment variables in Coolify:

```bash
# Core Node.js Configuration
NODE_ENV=production
PORT=3001

# Database Configuration
DATABASE_URL=postgresql://username:password@host:5432/database_name

# Authentication & Security
JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters_long
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=https://estheticsbyanna.net
CORS_ORIGIN=https://estheticsbyanna.net

# Email Service (Plunk)
PLUNK_API_KEY=sk_your_actual_plunk_api_key
PLUNK_FROM_EMAIL=noreply@estheticsbyanna.net
PLUNK_FROM_NAME=Esthetics By Anna

# Payment Processing - Stripe
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_stripe_publishable_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### Step 3: Deploy Backend
1. Click "Deploy" in Coolify
2. Monitor build logs for any errors
3. Verify health check: `https://backend.estheticsbyanna.net/api/health`

---

## Service 2: Sanity CMS Deployment

### Step 1: Create Sanity Application in Coolify
1. Create new application in Coolify
2. Use same repository
3. Application settings:
   - **Name**: `esthetics-sanity`
   - **Build Context**: `sanity-cms`
   - **Dockerfile Path**: `sanity-cms/Dockerfile`
   - **Port**: `3333`
   - **Domain**: `sanity.estheticsbyanna.net`

### Step 2: Sanity Environment Variables
Add these environment variables:

```bash
# Core Node.js Configuration
NODE_ENV=production

# Sanity Configuration
SANITY_STUDIO_PROJECT_ID=your_sanity_project_id
SANITY_STUDIO_DATASET=production
SANITY_STUDIO_API_VERSION=2023-05-03
```

### Step 3: Deploy Sanity CMS
1. Click "Deploy" in Coolify
2. Monitor build process
3. Verify access: `https://sanity.estheticsbyanna.net`

---

## Service 3: Frontend Deployment

### Step 1: Create Frontend Application in Coolify
1. Create new application in Coolify
2. Use same repository
3. Application settings:
   - **Name**: `esthetics-frontend`
   - **Build Context**: `.` (root directory)
   - **Dockerfile Path**: `Dockerfile`
   - **Port**: `80`
   - **Domain**: `estheticsbyanna.net`

### Step 2: Frontend Environment Variables
Add these environment variables:

```bash
# Core React Configuration
NODE_ENV=production
REACT_APP_ENVIRONMENT=production

# API Configuration
REACT_APP_API_URL=https://backend.estheticsbyanna.net

# Payment Integration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_stripe_publishable_key
REACT_APP_SQUARE_APPLICATION_ID=your_square_application_id
REACT_APP_SQUARE_LOCATION_ID=your_square_location_id
```

### Step 3: Deploy Frontend
1. Click "Deploy" in Coolify
2. Monitor build process (this takes longest due to React build)
3. Verify website loads: `https://estheticsbyanna.net`

---

## Environment Variables Checklist

### Backend Required Variables ✅
- [ ] `NODE_ENV=production`
- [ ] `PORT=3001`
- [ ] `DATABASE_URL` (Neon PostgreSQL connection string)
- [ ] `JWT_SECRET` (32+ character secure string)
- [ ] `JWT_EXPIRES_IN=7d`
- [ ] `FRONTEND_URL=https://estheticsbyanna.net`
- [ ] `CORS_ORIGIN=https://estheticsbyanna.net`
- [ ] `PLUNK_API_KEY` (from Plunk dashboard)
- [ ] `PLUNK_FROM_EMAIL=noreply@estheticsbyanna.net`
- [ ] `PLUNK_FROM_NAME=Esthetics By Anna`
- [ ] `STRIPE_SECRET_KEY` (sk_live_...)
- [ ] `STRIPE_PUBLISHABLE_KEY` (pk_live_...)
- [ ] `RATE_LIMIT_WINDOW_MS=900000`
- [ ] `RATE_LIMIT_MAX_REQUESTS=100`
- [ ] `LOG_LEVEL=info`

### Frontend Required Variables ✅
- [ ] `NODE_ENV=production`
- [ ] `REACT_APP_ENVIRONMENT=production`
- [ ] `REACT_APP_API_URL=https://backend.estheticsbyanna.net`
- [ ] `REACT_APP_STRIPE_PUBLISHABLE_KEY` (pk_live_...)
- [ ] `REACT_APP_SQUARE_APPLICATION_ID`
- [ ] `REACT_APP_SQUARE_LOCATION_ID`

### Sanity CMS Required Variables ✅
- [ ] `NODE_ENV=production`
- [ ] `SANITY_STUDIO_PROJECT_ID`
- [ ] `SANITY_STUDIO_DATASET=production`
- [ ] `SANITY_STUDIO_API_VERSION=2023-05-03`

---

## Post-Deployment Verification

### 1. Service Health Checks
```bash
# Backend API Health
curl https://backend.estheticsbyanna.net/api/health

# Frontend Loading
curl -I https://estheticsbyanna.net

# Sanity CMS Access
curl -I https://sanity.estheticsbyanna.net
```

### 2. Functional Testing
- [ ] Website loads correctly
- [ ] User can browse products
- [ ] Shopping cart functionality works
- [ ] Checkout process completes
- [ ] Email notifications send
- [ ] Sanity CMS studio is accessible
- [ ] Content updates from Sanity appear on frontend

### 3. SSL Certificate Verification
- [ ] All three domains have valid SSL certificates
- [ ] HTTPS redirects work properly
- [ ] No mixed content warnings

---

## Deployment Order (IMPORTANT!)

Deploy services in this specific order:

1. **Backend API First** - Other services depend on it
2. **Sanity CMS Second** - Frontend may need content
3. **Frontend Last** - Depends on both backend and CMS

---

## Common Issues & Solutions

### Database Connection Issues
- Verify DATABASE_URL format: `postgresql://user:pass@host:port/dbname`
- Ensure Neon IP whitelist includes your Coolify server IP
- Test connection from Coolify server

### CORS Errors
- Double-check FRONTEND_URL and CORS_ORIGIN match exactly
- Ensure no trailing slashes in URLs
- Verify frontend is using correct REACT_APP_API_URL

### Build Failures
- Check Dockerfile syntax
- Verify all dependencies in package.json
- Monitor build logs in Coolify for specific errors

### Email Not Working
- Verify PLUNK_API_KEY is correct (starts with sk_)
- Check from email domain is verified in Plunk
- Test email service endpoint directly

---

## Security Checklist

- [ ] All API keys are production-ready (not test keys)
- [ ] JWT_SECRET is unique and secure (32+ characters)
- [ ] Database credentials are secure
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] All domains have SSL certificates
- [ ] No sensitive data in environment variables logs

---

## Monitoring & Maintenance

### Health Monitoring
Set up monitoring for:
- Backend API health endpoint
- Database connection status
- Email service availability
- Payment processor connectivity

### Backup Strategy
- Configure automated database backups in Neon
- Consider code repository backups
- Document environment variable backup

### Log Monitoring
Monitor application logs in Coolify for:
- Error patterns
- Performance issues
- Security events
- Payment processing errors

---

## Support Resources

- **Coolify Documentation**: https://coolify.io/docs
- **Neon Database Docs**: https://neon.tech/docs
- **Plunk Email API**: https://useplunk.com/docs
- **Stripe API Docs**: https://stripe.com/docs
- **Square Developer**: https://developer.squareup.com

---

## Emergency Rollback Plan

If deployment fails:
1. Check Coolify logs for specific errors
2. Verify all environment variables are set correctly
3. Test individual service health endpoints
4. Roll back to previous working version if needed
5. Contact support with specific error messages

---

*Deployment completed successfully when all three services are running and the complete website functionality works end-to-end.*