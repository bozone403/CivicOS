#!/bin/bash

echo "🚀 Starting CivicOS Development Environment for Replit..."

export NODE_ENV="development"

echo "✅ Environment configured for Replit"
echo "   NODE_ENV: development"
echo "   DATABASE_URL: [from Replit env]"
echo "   SESSION_SECRET: [from Replit env]"

echo ""
echo "🔧 Starting backend server on port 5001..."
NODE_ENV=development tsx server/index.ts &
BACKEND_PID=$!

sleep 3

echo "🎨 Starting frontend dev server on port 5000..."
cd client && npm run dev

wait $BACKEND_PID
