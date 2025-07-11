#!/bin/bash

echo "🚀 Starting CivicOS Production Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

# Build the project
echo "🏗️ Building project for production..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Deploy to Vercel
    echo "🚀 Deploying to Vercel..."
    npx vercel --prod
    
    echo ""
    echo "✅ Production deployment complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Verify environment variables are set in Vercel dashboard"
    echo "2. Test the production app: https://civicos.ca"
    echo "3. Check database connections"
    echo "4. Test authentication flow"
    echo "5. Verify API endpoints"
else
    echo "❌ Build failed!"
    exit 1
fi 