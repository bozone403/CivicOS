# Production Environment Configuration

## Required Environment Variables for Render

Set these in your Render dashboard under Environment Variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres.wmpsjclnykcxtqwxfffv:0QZpuL2bShMezo2S@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require

# JWT Configuration
SESSION_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12
JWT_SECRET=civicos-jwt-secret-key-2024

# CORS Configuration
CORS_ORIGIN=https://civicos.ca

# Base URL Configuration
BASE_URL=https://civicos.ca
FRONTEND_BASE_URL=https://civicos.ca

# Supabase Configuration
SUPABASE_URL=https://wmpsjclnykcxtqwxfffv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtcHNqY2xueWtjeHRxd3hmZmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjYwNDEsImV4cCI6MjA2NzQwMjA0MX0.hHrXn_D4e8f9JFLig5-DTVOzr5aCUpi3aeh922mNw4c
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtcHNqY2xueWtjeHRxd3hmZmZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyNjA0MSwiZXhwIjoyMDY3NDAyMDQxfQ.VeqLO3T2Ixu31MYrTxLX1Qod4rUxMfBcCGXmQlyrXY4

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_live_51RXSIIG7smx2v2qq53S9qPt0UQoMQfRy7G8aTWU9XuHjRrbwvnoZSOIZuehqm6a9Gs3Evb7zgIKtifP3jWq9yukf00CJBb2Sfn
STRIPE_SECRET_KEY=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

# Application Configuration
NODE_ENV=production
PORT=5001

# Admin Configuration
ADMIN_EMAIL=Jordan@iron-Oak.Ca

# Feature Flags
ENABLE_STRIPE_PAYMENTS=true
ENABLE_SUPABASE_AUTH=true
ENABLE_OLLAMA=false

# AI Configuration (disabled in production)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral:latest

# Production Configuration
ENABLE_DEBUG_LOGGING=false
ENABLE_HOT_RELOAD=false
```

## Key Changes for Production

1. **ENABLE_OLLAMA=false** - Disables Ollama AI service in production
2. **NODE_TLS_REJECT_UNAUTHORIZED=0** - Allows Supabase SSL connections
3. **ENABLE_DEBUG_LOGGING=false** - Reduces log noise in production

## AI Service Fallback

When Ollama is disabled, the AI service will provide intelligent fallback responses instead of failing. 