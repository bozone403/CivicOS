#!/bin/bash

# CivicOS Ollama Deployment Script
# This script ensures Ollama is available on the production server

echo "🚀 Deploying Ollama for CivicOS Free AI Service..."

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "📦 Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
else
    echo "✅ Ollama is already installed"
fi

# Start Ollama service
echo "🔧 Starting Ollama service..."
ollama serve &

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to be ready..."
sleep 10

# Pull the required model
echo "📥 Downloading Mixtral model..."
ollama pull mistral:latest

# Test the model
echo "🧪 Testing AI service..."
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral:latest",
    "prompt": "Hello, I am CivicOS AI assistant. How can I help you with Canadian civic engagement?",
    "stream": false
  }'

echo "✅ Ollama deployment complete!"
echo "🌐 CivicOS Free AI Service is now available at:"
echo "   - Chatbot: /api/ai/chat"
echo "   - News Analysis: /api/ai/analyze-news"
echo "   - Policy Analysis: /api/ai/analyze-policy"
echo "   - Civic Insights: /api/ai/civic-insights"
echo "   - Health Check: /api/ai/health" 