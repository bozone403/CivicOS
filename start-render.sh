#!/bin/bash

# CivicOS Suite - Render Startup Script (Production, real-only data)

echo "🚀 CIVICOS SUITE - RENDER STARTUP (REAL-ONLY DATA)"
echo "=================================================="

# System information
echo ""
echo "📊 SYSTEM INFORMATION"
echo "====================="
uname -a
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Available disk space:"
df -h /tmp 2>/dev/null || df -h .
echo "Memory info:"
free -h 2>/dev/null || echo "Memory info not available"
echo ""

echo "🎯 MAIN STARTUP SEQUENCE"
echo "========================"

# Set environment variables for mock AI
echo "📋 Step 1: Environment Configuration"
export NODE_ENV=production
export RENDER=true
export AI_SERVICE_ENABLED=false
export USE_MOCK_AI=false
export OLLAMA_ENABLED=false
export OLLAMA_INSTALLED=false
export AI_READY=true
# Real-only data ingestion defaults
export DATA_SYNC_ENABLED=true
export AUTO_INGEST_ON_START=true
export NODE_ENV=production
export RENDER=true

echo "✅ Environment configured:"
echo "   - NODE_ENV: $NODE_ENV"
echo "   - RENDER: $RENDER"
echo "   - AI_SERVICE_ENABLED: $AI_SERVICE_ENABLED"
echo "   - USE_MOCK_AI: $USE_MOCK_AI"
echo "   - OLLAMA_ENABLED: $OLLAMA_ENABLED"
echo "   - DATA_SYNC_ENABLED: $DATA_SYNC_ENABLED"
echo "   - AUTO_INGEST_ON_START: $AUTO_INGEST_ON_START"
echo ""

# Start the Node.js application
echo "📋 Step 2: Starting CivicOS Application"
echo "🚀 Starting Node.js server with production configuration..."
echo ""

if [ "$NODE_ENV" = "production" ]; then
  echo "📈 Production mode detected"
  echo "🔧 Real-only data policy enabled; ingestion will run on boot if DB low"
  cd /opt/render/project/src
  exec node dist/server/index.js
else
  echo "🔧 Development mode"
  exec npm run dev
fi