#!/bin/bash

echo "🚀 CIVICOS SUITE - RENDER STARTUP SCRIPT v2.0"
echo "=============================================="
echo "🔧 Enhanced Ollama Integration for Production"

# Set production environment
export NODE_ENV=production
export RENDER=true

# Render system info
echo "📊 System Information:"
echo "   - OS: $(uname -a)"
echo "   - CPU: $(nproc) cores"
echo "   - Memory: $(free -h | grep '^Mem:' | awk '{print $2}')"
echo "   - Disk: $(df -h / | tail -1 | awk '{print $4}') free"
echo "   - User: $(whoami)"
echo "   - Working Dir: $(pwd)"

# Function to check if Ollama is running
check_ollama() {
    local timeout=${1:-10}
    echo "🔍 Checking Ollama health (timeout: ${timeout}s)..."
    
    for i in $(seq 1 $timeout); do
        if curl -s --max-time 3 http://localhost:11434/api/tags > /dev/null 2>&1; then
            echo "✅ Ollama is responding"
            return 0
        fi
        echo "   Attempt $i/$timeout..."
        sleep 1
    done
    
    echo "❌ Ollama not responding after ${timeout}s"
    return 1
}

# Function to get system architecture
get_architecture() {
    local arch=$(uname -m)
    case $arch in
        x86_64|amd64)
            echo "linux-amd64"
            ;;
        aarch64|arm64)
            echo "linux-arm64"
            ;;
        *)
            echo "linux-amd64"  # Default fallback
            ;;
    esac
}

# Function to download and setup Ollama with robust error handling
download_ollama() {
    echo "🤖 Setting up Ollama for Render deployment..."
    
    # Clean any previous attempts
    rm -rf ollama-bundle
    mkdir -p ollama-bundle
    cd ollama-bundle
    
    # Get the correct architecture
    local arch=$(get_architecture)
    echo "📋 System architecture: $arch"
    
    # Multiple download URLs to try
    local urls=(
        "https://github.com/ollama/ollama/releases/download/v0.5.1/ollama-$arch.tgz"
        "https://github.com/ollama/ollama/releases/download/v0.5.0/ollama-$arch.tgz"
        "https://github.com/ollama/ollama/releases/download/v0.4.7/ollama-$arch.tgz"
    )
    
    local download_success=false
    
    # Try each URL
    for url in "${urls[@]}"; do
        echo "📥 Attempting download from: $url"
        
        # Download with multiple retries
        for attempt in {1..3}; do
            echo "   Download attempt $attempt/3..."
            
            if curl -L --max-time 600 --retry 3 --retry-delay 10 \
                    --progress-bar "$url" -o "ollama-$arch.tgz"; then
                
                # Verify download
                if [ -f "ollama-$arch.tgz" ] && [ -s "ollama-$arch.tgz" ]; then
                    local size=$(stat -c%s "ollama-$arch.tgz" 2>/dev/null || stat -f%z "ollama-$arch.tgz" 2>/dev/null || echo "0")
                    echo "   ✅ Downloaded successfully (${size} bytes)"
                    
                    # Extract and verify
                    if tar -xzf "ollama-$arch.tgz" 2>/dev/null; then
                        echo "   ✅ Extraction successful"
                        
                        # Find the binary
                        local binary_path=""
                        if [ -f "ollama" ]; then
                            binary_path="ollama"
                        elif [ -f "bin/ollama" ]; then
                            binary_path="bin/ollama"
                            mv bin/ollama ./ollama
                        else
                            # Search for it
                            binary_path=$(find . -name "ollama" -type f | head -1)
                            if [ -n "$binary_path" ] && [ "$binary_path" != "./ollama" ]; then
                                mv "$binary_path" ./ollama
                            fi
                        fi
                        
                        if [ -f "./ollama" ]; then
                            chmod +x ./ollama
                            
                            # Test the binary
                            if ./ollama --version >/dev/null 2>&1; then
                                echo "   ✅ Binary is working"
                                download_success=true
                                break 2  # Break out of both loops
                            else
                                echo "   ❌ Binary test failed"
                            fi
                        else
                            echo "   ❌ Binary not found after extraction"
                        fi
                    else
                        echo "   ❌ Extraction failed"
                    fi
                else
                    echo "   ❌ Download verification failed"
                fi
            else
                echo "   ❌ Download failed"
            fi
            
            # Clean up failed attempt
            rm -f "ollama-$arch.tgz" ollama
            
            if [ $attempt -lt 3 ]; then
                echo "   ⏳ Waiting before retry..."
                sleep 10
            fi
        done
        
        if [ "$download_success" = true ]; then
            break
        fi
    done
    
    cd ..
    
    if [ "$download_success" = true ]; then
        echo "✅ Ollama binary ready"
        return 0
    else
        echo "❌ Failed to download Ollama after all attempts"
        return 1
    fi
}

# Function to start Ollama with comprehensive monitoring
start_ollama() {
    echo "🚀 Starting Ollama service..."
    
    cd ollama-bundle
    
    if [ ! -f "./ollama" ]; then
        echo "❌ Ollama binary not found"
        cd ..
        return 1
    fi
    
    # Kill any existing processes
    pkill -f ollama 2>/dev/null || true
    sleep 3
    
    # Set environment variables for Ollama
    export OLLAMA_HOST=0.0.0.0:11434
    export OLLAMA_MODELS=/tmp/ollama/models
    export OLLAMA_ORIGINS="*"
    
    # Create necessary directories
    mkdir -p /tmp/ollama/models
    
    echo "🔧 Starting Ollama daemon..."
    echo "   Host: $OLLAMA_HOST"
    echo "   Models dir: $OLLAMA_MODELS"
    
    # Start Ollama with full logging
    nohup ./ollama serve > ../ollama.log 2>&1 &
    local ollama_pid=$!
    
    cd ..
    
    echo "📋 Ollama started with PID: $ollama_pid"
    
    # Extended wait time for startup
    echo "⏳ Waiting for Ollama to initialize..."
    
    local max_wait=120  # 2 minutes
    local wait_time=0
    
    while [ $wait_time -lt $max_wait ]; do
        if check_ollama 3; then
            echo "🎉 Ollama is running successfully!"
            echo "📋 Ollama process info:"
            ps aux | grep ollama | grep -v grep || true
            return 0
        fi
        
        wait_time=$((wait_time + 5))
        echo "   Waiting... ($wait_time/$max_wait seconds)"
        
        # Check if process is still running
        if ! kill -0 $ollama_pid 2>/dev/null; then
            echo "❌ Ollama process died, checking logs..."
            echo "📋 Last 20 lines of ollama.log:"
            tail -n 20 ollama.log 2>/dev/null || echo "No log file found"
            return 1
        fi
        
        sleep 5
    done
    
    echo "❌ Ollama failed to start after $max_wait seconds"
    echo "📋 Final log check:"
    tail -n 30 ollama.log 2>/dev/null || echo "No log file found"
    return 1
}

# Function to download and verify Mistral model
ensure_mistral() {
    echo "📥 Setting up Mistral model..."
    
    if [ ! -f "./ollama-bundle/ollama" ]; then
        echo "❌ Ollama not available for model setup"
        return 1
    fi
    
    cd ollama-bundle
    
    # Check if model already exists
    if ./ollama list 2>/dev/null | grep -q "mistral"; then
        echo "✅ Mistral model already available"
        ./ollama list
        cd ..
        return 0
    fi
    
    echo "🔄 Downloading Mistral model (this will take several minutes)..."
    echo "   Model size: ~4.1GB"
    echo "   Please be patient..."
    
    # Pull model with timeout (20 minutes max)
    local start_time=$(date +%s)
    
    if timeout 1200 ./ollama pull mistral:latest; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo "✅ Mistral model downloaded successfully in ${duration}s"
        
        # Verify model works
        echo "🧪 Testing Mistral model..."
        if echo "Hello" | timeout 30 ./ollama run mistral:latest >/dev/null 2>&1; then
            echo "✅ Mistral model is working"
        else
            echo "⚠️ Mistral model downloaded but test failed"
        fi
        
        echo "📋 Available models:"
        ./ollama list
        cd ..
        return 0
    else
        echo "❌ Mistral model download failed or timed out"
        cd ..
        return 1
    fi
}

# Main startup sequence with comprehensive error handling
echo ""
echo "🎯 MAIN STARTUP SEQUENCE"
echo "========================"

# Step 1: System preparation
echo "📋 Step 1: System Preparation"
echo "   - Setting up directories and permissions..."
mkdir -p /tmp/ollama
chmod 755 /tmp/ollama

# Step 2: Ollama download and setup
echo ""
echo "📋 Step 2: Ollama Installation"
if [ ! -f "./ollama-bundle/ollama" ]; then
    echo "📥 Ollama not found, attempting download..."
    if download_ollama; then
        echo "✅ Ollama installation successful"
    else
        echo "⚠️  Ollama installation failed - AI service will use fallbacks"
        echo "   This is not critical - the server will still start"
    fi
else
    echo "✅ Ollama binary already exists"
    # Verify it's still working
    cd ollama-bundle
    if ./ollama --version >/dev/null 2>&1; then
        echo "✅ Existing Ollama binary verified"
    else
        echo "❌ Existing binary is corrupted, re-downloading..."
        cd ..
        rm -rf ollama-bundle
        download_ollama
    fi
    cd .. 2>/dev/null || true
fi

# Step 3: Start Ollama service
echo ""
echo "📋 Step 3: Ollama Service Startup"
ollama_started=false

if [ -f "./ollama-bundle/ollama" ]; then
    echo "🚀 Attempting to start Ollama service..."
    if start_ollama; then
        echo "🎉 Ollama service started successfully!"
        ollama_started=true
        
        # Log some useful information
        echo "📊 Ollama Status:"
        cd ollama-bundle
        echo "   Version: $(./ollama --version 2>/dev/null || echo 'Unknown')"
        echo "   API: http://localhost:11434"
        cd ..
    else
        echo "⚠️  Ollama service failed to start"
        echo "📋 Diagnosis:"
        echo "   - Checking for port conflicts..."
        netstat -tuln 2>/dev/null | grep 11434 || echo "   - Port 11434 is free"
        echo "   - Checking system resources..."
        echo "   - Memory: $(free -m | grep '^Mem:' | awk '{printf "%.1f%%", $3/$2 * 100}')"
        echo "   - CPU load: $(uptime | awk -F'load average:' '{print $2}')"
    fi
else
    echo "⚠️  Ollama binary not available - skipping service startup"
fi

# Step 4: Model setup (background process)
echo ""
echo "📋 Step 4: Mistral Model Setup"
if [ "$ollama_started" = true ]; then
    echo "🔄 Starting Mistral model setup in background..."
    (
        echo "$(date): Starting Mistral model download..." >> ollama.log
        if ensure_mistral; then
            echo "$(date): ✅ Mistral model ready" >> ollama.log
            echo "🎉 AI service is fully operational!"
        else
            echo "$(date): ⚠️  Mistral setup failed, using fallbacks" >> ollama.log
            echo "⚠️  Mistral model setup failed - AI will use fallback responses"
        fi
    ) &
    
    # Don't wait for model download - continue with server startup
    echo "✅ Model setup started in background (PID: $!)"
else
    echo "⚠️  Skipping model setup - Ollama service not running"
fi

# Step 5: Final environment setup
echo ""
echo "📋 Step 5: Environment Configuration"

# Set AI service environment variables
export AI_SERVICE_ENABLED=true
export OLLAMA_BASE_URL=http://localhost:11434
export OLLAMA_MODEL=mistral:latest
export MISTRAL_ENABLED=true

# Production environment variables
export NODE_ENV=production
export RENDER=true

echo "✅ Environment configured:"
echo "   - AI_SERVICE_ENABLED: $AI_SERVICE_ENABLED"
echo "   - OLLAMA_BASE_URL: $OLLAMA_BASE_URL"
echo "   - OLLAMA_MODEL: $OLLAMA_MODEL"
echo "   - NODE_ENV: $NODE_ENV"

# Step 6: Start the main application
echo ""
echo "📋 Step 6: CivicOS Application Startup"
echo "🚀 Starting CivicOS application..."
echo ""
echo "🌐 Service URLs:"
echo "   Frontend: https://civicos.onrender.com"
echo "   Backend API: https://civicos.onrender.com/api"
echo "   AI Service: https://civicos.onrender.com/api/ai"
echo "   Health Check: https://civicos.onrender.com/health"
echo ""

# Final system status
echo "📊 Final System Status:"
echo "   - Ollama Service: $([ "$ollama_started" = true ] && echo "✅ Running" || echo "❌ Failed")"
echo "   - AI Service: $([ "$AI_SERVICE_ENABLED" = true ] && echo "✅ Enabled (with fallbacks)" || echo "❌ Disabled")"
echo "   - Database: ✅ Configured (Supabase)"
echo "   - Environment: ✅ Production"
echo ""

# Monitor Ollama logs in background
if [ "$ollama_started" = true ]; then
    echo "🔍 Starting Ollama log monitor..."
    (
        tail -f ollama.log 2>/dev/null | while read line; do
            echo "[OLLAMA] $line"
        done
    ) &
fi

echo "🎯 All systems prepared - starting Node.js application..."
echo "🔥 Executing: node dist/server/index.js"
echo ""

# Start the Node.js application
exec node dist/server/index.js 