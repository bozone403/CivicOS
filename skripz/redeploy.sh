#!/bin/bash
set -e

echo "💣 Killing rogue Node processes..."
pkill -f node || echo "No rogue node processes."

echo "🧹 Cleaning up node_modules & lock files..."
rm -rf node_modules package-lock.json

echo "📦 Installing fresh dependencies..."
npm install

echo "🔥 Building project..."
npm run build

echo "🌳 Initializing git if needed..."
git rev-parse --is-inside-work-tree || git init

echo "➕ Adding all files..."
git add .

echo "✍️ Committing..."
git commit -m "Force redeploy: $(date)" || echo "No changes to commit."

echo "🚀 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo "🔄 Deploying to Vercel..."
vercel --prod

echo "✅ All done!"
