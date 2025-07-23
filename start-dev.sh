#!/bin/bash

# Development startup script for CivicOS
echo "Starting CivicOS development environment..."

# Set required environment variables
export DATABASE_URL="postgresql://postgres.wmpsjclnykcxtqwxfffv:0QZpuL2bShMezo2S@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"
export SESSION_SECRET="civicos-dev-session-secret-2024"

# Start the server
echo "Starting server with environment variables set..."
cd server && npm run dev 