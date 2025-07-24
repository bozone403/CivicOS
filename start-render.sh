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

# Function to install Ollama
install_ollama() {
    echo "🤖 Installing Ollama..."
    
    # Download and install Ollama
    curl -fsSL https://ollama.ai/install.sh | sh
    
    # Add Ollama to PATH
    export PATH=$PATH:/usr/local/bin
    
    # Verify installation
    if command -v ollama &> /dev/null; then
        echo "✅ Ollama installed successfully"
        return 0
    else
        echo "❌ Ollama installation failed"
        return 1
    fi
}

# Function to start Ollama
start_ollama() {
    echo "🤖 Starting Ollama service..."
    
    # Kill any existing Ollama processes
    pkill -f ollama 2>/dev/null || true
    sleep 2
    
    # Start Ollama in background
    ollama serve > /dev/null 2>&1 &
    OLLAMA_PID=$!
    
    # Wait for Ollama to start
    echo "⏳ Waiting for Ollama to be ready..."
    for i in {1..30}; do
        if check_ollama; then
            echo "✅ Ollama is running successfully"
            return 0
        fi
        echo "⏳ Attempt $i/30 - Waiting for Ollama..."
        sleep 2
    done
    
    echo "❌ Ollama failed to start after 60 seconds"
    return 1
}

# Function to ensure Mistral model is available
ensure_mistral() {
    echo "📥 Ensuring Mistral model is available..."
    
    # Check if Mistral is already available
    if ollama list | grep -q "mistral"; then
        echo "✅ Mistral model already available"
        return 0
    fi
    
    # Pull Mistral model
    echo "📥 Downloading Mistral model (this may take a few minutes)..."
    ollama pull mistral:latest
    
    if [ $? -eq 0 ]; then
        echo "✅ Mistral model downloaded successfully"
        return 0
    else
        echo "❌ Failed to download Mistral model"
        return 1
    fi
}

# Main startup sequence
echo "🔧 Starting CivicOS with AI service..."

# Step 1: Install Ollama if not available
if ! command -v ollama &> /dev/null; then
    if ! install_ollama; then
        echo "⚠️  Ollama installation failed, continuing without AI service"
    fi
fi

# Step 2: Start Ollama
if command -v ollama &> /dev/null; then
    if start_ollama; then
        # Step 3: Ensure Mistral is available
        if ensure_mistral; then
            echo "🎉 AI service is ready!"
            echo "📋 Available models:"
            ollama list
        else
            echo "⚠️  Mistral model not available, AI service will use fallbacks"
        fi
    else
        echo "⚠️  Ollama failed to start, AI service will use fallbacks"
    fi
else
    echo "⚠️  Ollama not available, AI service will use fallbacks"
fi

# Step 4: Start the main application
echo "🚀 Starting CivicOS application on Render..."
echo "🌐 Frontend: https://civicos.onrender.com"
echo "🔧 Backend: https://civicos.onrender.com/api"
echo "🤖 AI Service: https://civicos.onrender.com/api/ai"

# Start the Node.js application
exec NODE_ENV=production RENDER=true node dist/server/index.js 