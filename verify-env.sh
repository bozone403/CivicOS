#!/bin/bash

# CivicOS Environment Verification Script
echo "🔍 Verifying CivicOS environment variables..."

ENV_FILE="hostinger-deploy/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Environment file not found: $ENV_FILE"
    exit 1
fi

echo "✅ Environment file found: $ENV_FILE"
echo ""

# Check required variables
echo "📋 Checking required environment variables..."

# Database
if grep -q "DATABASE_URL=postgresql://" "$ENV_FILE"; then
    echo "✅ DATABASE_URL - Configured"
else
    echo "❌ DATABASE_URL - Missing or invalid"
fi

# JWT
if grep -q "SESSION_SECRET=" "$ENV_FILE" && ! grep -q "SESSION_SECRET=your" "$ENV_FILE"; then
    echo "✅ SESSION_SECRET - Configured"
else
    echo "❌ SESSION_SECRET - Missing or using default"
fi

# Supabase
if grep -q "SUPABASE_URL=https://" "$ENV_FILE"; then
    echo "✅ SUPABASE_URL - Configured"
else
    echo "❌ SUPABASE_URL - Missing or invalid"
fi

if grep -q "SUPABASE_ANON_KEY=eyJ" "$ENV_FILE"; then
    echo "✅ SUPABASE_ANON_KEY - Configured"
else
    echo "❌ SUPABASE_ANON_KEY - Missing or invalid"
fi

# OpenAI
if grep -q "OPENAI_API_KEY=sk-" "$ENV_FILE"; then
    echo "✅ OPENAI_API_KEY - Configured"
else
    echo "❌ OPENAI_API_KEY - Missing or invalid"
fi

# Stripe
if grep -q "STRIPE_SECRET_KEY=sk_" "$ENV_FILE"; then
    echo "✅ STRIPE_SECRET_KEY - Configured"
else
    echo "❌ STRIPE_SECRET_KEY - Missing or invalid"
fi

if grep -q "STRIPE_PUBLISHABLE_KEY=pk_" "$ENV_FILE"; then
    echo "✅ STRIPE_PUBLISHABLE_KEY - Configured"
else
    echo "❌ STRIPE_PUBLISHABLE_KEY - Missing or invalid"
fi

# Domain
if grep -q "CORS_ORIGIN=https://" "$ENV_FILE" && ! grep -q "yourdomain.com" "$ENV_FILE"; then
    echo "✅ CORS_ORIGIN - Configured"
else
    echo "❌ CORS_ORIGIN - Needs to be updated with your domain"
fi

echo ""
echo "🎯 Deployment Readiness Check:"
echo ""

# Count configured vs missing
CONFIGURED=$(grep -E "^(DATABASE_URL|SESSION_SECRET|SUPABASE_URL|SUPABASE_ANON_KEY|OPENAI_API_KEY|STRIPE_SECRET_KEY|STRIPE_PUBLISHABLE_KEY)=" "$ENV_FILE" | grep -v "your" | wc -l)
TOTAL=7

if [ "$CONFIGURED" -eq "$TOTAL" ]; then
    echo "✅ All critical variables are configured!"
    echo "🚀 Your deployment package is ready for Hostinger!"
else
    echo "⚠️  $CONFIGURED/$TOTAL critical variables configured"
    echo "📝 Please update the remaining variables before deployment"
fi

echo ""
echo "📁 Next steps:"
echo "1. Run './update-domain.sh' to set your domain"
echo "2. Upload 'hostinger-deploy/' contents to Hostinger"
echo "3. Contact Hostinger support to start the Node.js app" 