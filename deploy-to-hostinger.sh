#!/bin/bash

# CivicOS Hostinger Deployment Script
echo "🚀 Preparing CivicOS for Hostinger deployment..."

# Create deployment directory
DEPLOY_DIR="hostinger-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy backend files
echo "📦 Copying backend files..."
cp -r dist/server $DEPLOY_DIR/
cp -r dist/shared $DEPLOY_DIR/
cp package.json $DEPLOY_DIR/
cp package-lock.json $DEPLOY_DIR/

# Copy frontend build
echo "🌐 Copying frontend build..."
cp -r dist/public $DEPLOY_DIR/

# Copy environment template
echo "⚙️ Creating environment template..."
cat > $DEPLOY_DIR/.env.example << 'EOF'
# Database Configuration
DATABASE_URL=your_supabase_database_url_here

# JWT Configuration
SESSION_SECRET=your_jwt_secret_here

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API Configuration
VITE_API_BASE_URL=https://yourdomain.com/api

# Environment
NODE_ENV=production
EOF

# Create start script
echo "📝 Creating start script..."
cat > $DEPLOY_DIR/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting CivicOS on Hostinger..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --production
fi

# Start the application
echo "🌐 Starting server on port 5000..."
NODE_ENV=production node dist/server/index.js
EOF

chmod +x $DEPLOY_DIR/start.sh

# Create .htaccess for Hostinger
echo "🔧 Creating .htaccess file..."
cat > $DEPLOY_DIR/.htaccess << 'EOF'
RewriteEngine On

# Handle API routes
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ /dist/server/index.js [L]

# Handle static files
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
EOF

# Create README for deployment
echo "📖 Creating deployment instructions..."
cat > $DEPLOY_DIR/DEPLOYMENT_INSTRUCTIONS.md << 'EOF'
# CivicOS Hostinger Deployment Instructions

## Quick Setup

1. **Upload Files**: Upload all files in this directory to your Hostinger root directory
2. **Environment Variables**: 
   - Rename `.env.example` to `.env`
   - Update all values with your actual credentials
3. **Start Application**: Run `./start.sh` or contact Hostinger support to start the Node.js app

## File Structure
```
/
├── dist/server/          # Backend compiled code
├── dist/shared/          # Shared schemas
├── public/               # Frontend build files
├── package.json          # Dependencies
├── .env                  # Environment variables (create from .env.example)
├── start.sh             # Startup script
└── .htaccess            # Apache configuration
```

## Environment Variables Required

- `DATABASE_URL`: Your Supabase database connection string
- `SESSION_SECRET`: A secure random string for JWT signing
- `CORS_ORIGIN`: Your domain (e.g., https://yourdomain.com)
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_API_BASE_URL`: Your API base URL (e.g., https://yourdomain.com/api)

## Support

If you need help with deployment, contact Hostinger support and provide them with:
- This is a Node.js application
- It needs to run on port 5000
- It serves both API endpoints and static files
- The entry point is `dist/server/index.js`
EOF

echo "✅ Deployment package created in '$DEPLOY_DIR' directory!"
echo "📁 Upload all files from '$DEPLOY_DIR' to your Hostinger root directory"
echo "🔧 Don't forget to set up your environment variables!" 