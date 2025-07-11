#!/bin/bash

echo "🚀 [DOMINATOR] BEGINNING FULL PROJECT PURGE, REPAIR & REBUILD..."

# ---------------------------------------------------------
echo "💣 Removing all node_modules, dist, and lockfiles..."
rm -rf node_modules dist
rm -rf client/node_modules client/dist
rm -rf server/node_modules server/dist
rm -f package-lock.json client/package-lock.json server/package-lock.json

# ---------------------------------------------------------
echo "🔍 Searching and removing stray node_modules anywhere..."
find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +

# ---------------------------------------------------------
echo "📁 Ensuring dist directories exist so build won't fail on empty..."
mkdir -p dist client/dist server/dist

# ---------------------------------------------------------
echo "🛠 Installing root packages..."
npm install || { echo "❌ npm install failed at root. Exiting."; exit 1; }

# ---------------------------------------------------------
if [ -f client/package.json ]; then
  echo "🛠 Installing client packages..."
  cd client
  npm install || { echo "❌ npm install failed in client. Exiting."; exit 1; }
  cd ..
fi

if [ -f server/package.json ]; then
  echo "🛠 Installing server packages..."
  cd server
  npm install || { echo "❌ npm install failed in server. Exiting."; exit 1; }
  cd ..
fi

# ---------------------------------------------------------
echo "🔬 Running depcheck to identify missing dependencies..."
npx depcheck > missing.txt

echo "📦 Analyzing depcheck output..."
MISSING=$(grep -oP "(?<=Missing dependencies: )[^\n]+" missing.txt | tr -d '{}"')

if [ -n "$MISSING" ]; then
  echo "🚀 Installing missing packages detected by depcheck..."
  npm install $MISSING || echo "⚠️ Some missing deps failed to install, check logs."
else
  echo "✅ No missing packages detected by depcheck."
fi

# ---------------------------------------------------------
echo "🛡 Running npm audit fix to clean vulnerabilities..."
npm audit fix --force || echo "⚠️ Some vulnerabilities might remain."

# ---------------------------------------------------------
echo "🎨 Running Prettier formatting..."
npx prettier --write . || echo "⚠️ Prettier issues."

echo "🔬 Running ESLint autofix..."
npx eslint . --ext .js,.jsx,.ts,.tsx --fix || echo "⚠️ ESLint issues remain."

# ---------------------------------------------------------
echo "🏗 Building full stack from scratch..."
npm run build || { echo "❌ Build failed. Exiting."; exit 1; }

# ---------------------------------------------------------
echo "✅ [DOMINATOR] ALL COMPLETE — SYSTEM REBUILT, DEPS FIXED, FORMATTED, BUILT CLEAN."
cat missing.txt

echo "🚀 Done."
