#!/bin/bash
set -e

echo "🧪 Testing build locally..."
echo ""

echo "📦 Installing dependencies..."
npm ci

echo ""
echo "✨ Checking code formatting..."
npx biome ci .

echo ""
echo "🏗️  Building desktop app..."
cd apps/desktop
npm run make

echo ""
echo "✨ Build successful!"
echo ""
echo "Build artifacts:"
find out/make -type f 2>/dev/null || echo "No artifacts found"
