#!/bin/bash

echo "🚀 CivicOS Render Deployment Script with Free AI Service (Render-Only)"

# Set production environment
export NODE_ENV=production
export RENDER=true

# Build the full application
echo "📦 Building application for Render..."
npm run build:full

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# Initialize Ollama for Render backend only
echo "🤖 Setting up Ollama for Render backend (never local)..."
npm run init:ollama

# Create a start script for Render with Ollama
cat > start.sh << 'EOF'
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
EOF

chmod +x start.sh

echo "🎯 Render Deployment Configuration:"
echo "✅ Backend URL: https://civicos.onrender.com"
echo "✅ Frontend URL: https://civicos.ca"
echo "✅ Database: Supabase (configured)"
echo "✅ Environment: Production (Render-only)"
echo "✅ Free AI Service: Ollama (Render backend only)"
echo "✅ Local Development: Disabled (uses fallback responses)"
echo ""
echo "🤖 Free AI Service Endpoints (Render only):"
echo "   - Chat: /api/ai/chat"
echo "   - News Analysis: /api/ai/analyze-news"
echo "   - Policy Analysis: /api/ai/analyze-policy"
echo "   - Civic Insights: /api/ai/civic-insights"
echo "   - Health Check: /api/ai/health"
echo ""
echo "📋 Next Steps:"
echo "1. Push this code to your Render repository"
echo "2. Ensure Render environment variables are set"
echo "3. Deploy on Render with start command: ./start.sh"
echo "4. Your app will be available at: https://civicos.ca"
echo ""
echo "⚠️  Important: Ollama will only run on Render backend"
echo "   Local development will use fallback responses" 