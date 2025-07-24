#!/bin/bash

echo "🚀 CIVICOS SUITE - STARTUP SCRIPT"
echo "=================================="

# Check if we're on Render
if [ "$RENDER" = "true" ]; then
    echo "🌐 Render environment detected - using enhanced startup"
    ./start-render.sh
else
    echo "🔧 Local environment detected - using standard startup"
    NODE_ENV=production node dist/server/index.js
fi
