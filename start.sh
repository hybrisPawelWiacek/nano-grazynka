#!/bin/bash

# nano-Grazynka Startup Script

set -e

echo "🚀 Starting nano-Grazynka..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your API keys:"
    echo "   - OPENAI_API_KEY or OPENROUTER_API_KEY"
    exit 1
fi

# Check for API keys
if ! grep -q "OPENAI_API_KEY=sk-" .env && ! grep -q "OPENROUTER_API_KEY=sk-" .env; then
    echo "⚠️  Warning: No valid API keys found in .env"
    echo "   Please add either OPENAI_API_KEY or OPENROUTER_API_KEY"
fi

# Create necessary directories
echo "📁 Creating data directories..."
mkdir -p data/uploads

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down

# Build and start containers
echo "🔨 Building containers..."
docker compose build

echo "▶️  Starting services..."
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 5

# Check health
echo "🔍 Checking service health..."
curl -s http://localhost:3101/health > /dev/null 2>&1 && echo "✅ Backend is healthy" || echo "❌ Backend health check failed"

echo ""
echo "🎉 nano-Grazynka is running!"
echo "   Frontend: http://localhost:3100"
echo "   Backend API: http://localhost:3101"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker compose logs -f"
echo "   Stop services: docker compose down"
echo "   Restart services: docker compose restart"