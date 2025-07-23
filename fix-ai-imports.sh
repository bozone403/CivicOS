#!/bin/bash

echo "🔧 Fixing AI service imports..."

# Fix all files that import callOllamaMistral
files=(
  "server/mediaCredibility.ts"
  "server/comprehensiveAnalytics.ts"
  "server/newsComparison.ts"
  "server/civicAI.ts"
  "server/revolutionaryNewsAggregator.ts"
  "server/comprehensiveNewsAnalyzer.ts"
)

for file in "${files[@]}"; do
  echo "Fixing $file..."
  
  # Replace import
  sed -i '' 's/import { callOllamaMistral } from '\''.*aiService\.js'\'';/import aiService from '\''.\/utils\/aiService\.js'\'';/g' "$file"
  
  # Replace function calls
  sed -i '' 's/callOllamaMistral(/aiService.generateResponse(/g' "$file"
  
  echo "✅ Fixed $file"
done

echo "🎉 All AI service imports fixed!" 