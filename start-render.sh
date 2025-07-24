#!/bin/bash

echo "🚀 CIVICOS SUITE - RENDER STARTUP SCRIPT"
echo "========================================="

# Set production environment
export NODE_ENV=production
export RENDER=true

# Function to check if Ollama is running
check_ollama() {
    if curl -s --max-time 5 http://localhost:11434/api/tags > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to use bundled Ollama
use_bundled_ollama() {
    echo "🤖 Using bundled Ollama..."
    
    # Check if bundled Ollama exists
    if [ -f "./ollama-bundle/ollama" ]; then
        echo "✅ Bundled Ollama found"
        
        # Make sure it's executable
        chmod +x ./ollama-bundle/ollama
        
        # Set Ollama to use our bundle
        export OLLAMA_HOST=0.0.0.0:11434
        export OLLAMA_ORIGINS=*
        
        return 0
    else
        echo "❌ Bundled Ollama not found"
        return 1
    fi
}

# Function to start bundled Ollama
start_bundled_ollama() {
    echo "🤖 Starting bundled Ollama service..."
    
    # Kill any existing Ollama processes
    pkill -f ollama 2>/dev/null || true
    sleep 2
    
    # Start bundled Ollama
    cd ollama-bundle
    ./ollama serve > /dev/null 2>&1 &
    OLLAMA_PID=$!
    cd ..
    
    # Wait for Ollama to start
    echo "⏳ Waiting for bundled Ollama to be ready..."
    for i in {1..30}; do
        if check_ollama; then
            echo "✅ Bundled Ollama is running successfully"
            return 0
        fi
        echo "⏳ Attempt $i/30 - Waiting for bundled Ollama..."
        sleep 2
    done
    
    echo "❌ Bundled Ollama failed to start after 60 seconds"
    return 1
}

# Function to ensure bundled Mistral model is available
ensure_bundled_mistral() {
    echo "📥 Ensuring bundled Mistral model is available..."
    
    # Check if bundled Mistral is available
    if [ -d "./ollama-bundle/models/mistral" ]; then
        echo "✅ Bundled Mistral model already available"
        return 0
    else
        echo "❌ Bundled Mistral model not found"
        echo "⚠️  Please run ./bundle-ollama.sh first to download the model"
        return 1
    fi
}

# Main startup sequence
echo "🔧 Starting CivicOS with bundled AI service..."

# Step 1: Use bundled Ollama
if use_bundled_ollama; then
    # Step 2: Start bundled Ollama
    if start_bundled_ollama; then
        # Step 3: Ensure bundled Mistral is available
        if ensure_bundled_mistral; then
            echo "🎉 Bundled AI service is ready!"
            echo "📋 Using bundled Mistral model"
        else
            echo "⚠️  Bundled Mistral model not available, AI service will use fallbacks"
        fi
    else
        echo "⚠️  Bundled Ollama failed to start, AI service will use fallbacks"
    fi
else
    echo "⚠️  Bundled Ollama not available, AI service will use fallbacks"
fi

# Step 4: Start the main application
echo "🚀 Starting CivicOS application on Render..."
echo "🌐 Frontend: https://civicos.onrender.com"
echo "🔧 Backend: https://civicos.onrender.com/api"
echo "🤖 AI Service: https://civicos.onrender.com/api/ai"

# Start the Node.js application
exec NODE_ENV=production RENDER=true node dist/server/index.js 