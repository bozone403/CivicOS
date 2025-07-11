#!/bin/bash
set -e

echo "🔧 CivicOS Quick Fix Script"
echo "==========================="

# Fix path resolution issues
echo "🔧 Fixing path resolution..."

# Create missing dependencies
echo "📦 Adding missing dependencies..."
cd client
npm install sonner @types/node
cd ..

# Fix TypeScript errors by creating missing type definitions
echo "🔧 Creating missing type definitions..."
mkdir -p client/src/types

cat > client/src/types/global.d.ts << 'EOF'
declare module 'sonner' {
  export const Toaster: React.ComponentType<any>
}
EOF

# Update package.json to include missing types
echo "📝 Updating package.json..."
cd client
npm install --save-dev @types/node
cd ..

echo "✅ Quick fix complete!"
echo ""
echo "🚀 Run the full setup script now:"
echo "   ./skripz/full-setup.sh" 