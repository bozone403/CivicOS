#!/bin/bash

echo "🚀 CIVICOS SUITE - RENDER STARTUP SCRIPT"
echo "========================================="

# Set production environment
export NODE_ENV=production
export RENDER=true

# Function to check if Ollama is running
check_ollama() {
    if curl -s --max-time 10 http://localhost:11434/api/tags > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to download and setup Ollama
download_ollama() {
    echo "🤖 Downloading Ollama..."
    
    # Create ollama directory
    mkdir -p ollama-bundle
    cd ollama-bundle
    
    # Download Ollama binary with retry logic
    echo "📥 Downloading Ollama binary..."
    for i in {1..3}; do
        if curl -L --max-time 300 https://github.com/ollama/ollama/releases/download/v0.9.6/ollama-linux-amd64.tgz -o ollama-linux-amd64.tgz; then
            echo "✅ Ollama binary downloaded"
            break
        else
            echo "❌ Download attempt $i failed"
            if [ $i -eq 3 ]; then
                cd ..
                return 1
            fi
            sleep 10
        fi
    done
    
    # Extract the binary
    echo "📦 Extracting Ollama binary..."
    if tar -xzf ollama-linux-amd64.tgz; then
        # Make it executable
        chmod +x ollama
        
        # Clean up
        rm ollama-linux-amd64.tgz
        
        echo "✅ Ollama binary ready"
        cd ..
        return 0
    else
        echo "❌ Failed to extract Ollama"
        cd ..
        return 1
    fi
}

# Function to start Ollama
start_ollama() {
    echo "🤖 Starting Ollama service..."
    
    # Kill any existing Ollama processes
    pkill -f ollama 2>/dev/null || true
    sleep 5
    
    # Start Ollama with better error handling
    cd ollama-bundle
    if [ -f "./ollama" ]; then
        nohup ./ollama serve > ollama.log 2>&1 &
        OLLAMA_PID=$!
        cd ..
        
        # Wait for Ollama to start with extended timeout
        echo "⏳ Waiting for Ollama to be ready..."
        for i in {1..60}; do
            if check_ollama; then
                echo "✅ Ollama is running successfully (PID: $OLLAMA_PID)"
                return 0
            fi
            echo "⏳ Attempt $i/60 - Waiting for Ollama..."
            sleep 3
        done
        
        echo "❌ Ollama failed to start after 3 minutes"
        cd ollama-bundle
        echo "Last 20 lines of Ollama log:"
        tail -n 20 ollama.log 2>/dev/null || echo "No log file found"
        cd ..
        return 1
    else
        echo "❌ Ollama binary not found"
        cd ..
        return 1
    fi
}

# Function to ensure Mistral model is available
ensure_mistral() {
    echo "📥 Ensuring Mistral model is available..."
    
    if [ -f "./ollama-bundle/ollama" ]; then
        cd ollama-bundle
        
        # Check if Mistral is available
        if ./ollama list 2>/dev/null | grep -q "mistral"; then
            echo "✅ Mistral model already available"
            cd ..
            return 0
        else
            echo "📥 Downloading Mistral model (this may take several minutes)..."
            
            # Set timeout for model download (20 minutes)
            timeout 1200 ./ollama pull mistral:latest
            if [ $? -eq 0 ]; then
                echo "✅ Mistral model downloaded successfully"
                cd ..
                return 0
            else
                echo "❌ Failed to download Mistral model or timed out"
                cd ..
                return 1
            fi
        fi
    else
        echo "❌ Ollama not available for model download"
        return 1
    fi
}

# Main startup sequence
echo "🔧 Starting CivicOS with AI service..."

# Step 1: Check if Ollama exists, download if not
if [ ! -f "./ollama-bundle/ollama" ]; then
    echo "📥 Ollama not found, downloading..."
    if download_ollama; then
        echo "✅ Ollama downloaded successfully"
    else
        echo "❌ Failed to download Ollama"
    fi
else
    echo "✅ Ollama already exists"
fi

# Step 2: Start Ollama if available
if [ -f "./ollama-bundle/ollama" ]; then
    if start_ollama; then
        # Step 3: Ensure Mistral is available
        if ensure_mistral; then
            echo "🎉 AI service is ready!"
            echo "📋 Available models:"
            cd ollama-bundle
            ./ollama list
            cd ..
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
export NODE_ENV=production
export RENDER=true
exec node dist/server/index.js 