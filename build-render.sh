#!/bin/bash
# CivicOS Suite - Render Build Script
# This script ensures all dependencies are properly installed before building

set -e  # Exit on any error

echo "🚀 CIVICOS SUITE - RENDER BUILD SCRIPT"
echo "========================================"

echo "📋 Step 1: Installing root dependencies..."
npm ci --no-audit --no-fund --silent

echo "📋 Step 2: Building server..."
npm run build:server

echo "📋 Step 3: Installing client dependencies..."
cd client
npm ci --no-audit --no-fund --silent

echo "📋 Step 4: Building client..."
npm run build

echo "✅ Build completed successfully!"
echo "📁 Server build: dist/"
echo "📁 Client build: dist/public/"
