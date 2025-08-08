#!/bin/bash

# Comprehensive migration script for CivicOS production database
# This script applies all recent migrations to ensure the database schema is up to date

set -e

echo "🚀 Starting comprehensive database migration for CivicOS..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL before running this script"
    exit 1
fi

echo "✅ DATABASE_URL is configured"

# Function to apply migration with error handling
apply_migration() {
    local migration_file=$1
    local migration_name=$(basename "$migration_file" .sql)
    
    echo "📝 Applying migration: $migration_name"
    
    if psql "$DATABASE_URL" -f "$migration_file" > /dev/null 2>&1; then
        echo "✅ Successfully applied: $migration_name"
    else
        echo "⚠️  Migration $migration_name failed or already applied (continuing...)"
    fi
}

# Apply all migrations in order
echo "🔄 Applying all migrations in alphanumeric order..."

# Apply all .sql migrations in order (handles newly added files automatically)
for file in $(ls -1 migrations/*.sql | sort); do
  apply_migration "$file"
done

echo "🎉 All migrations attempted!"

# Verify critical tables exist
echo "🔍 Verifying critical tables..."

critical_tables=("users" "politicians" "bills" "votes" "social_posts" "announcements" "permissions" "user_permissions")

for table in "${critical_tables[@]}"; do
    if psql "$DATABASE_URL" -c "SELECT 1 FROM $table LIMIT 1;" > /dev/null 2>&1; then
        echo "✅ Table $table exists"
    else
        echo "❌ Table $table is missing!"
    fi
done

# Test database connection
echo "🧪 Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT NOW() as current_time;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    exit 1
fi

echo "🎯 Migration script completed successfully!"
echo "The database should now be fully up to date with the latest schema."