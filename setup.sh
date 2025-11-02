#!/bin/bash

# Pipeline Visualizer 2.0 Setup Script

echo "🚀 Setting up Pipeline Visualizer 2.0..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup backend
echo "📦 Setting up backend..."
cd backend
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Created .env file. Please edit it with your Jenkins credentials."
else
    echo "ℹ️  .env file already exists."
fi
npm install
cd ..

# Setup frontend
echo "📦 Setting up frontend..."
cd frontend
npm install
cd ..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your Jenkins credentials"
echo "2. Run 'npm run dev' to start both frontend and backend"
echo "3. Or use 'docker-compose up' for Docker deployment"

