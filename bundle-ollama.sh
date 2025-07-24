#!/bin/bash

echo "🚀 BUNDLING OLLAMA WITH MISTRAL FOR RENDER"
echo "=========================================="

# Create ollama directory in the project
OLLAMA_DIR="./ollama-bundle"
mkdir -p $OLLAMA_DIR

echo "📥 Downloading Ollama binary..."

# Download Ollama for Linux (Render uses Linux)
if [ ! -f "$OLLAMA_DIR/ollama" ]; then
    echo "Downloading Ollama binary..."
    curl -L https://github.com/ollama/ollama/releases/latest/download/ollama-linux-amd64 -o $OLLAMA_DIR/ollama
    chmod +x $OLLAMA_DIR/ollama
    echo "✅ Ollama binary downloaded"
else
    echo "✅ Ollama binary already exists"
fi

echo "📥 Downloading Mistral model..."

# Create models directory
mkdir -p $OLLAMA_DIR/models

# Download Mistral model if not exists
if [ ! -d "$OLLAMA_DIR/models/mistral" ]; then
    echo "Downloading Mistral model (this may take a while)..."
    $OLLAMA_DIR/ollama pull mistral:latest
    echo "✅ Mistral model downloaded"
else
    echo "✅ Mistral model already exists"
fi

echo "📦 Creating bundle configuration..."

# Create a startup script for the bundled version
cat > $OLLAMA_DIR/start-ollama.sh << 'EOF'
#!/bin/bash

echo "🤖 Starting bundled Ollama..."

# Set Ollama home to our bundle directory
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_ORIGINS=*

# Start Ollama from the bundle
./ollama serve > /dev/null 2>&1 &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to be ready..."
for i in {1..30}; do
    if curl -s --max-time 5 http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Bundled Ollama is running successfully"
        echo "📋 Available models:"
        ./ollama list
        exit 0
    fi
    echo "⏳ Attempt $i/30 - Waiting for Ollama..."
    sleep 2
done

echo "❌ Bundled Ollama failed to start"
exit 1
EOF

chmod +x $OLLAMA_DIR/start-ollama.sh

echo "✅ Ollama bundle created successfully!"
echo "📁 Bundle location: $OLLAMA_DIR"
echo "🚀 Ready for Render deployment!" 