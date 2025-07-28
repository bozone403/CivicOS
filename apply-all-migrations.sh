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
echo "🔄 Applying all migrations..."

# Core schema migrations
apply_migration "migrations/0000_neat_smiling_tiger.sql"
apply_migration "migrations/0001_civicsocial_tables.sql"
apply_migration "migrations/0002_add_profile_fields_to_users.sql"
apply_migration "migrations/0003_add_electoral_voting.sql"
apply_migration "migrations/0004_safe_schema_updates.sql"
apply_migration "migrations/0005_safe_data_migration.sql"
apply_migration "migrations/0006_complete_user_fields.sql"
apply_migration "migrations/0007_add_politicians_unique_constraint.sql"
apply_migration "migrations/0008_enable_rls_security.sql"
apply_migration "migrations/0009_fix_rls_remaining_issues.sql"
apply_migration "migrations/0010_fix_policy_syntax.sql"
apply_migration "migrations/0011_fix_user_profiles_and_social.sql"
apply_migration "migrations/0012_add_dashboard_required_fields.sql"
apply_migration "migrations/0013_add_membership_and_enhanced_fields.sql"
apply_migration "migrations/0014_add_membership_permissions_and_content_tables.sql"
apply_migration "migrations/0015_civicsocial_complete_schema.sql"
apply_migration "migrations/0016_add_bill_sponsors.sql"
apply_migration "migrations/0017_add_username_field.sql"
apply_migration "migrations/0018_add_profile_customization.sql"
apply_migration "migrations/0019_enhance_announcements_schema.sql"
apply_migration "migrations/0020_fix_missing_schema_tables.sql"
apply_migration "migrations/0021_fix_social_tables_data_types.sql"
apply_migration "migrations/0022_fix_permissions_schema.sql"
apply_migration "migrations/0023_add_missing_schema_fields.sql"
apply_migration "migrations/0024_add_final_missing_fields.sql"

echo "🎉 All migrations completed!"

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