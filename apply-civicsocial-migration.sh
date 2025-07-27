#!/bin/bash

# CivicSocial Database Migration Script
# This script applies the CivicSocial schema to the live Supabase database

echo "🔧 Applying CivicSocial database migration..."

# Database URL from environment
DATABASE_URL="postgresql://postgres.wmpsjclnykcxtqwxfffv:0QZpuL2bShMezo2S@aws-0-us-east-2.pooler.supabase.com:6543/postgres"

# Apply the migration
echo "📊 Creating CivicSocial tables..."
psql "$DATABASE_URL" -f migrations/0015_civicsocial_complete_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ CivicSocial database migration completed successfully!"
    echo "📋 Tables created:"
    echo "  - social_posts"
    echo "  - social_comments" 
    echo "  - social_likes"
    echo "  - social_shares"
    echo "  - social_bookmarks"
    echo "  - user_friends"
    echo "  - user_activities"
    echo "  - profile_views"
    echo "  - user_blocks"
    echo "  - user_reports"
    echo ""
    echo "🔒 RLS policies enabled for all tables"
    echo "📈 Performance indexes created"
    echo "🧪 Sample data inserted for testing"
else
    echo "❌ Migration failed!"
    exit 1
fi 