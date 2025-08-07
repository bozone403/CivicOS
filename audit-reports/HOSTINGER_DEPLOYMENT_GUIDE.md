# 🚀 CivicOS Hostinger Deployment Guide

## 📋 Prerequisites

1. **Hostinger Account** with Node.js hosting support
2. **Supabase Project** with database and authentication configured
3. **Domain Name** (optional but recommended)

## 📦 Deployment Package Ready

Your deployment package is ready in the `hostinger-deploy/` directory. This contains:

- ✅ **Backend**: Compiled TypeScript server code
- ✅ **Frontend**: Built React application
- ✅ **Dependencies**: package.json and package-lock.json
- ✅ **Configuration**: .htaccess for Apache
- ✅ **Startup Script**: start.sh for easy deployment
- ✅ **Environment Template**: .env.example

## 🎯 Step-by-Step Deployment

### Step 1: Prepare Your Environment Variables

1. **Copy the template**: Rename `.env.example` to `.env`
2. **Update with your values**:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# JWT Configuration  
SESSION_SECRET=your-super-secure-random-string-here

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# API Configuration
VITE_API_BASE_URL=https://yourdomain.com/api

# Environment
NODE_ENV=production
```

### Step 2: Upload to Hostinger

1. **Access your Hostinger File Manager**
2. **Navigate to your domain's root directory** (usually `public_html/`)
3. **Upload all files** from `hostinger-deploy/` to the root directory
4. **Ensure the file structure looks like this**:

```
public_html/
├── dist/
│   ├── server/          # Backend code
│   └── shared/          # Shared schemas
├── public/              # Frontend files
├── package.json         # Dependencies
├── package-lock.json    # Lock file
├── .env                 # Environment variables
├── start.sh            # Startup script
└── .htaccess           # Apache config
```

### Step 3: Configure Hostinger

1. **Contact Hostinger Support** and tell them:
   - You have a Node.js application
   - It needs to run on port 5000
   - The entry point is `dist/server/index.js`
   - It serves both API endpoints and static files

2. **Alternative**: If you have SSH access:
   ```bash
   cd /path/to/your/domain
   chmod +x start.sh
   ./start.sh
   ```

### Step 4: Test Your Deployment

1. **Visit your domain** - should show the CivicOS frontend
2. **Test API endpoints** - try `https://yourdomain.com/api/health`
3. **Check authentication** - test login/register functionality

## 🔧 Troubleshooting

### Common Issues

1. **Port 5000 not accessible**
   - Contact Hostinger support to open port 5000
   - Or configure reverse proxy to forward requests

2. **Environment variables not loading**
   - Ensure `.env` file is in the root directory
   - Check file permissions (should be readable)

3. **Database connection errors**
   - Verify `DATABASE_URL` is correct
   - Check Supabase connection settings
   - Ensure database is accessible from Hostinger's IP

4. **CORS errors**
   - Update `CORS_ORIGIN` in `.env` to match your domain
   - Check browser console for specific CORS errors

### Debug Commands

If you have SSH access:

```bash
# Check if Node.js is running
ps aux | grep node

# Check logs
tail -f /path/to/your/app/logs

# Test database connection
node -e "console.log(require('dotenv').config())"
```

## 🔒 Security Checklist

- ✅ JWT secret is strong and unique
- ✅ Database URL is secure
- ✅ CORS is properly configured
- ✅ Environment variables are set
- ✅ HTTPS is enabled
- ✅ Security headers are configured

## 📞 Support

If you encounter issues:

1. **Check Hostinger's Node.js documentation**
2. **Contact Hostinger support** with specific error messages
3. **Review the application logs** for detailed error information

## 🎉 Success!

Once deployed, your CivicOS platform will be accessible at:
- **Frontend**: `https://yourdomain.com`
- **API**: `https://yourdomain.com/api/*`
- **Health Check**: `https://yourdomain.com/api/health`

Your CivicOS platform is now live and ready to serve citizens! 🏛️ 