#!/bin/bash

# Script to apply the dashboard migration
# This adds the missing columns and tables needed for the dashboard functionality

echo "Applying dashboard migration..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not set. Please check your .env file."
    exit 1
fi

# Apply the migration
echo "Running migration: 0012_add_dashboard_required_fields.sql"
psql "$DATABASE_URL" -f migrations/0012_add_dashboard_required_fields.sql

if [ $? -eq 0 ]; then
    echo "✅ Dashboard migration applied successfully!"
    echo "The database now has all the required columns and tables for real dashboard data."
    
    # Test the database connection
    echo "Testing database connection..."
    psql "$DATABASE_URL" -c "SELECT COUNT(*) as user_count FROM users; SELECT COUNT(*) as vote_count FROM votes; SELECT COUNT(*) as bill_count FROM bills WHERE status = 'active';"
    
    echo "✅ Database is ready for real dashboard data!"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi 