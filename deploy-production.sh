#!/bin/bash

echo "🚀 Starting CivicOS Production Deployment..."

# Set production environment
export NODE_ENV=production

# Build the full application
echo "📦 Building application..."
npm run build:full

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# Start the production server
echo "🌐 Starting production server..."
npm start 