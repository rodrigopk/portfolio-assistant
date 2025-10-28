#!/bin/bash

# DevPortfolio AI - Setup Script
# This script helps verify and setup the development environment

set -e

echo "🚀 DevPortfolio AI Setup"
echo "======================="
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20 or higher is required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Check npm version
echo ""
echo "📦 Checking npm version..."
NPM_VERSION=$(npm -v | cut -d'.' -f1)
if [ "$NPM_VERSION" -lt 10 ]; then
    echo "⚠️  npm 10 or higher is recommended. Current version: $(npm -v)"
else
    echo "✅ npm version: $(npm -v)"
fi

# Check for .env file
echo ""
echo "🔐 Checking environment variables..."
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your configuration."
else
    echo "✅ .env file exists"
fi

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
npm install

# Setup Husky
echo ""
echo "🪝 Setting up Git hooks..."
npx husky install

# Create logs directory if it doesn't exist
echo ""
echo "📝 Creating logs directory..."
mkdir -p apps/api/logs

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your configuration (DATABASE_URL, API keys, etc.)"
echo "2. Start development server: npm run dev"
echo "3. Visit http://localhost:3001/api/health to verify the server is running"
echo ""
echo "For more information, see README.md"
