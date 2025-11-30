#!/bin/bash

# Deployment script for Coolify
set -e

echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project root directory."
    exit 1
fi

# Build and test locally before deploying
echo "🔨 Building and testing locally..."

# Build frontend
echo "📦 Building frontend..."
npm run build

# Test backend
echo "🧪 Testing backend..."
cd backend
npm test --passWithNoTests
cd ..

echo "✅ Local build and tests passed!"

# Push to git (assuming Coolify is watching the repository)
echo "📤 Pushing to repository..."
git add .
git status

echo "💡 Manual steps required:"
echo "1. Commit and push your changes to the repository"
echo "2. In Coolify:"
echo "   - Set up two applications (frontend and backend)"
echo "   - Configure environment variables from .env.production"
echo "   - Set up domains"
echo "   - Deploy both services"
echo ""
echo "3. Follow the COOLIFY_DEPLOYMENT_GUIDE.md for detailed instructions"

echo "🎉 Deployment preparation complete!"