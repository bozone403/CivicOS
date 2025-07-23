#!/bin/bash

# Set environment variables
export DATABASE_URL="postgresql://postgres.wmpsjclnykcxtqwxfffv:0QZpuL2bShMezo2S@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"
export SESSION_SECRET="civicos-dev-session-secret-2024"
export NODE_ENV="development"

# Start the server
echo "Starting CivicOS server with environment variables..."
npm run dev
