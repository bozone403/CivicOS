#!/bin/bash

echo "🚀 CIVICOS SUITE - RENDER STARTUP SCRIPT"
echo "========================================="

# Set production environment
export NODE_ENV=production
export RENDER=true

# Install Ollama if not already installed
if ! command -v ollama &> /dev/null; then
    echo "🤖 Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
fi

# Start Ollama service in background
echo "🤖 Starting Ollama AI service..."
ollama serve > /dev/null 2>&1 &

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to be ready..."
sleep 10

# Pull the Mistral model if not already available
echo "📥 Ensuring Mistral model is available..."
ollama pull mistral:latest

# Verify Ollama is running
echo "🔍 Verifying Ollama service..."
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama is running successfully"
    echo "📋 Available models:"
    ollama list
else
    echo "⚠️  Ollama may not be ready, continuing anyway..."
fi

# Start the main application
echo "🚀 Starting CivicOS application on Render..."
echo "🌐 Frontend: https://civicos.onrender.com"
echo "🔧 Backend: https://civicos.onrender.com/api"
echo "🤖 AI Service: https://civicos.onrender.com/api/ai"

# Start the Node.js application
NODE_ENV=production RENDER=true node dist/server/index.js 