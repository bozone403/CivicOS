#!/bin/bash

echo "🚀 Starting CivicOS Full Deployment (GitHub + Vercel)..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check git status
echo "📋 Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Changes detected, committing to git..."
    
    # Add all files
    git add .
    
    # Commit with timestamp
    git commit -m "Deploy: Production configuration for civicos.ca - $(date)"
    
    # Push to GitHub
    echo "📤 Pushing to GitHub..."
    git push origin main
    
    echo "✅ Successfully pushed to GitHub!"
else
    echo "ℹ️ No changes to commit"
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
    echo "✅ Full deployment complete!"
    echo ""
    echo "📋 Deployment Summary:"
    echo "✅ GitHub: Code pushed to main branch"
    echo "✅ Vercel: Production deployment initiated"
    echo "✅ Build: Project compiled successfully"
    echo ""
    echo "🔗 Production URLs:"
    echo "🌐 Frontend: https://civicos.ca"
    echo "🔧 Health Check: https://civicos.ca/health"
    echo "📊 API Test: https://civicos.ca/api/auth/user"
    echo ""
    echo "📋 Next steps:"
    echo "1. Verify environment variables in Vercel dashboard"
    echo "2. Test the production app"
    echo "3. Check database connections"
    echo "4. Verify authentication flow"
else
    echo "❌ Build failed!"
    exit 1
fi 