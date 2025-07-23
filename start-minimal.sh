#!/bin/bash

echo "🚀 Starting CivicOS (minimal mode)..."

# Check if we're in production
if [ "$NODE_ENV" = "production" ]; then
    echo "🏭 Production environment detected"
    
    # Apply database migrations if DATABASE_URL is available
    if [ ! -z "$DATABASE_URL" ]; then
        echo "🗄️  Applying database migrations..."
        
        # Apply the user fields migration
        psql "$DATABASE_URL" -f migrations/0006_complete_user_fields.sql || {
            echo "⚠️  Migration failed - continuing anyway"
        }
        
        echo "✅ Database migrations completed"
    else
        echo "⚠️  DATABASE_URL not available - skipping migrations"
    fi
else
    echo "🔧 Development environment detected"
fi

# Start the Node.js application without Ollama
echo "🚀 Starting Node.js server..."
node dist/server/index.js 