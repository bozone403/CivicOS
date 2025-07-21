#!/bin/bash

echo "🚀 CivicOS Render Deployment Script"

# Set production environment
export NODE_ENV=production

# Build the full application
echo "📦 Building application for Render..."
npm run build:full

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# Create a simple start script for Render
cat > start.sh << 'EOF'
#!/bin/bash
echo "Starting CivicOS on Render..."
NODE_ENV=production node dist/server/index.js
EOF

chmod +x start.sh

echo "🎯 Render Deployment Configuration:"
echo "✅ Backend URL: https://civicos.onrender.com"
echo "✅ Frontend URL: https://civicos.ca"
echo "✅ Database: Supabase (configured)"
echo "✅ Environment: Production"
echo ""
echo "📋 Next Steps:"
echo "1. Push this code to your Render repository"
echo "2. Ensure Render environment variables are set"
echo "3. Deploy on Render with start command: ./start.sh"
echo "4. Your app will be available at: https://civicos.ca" 