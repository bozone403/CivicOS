#!/bin/bash

# Apply permissions schema fix migration
echo "🔧 Applying permissions schema fix..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL before running this script"
    exit 1
fi

# Apply the migration
echo "📝 Running migration 0022_fix_permissions_schema.sql..."
psql "$DATABASE_URL" -f migrations/0022_fix_permissions_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Permissions schema fix applied successfully!"
    echo "🔍 The following changes were made:"
    echo "   - Added missing fields to user_permissions table"
    echo "   - Added missing fields to membership_permissions table"
    echo "   - Added missing field to permissions table"
    echo "   - Added foreign key constraints"
    echo "   - Inserted default permissions and membership permissions"
else
    echo "❌ Failed to apply permissions schema fix"
    exit 1
fi

echo "🎉 Permissions system is now properly configured!" 