#!/bin/bash

echo "🚀 CivicSocial Database Migration"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set your database connection string and try again"
    exit 1
fi

echo "📊 Running CivicSocial migration..."
echo "Database: ${DATABASE_URL:0:50}..."

# Run the migration using psql
psql "$DATABASE_URL" -f migrations/0001_civicsocial_tables.sql

if [ $? -eq 0 ]; then
    echo "✅ CivicSocial migration completed successfully!"
    echo ""
    echo "📋 Created tables:"
    echo "  ✅ social_posts - Social posts and shares"
    echo "  ✅ social_comments - Comments on posts"
    echo "  ✅ social_likes - Likes on posts and comments"
    echo "  ✅ user_friends - Friend relationships"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Restart your server to use real data"
    echo "2. CivicSocial will now work with actual database"
    echo "3. Test the social features at /civicsocial/feed"
else
    echo "❌ Migration failed!"
    echo "Check your database connection and try again"
    exit 1
fi 