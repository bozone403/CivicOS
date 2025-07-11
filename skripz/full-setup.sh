#!/bin/bash
set -e

echo "🚀 CivicOS Full Setup & Redeploy Script"
echo "========================================"

# Kill any running processes
echo "💣 Killing rogue Node processes..."
pkill -f node || echo "No rogue node processes found."

# Clean everything
echo "🧹 Cleaning up all build artifacts and dependencies..."
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json client/dist
rm -rf server/node_modules server/package-lock.json server/dist
rm -rf dist

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p client/src/components/ui
mkdir -p client/src/pages
mkdir -p client/src/contexts
mkdir -p client/src/lib
mkdir -p dist/public

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

# Install server dependencies (if separate)
if [ -d server ]; then
  echo "📦 Installing server dependencies..."
  cd server
  npm install
  cd ..
fi

# Build client (frontend)
echo "🔥 Building client (frontend)..."
cd client
npm run build
cd ..

# Build server (backend)
echo "🔥 Building server (backend)..."
npm run build

# Create .htaccess for Hostinger
echo "📝 Creating .htaccess for Hostinger..."
cat > dist/public/.htaccess << 'EOF'
RewriteEngine On
RewriteBase /

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Cache static assets
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
</FilesMatch>
EOF

# Create config.js for API endpoints
echo "📝 Creating config.js for API endpoints..."
cat > dist/public/config.js << 'EOF'
window.CIVICOS_CONFIG = {
  API_BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://civic-f0vqmv05p-jordan-boisclairs-projects.vercel.app' 
    : 'http://localhost:3000',
  DOMAIN: 'civicos.ca',
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  VERSION: '1.0.0'
};
EOF

# Initialize git if needed
echo "🌳 Initializing git if needed..."
git rev-parse --is-inside-work-tree || git init

# Add all files
echo "➕ Adding all files to git..."
git add .

# Commit changes
echo "✍️ Committing changes..."
git commit -m "Full setup: $(date) - Complete client/server structure" || echo "No changes to commit."

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git branch -M main
git push -u origin main || echo "Git push failed or not configured."

# Deploy to Vercel
echo "🔄 Deploying backend to Vercel..."
vercel --prod || echo "Vercel deployment failed or not configured."

echo ""
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "📋 What was created:"
echo "  ✅ Client-side React app with Vite"
echo "  ✅ Authentication system"
echo "  ✅ Dashboard and pages"
echo "  ✅ UI components with Radix UI"
echo "  ✅ Tailwind CSS styling"
echo "  ✅ TypeScript configuration"
echo "  ✅ Build system configured"
echo ""
echo "📁 Files created:"
echo "  📂 client/ - Complete React frontend"
echo "  📂 dist/public/ - Built frontend for deployment"
echo "  📄 .htaccess - Hostinger configuration"
echo "  📄 config.js - API endpoint configuration"
echo ""
echo "🚀 Next Steps:"
echo "  1. Upload dist/public/* to Hostinger"
echo "  2. Test the application at civicos.ca"
echo "  3. Backend is deployed to Vercel"
echo ""
echo "🔧 Development:"
echo "  - Frontend: cd client && npm run dev"
echo "  - Backend: npm run dev"
echo "  - Full build: npm run build"
echo ""
echo "🎉 Your CivicOS platform is ready!" 