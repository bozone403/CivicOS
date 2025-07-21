#!/bin/bash

echo "🔍 CivicOS Production Verification"

# Check if build files exist
echo "📁 Checking build files..."
if [ ! -d "dist/public" ]; then
    echo "❌ Frontend build not found!"
    exit 1
fi

if [ ! -d "dist/server" ]; then
    echo "❌ Backend build not found!"
    exit 1
fi

echo "✅ Build files verified"

# Check environment variables
echo "🔧 Checking environment variables..."
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set"
fi

if [ -z "$SESSION_SECRET" ]; then
    echo "⚠️  SESSION_SECRET not set"
fi

if [ -z "$NODE_ENV" ]; then
    echo "⚠️  NODE_ENV not set (should be 'production')"
fi

echo "✅ Environment check completed"

# Check if server can start
echo "🚀 Testing server startup..."
npm start &
SERVER_PID=$!

sleep 5

if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Server started successfully"
    kill $SERVER_PID
else
    echo "❌ Server failed to start"
    exit 1
fi

echo "🎉 Production verification completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your .env file with production values"
echo "2. Configure your domain to point to your server"
echo "3. Run: ./deploy-production.sh"
echo "4. Access your app at: https://civicos.ca" 