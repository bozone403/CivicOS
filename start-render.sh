#!/bin/bash

# CivicOS Suite - Render Startup Script (Mock AI Only - No Ollama)
# Completely disabled Ollama to avoid resource issues
# Using comprehensive mock data with accurate Canadian political information

echo "🚀 CIVICOS SUITE - RENDER STARTUP SCRIPT v4.0 (MOCK AI ONLY)"
echo "============================================================"
echo "🎯 Mock AI deployment - no external AI dependencies"
echo "📊 Comprehensive Canadian political data included"
echo "⚡ Fast startup without Ollama installation"

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
echo "📋 Step 1: Environment Configuration (Mock AI)"
export AI_SERVICE_ENABLED=false
export USE_MOCK_AI=true
export OLLAMA_ENABLED=false
export OLLAMA_INSTALLED=false
export AI_READY=true
export NODE_ENV=production
export RENDER=true

echo "✅ Environment configured:"
echo "   - AI_SERVICE_ENABLED: $AI_SERVICE_ENABLED"
echo "   - USE_MOCK_AI: $USE_MOCK_AI"
echo "   - OLLAMA_ENABLED: $OLLAMA_ENABLED"
echo "   - NODE_ENV: $NODE_ENV"
echo ""

# Start the Node.js application
echo "📋 Step 2: Starting CivicOS Application (Mock AI Mode)"
echo "🚀 Starting Node.js server with comprehensive mock data..."
echo ""

if [ "$NODE_ENV" = "production" ]; then
    echo "📈 Production mode detected (Mock AI)"
    echo "🔧 Starting with optimized mock data settings..."
    echo "📊 Mock data includes:"
    echo "   - Mark Carney as current PM (accurate as of July 2025)"
    echo "   - Current bills: C-60, C-56, C-21, C-61"
    echo "   - Economic indicators and government data"
    echo "   - Comprehensive politician profiles"
    echo "   - News analysis and fact-checking"
    echo ""
    cd /opt/render/project/src
    exec node dist/server/index.js
else
    echo "🔧 Development mode (Mock AI)"
    exec npm run dev
fi 