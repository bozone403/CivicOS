#!/bin/bash

echo "🔧 Fixing deployment issues..."

# Install missing dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🏗️ Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Deploy to Vercel
    echo "🚀 Deploying to Vercel..."
    npx vercel --prod
    
    echo "✅ Deployment complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Check Vercel dashboard for deployment status"
    echo "2. Verify environment variables are set in Vercel:"
    echo "   - SESSION_SECRET"
    echo "   - NODE_ENV=production"
    echo "   - DATABASE_URL (if using real database)"
    echo "3. Test the health endpoint: https://your-app.vercel.app/health"
    echo "4. Test registration/login flow"
else
    echo "❌ Build failed!"
    exit 1
fi 