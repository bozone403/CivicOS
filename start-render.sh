#!/bin/bash

echo "🚀 Starting CivicOS..."

# Check if we're in production
if [ "$NODE_ENV" = "production" ]; then
    echo "🏭 Production environment detected"
    
    # Try to start Ollama if available (but don't fail if it doesn't work)
    if command -v ollama &> /dev/null; then
        echo "🤖 Ollama found, attempting to start..."
        
        # Start Ollama in background
        OLLAMA_HOST=0.0.0.0:11434 ollama serve &
        OLLAMA_PID=$!
        
        # Wait a bit for Ollama to start
        sleep 5
        
        # Check if Ollama is responding
        if curl -s http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
            echo "✅ Ollama started successfully"
            
            # Check for Mistral model
            if ollama list | grep -q "mistral"; then
                echo "✅ Mistral model available"
            else
                echo "📥 Downloading Mistral model..."
                ollama pull mistral:latest &
            fi
        else
            echo "⚠️  Ollama failed to start - continuing without AI service"
            # Kill the background process if it exists
            if [ ! -z "$OLLAMA_PID" ]; then
                kill $OLLAMA_PID 2>/dev/null || true
            fi
        fi
    else
        echo "⚠️  Ollama not found - continuing without AI service"
    fi
else
    echo "🔧 Development environment detected"
fi

# Start the Node.js application
echo "🌐 Starting CivicOS application..."
exec node dist/server/index.js 