#!/bin/bash

echo "🧹 Cleaning up CivicOS project..."

# Remove empty directories
rm -rf public
rm -rf src
rm -rf skripz
rm -rf attached_assets

# Remove .DS_Store files
find . -name ".DS_Store" -delete

# Remove .vercel directory (will be recreated)
rm -rf .vercel

echo "✅ Cleanup complete!"
echo ""
echo "📁 Core files remaining:"
echo "- server/ (backend services)"
echo "- client/ (frontend React app)"
echo "- dist/ (built frontend)"
echo "- migrations/ (database schema)"
echo "- shared/ (shared types)"
echo "- deploy-node18.sh (deployment script)"
echo "- vercel.json (Vercel config)"
echo "- package.json (dependencies)"
echo ""
echo "🎯 Ready for deployment!" 