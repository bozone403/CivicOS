# 🚀 CivicOS Production Deployment Guide

## Environment Variables Required

Create a `.env` file in the root directory with the following variables:

```bash
# Database Configuration
DATABASE_URL=your_production_database_url_here

# Security
SESSION_SECRET=your_very_secure_session_secret_here
JWT_SECRET=your_very_secure_jwt_secret_here

# API Keys
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here

# URLs
FRONTEND_BASE_URL=https://civicos.ca
BASE_URL=https://civicos.ca
CORS_ORIGIN=https://civicos.ca

# Admin Configuration
ADMIN_EMAIL=your_admin_email@civicos.ca

# Environment
NODE_ENV=production
PORT=5001
```

## Deployment Steps

1. **Set Environment Variables:**
   ```bash
   # Copy the example above to .env file
   cp .env.production.example .env
   # Edit with your actual values
   nano .env
   ```

2. **Build and Deploy:**
   ```bash
   # Build the full application
   npm run build:full
   
   # Start production server
   npm start
   
   # Or use the deployment script
   ./deploy-production.sh
   ```

3. **Domain Configuration:**
   - Point your domain `civicos.ca` to your server
   - Ensure port 5001 is accessible
   - Set up SSL certificate for HTTPS

## API Endpoints

The backend serves both API and frontend from the same server:

- **API Base URL:** `https://civicos.ca/api`
- **Frontend:** `https://civicos.ca`
- **Port:** 5001 (configurable via PORT env var)

## Production Features

✅ **Authentication:** JWT-based with secure tokens
✅ **CORS:** Configured for civicos.ca domain
✅ **Rate Limiting:** Express rate limiting enabled
✅ **Security:** Helmet.js security headers
✅ **Database:** PostgreSQL with Drizzle ORM
✅ **File Uploads:** Multer with size limits
✅ **Error Handling:** Comprehensive error logging
✅ **Monitoring:** Real-time data sync and analysis

## Health Check

Test your deployment:

```bash
# Check if server is running
curl https://civicos.ca/api/health

# Check authentication
curl https://civicos.ca/api/auth/user
```

## Troubleshooting

1. **Port Issues:** Ensure port 5001 is open
2. **Database:** Check DATABASE_URL is correct
3. **CORS:** Verify domain is in allowed origins
4. **SSL:** Ensure HTTPS is properly configured
5. **Environment:** Confirm NODE_ENV=production 