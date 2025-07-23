#!/bin/bash

echo "🚀 Starting CivicOS Development Environment..."

# Set environment variables
export DATABASE_URL="postgresql://postgres.wmpsjclnykcxtqwxfffv:0QZpuL2bShMezo2S@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"
export SESSION_SECRET="civicos-dev-session-secret-2024"
export NODE_ENV="development"

echo "✅ Environment variables set:"
echo "   DATABASE_URL: [CONFIGURED]"
echo "   SESSION_SECRET: [CONFIGURED]"
echo "   NODE_ENV: development"

# Start the server
echo "🔧 Starting server..."
cd server && npm run dev 