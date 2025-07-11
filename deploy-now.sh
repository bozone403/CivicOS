#!/bin/bash

echo "🚀 Starting CivicOS deployment..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

# Build the project
echo "🏗️ Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Deploy to Vercel
    echo "🚀 Deploying to Vercel..."
    npx vercel --prod
    
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Check Vercel dashboard for deployment status"
    echo "2. Verify environment variables are set in Vercel:"
    echo "   - SESSION_SECRET (required)"
    echo "   - NODE_ENV=production (required)"
    echo "   - DATABASE_URL (optional - for real database)"
    echo "3. Test the health endpoint: https://your-app.vercel.app/health"
    echo "4. Test the main app: https://your-app.vercel.app/"
    echo "5. Test registration/login flow"
else
    echo "❌ Build failed!"
    exit 1
fi 