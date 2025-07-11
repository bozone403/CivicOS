#!/bin/bash
echo "💣 Nuking all old builds and node processes..."

# Kill all node processes that might be holding your ports
pkill -f node || true

# Delete old dist folders
rm -rf dist client/dist

echo "🚀 Building fresh client and server..."
npm run build

echo "✅ Starting production server..."
npm start

