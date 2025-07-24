#!/bin/bash

echo "🚀 SETTING UP OLLAMA FOR RENDER"
echo "================================"

# Create ollama directory
mkdir -p ollama-bundle
cd ollama-bundle

echo "📥 Downloading Ollama binary..."

# Download Ollama for Linux
curl -L https://github.com/ollama/ollama/releases/download/v0.9.6/ollama-linux-amd64.tgz -o ollama-linux-amd64.tgz

if [ $? -eq 0 ]; then
    echo "✅ Ollama binary downloaded successfully"
    
    # Extract the binary
    echo "📦 Extracting Ollama binary..."
    tar -xzf ollama-linux-amd64.tgz
    
    # Make it executable
    chmod +x ollama
    
    # Clean up the archive
    rm ollama-linux-amd64.tgz
    
    echo "✅ Ollama binary extracted and ready"
else
    echo "❌ Failed to download Ollama binary"
    exit 1
fi

echo "📥 Downloading Mistral model..."

# Download Mistral model
./ollama pull mistral:latest

if [ $? -eq 0 ]; then
    echo "✅ Mistral model downloaded successfully"
else
    echo "❌ Failed to download Mistral model"
    exit 1
fi

cd ..

echo "🎉 Ollama setup complete!"
echo "📁 Bundle location: ./ollama-bundle"
echo "🚀 Ready for deployment!" 