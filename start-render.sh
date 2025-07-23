#!/bin/bash

echo "🚀 Starting CivicOS with Ollama and Mistral..."

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "📦 Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
fi

# Start Ollama in background with proper configuration
echo "🤖 Starting Ollama service..."
OLLAMA_HOST=0.0.0.0:11434 ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to be ready..."
sleep 10

# Check if Mistral model is available
echo "🔍 Checking for Mistral model..."
if ! ollama list | grep -q "mistral"; then
    echo "📥 Downloading Mistral model..."
    ollama pull mistral:latest
else
    echo "✅ Mistral model already available"
fi

# Test Ollama connection
echo "🧪 Testing Ollama connection..."
if curl -s http://127.0.0.1:11434/api/tags > /dev/null; then
    echo "✅ Ollama is running and ready"
else
    echo "❌ Ollama is not responding"
    exit 1
fi

# Start the Node.js application
echo "🌐 Starting CivicOS application..."
exec node dist/server/index.js 