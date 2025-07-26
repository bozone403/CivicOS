#!/bin/bash

# Script to apply RLS migration to Supabase
# This script addresses all the Supabase security linter warnings

echo "🔒 Applying Row Level Security (RLS) Migration to Supabase"
echo "========================================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set your Supabase database URL:"
    echo "export DATABASE_URL='postgresql://username:password@host:port/database'"
    exit 1
fi

echo "✅ Database URL found"
echo "📋 Applying RLS migration..."

# Apply the migration
psql "$DATABASE_URL" -f migrations/0008_enable_rls_security.sql

if [ $? -eq 0 ]; then
    echo "✅ RLS migration applied successfully!"
    echo ""
    echo "🔒 Security Summary:"
    echo "• Row Level Security enabled on all public tables"
    echo "• Public read access for government data (politicians, bills, elections)"
    echo "• User-specific access for personal data (users, notifications, messages)"
    echo "• Authenticated users can create/update their own content"
    echo "• All Supabase security linter warnings should now be resolved"
    echo ""
    echo "🚀 Your CivicOS database is now secure and compliant!"
else
    echo "❌ Error applying RLS migration"
    echo "Please check your database connection and try again"
    exit 1
fi 