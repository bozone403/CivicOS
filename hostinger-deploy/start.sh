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
