#!/bin/bash

echo "🚀 Deploying CivicOS with Node 18.x compatibility"

# Exit on any error
set -e

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building frontend..."
cd client
npm install
npm run build
cd ..

echo "📁 Copying built frontend to dist..."
rm -rf dist/public
cp -r client/dist dist/public

echo "🔧 Creating index.js for Vercel..."
echo "module.exports = require('../server/index.ts');" > dist/index.js

echo "📝 Git operations..."
git add .
git commit -m "Update CivicOS for Node 18.x compatibility - Vercel deployment ready"
git push origin main

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add environment variables to Vercel:"
echo "   - SESSION_SECRET: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12"
echo "   - DATABASE_URL: postgresql://postgres.wmpsjclnykcxtqwxfffv:0QZpuL2bShMezo2S@aws-0-us-east-2.pooler.supabase.com:6543/postgres"
echo "2. Vercel will auto-deploy from GitHub"
echo "3. Test endpoints:"
echo "   - Health: https://your-app.vercel.app/health"
echo "   - Frontend: https://your-app.vercel.app"
echo ""
echo "🎉 CivicOS is ready for Node 18.x deployment!" 