#!/bin/bash
echo "Starting CivicOS on Render with Free AI Service..."

# Set Render environment
export NODE_ENV=production
export RENDER=true
export OLLAMA_MODEL=mistral:latest

# Start Ollama service in background (Render only)
echo "🤖 Starting Ollama AI service on Render..."
ollama serve > /dev/null 2>&1 &

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to be ready..."
sleep 15

# Verify Ollama is running
echo "🔍 Verifying Ollama service..."
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama is running successfully"
else
    echo "⚠️  Ollama may not be ready, continuing anyway..."
fi

# Start the main application
echo "🚀 Starting CivicOS application on Render..."
NODE_ENV=production RENDER=true node dist/server/index.js
