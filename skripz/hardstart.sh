#!/bin/bash

PORT=5050

echo "💣 Killing all rogue Node processes..."
pkill -f node || true

echo "🔍 Checking port $PORT status..."
if lsof -i :$PORT; then
  echo "⚠️ Port $PORT is STILL IN USE, force killing again..."
  pkill -f node
else
  echo "✅ Port $PORT is clean."
fi

echo "🔥 Removing old builds..."
rm -rf dist client/dist

echo "🚀 Building fresh client and server..."
npm run build

echo "✅ Starting production server on port $PORT..."
npm start &

sleep 2
echo "🎯 Checking server responsiveness..."
curl -I http://localhost:$PORT

echo "
██████╗  █████╗ ██████╗ ██████╗ ███████╗███████╗
██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔════╝
██████╔╝███████║██████╔╝██████╔╝█████╗  ███████╗
██╔═══╝ ██╔══██║██╔═══╝ ██╔═══╝ ██╔══╝  ╚════██║
██║     ██║  ██║██║     ██║     ███████╗███████║
╚═╝     ╚═╝  ╚═╝╚═╝     ╚═╝     ╚══════╝╚══════╝
            DOMINION SYSTEM LIVE
"

