#!/bin/bash

# LearnPath - Quick Start Script
# This script helps you get the application running from scratch

echo "🚀 LearnPath - AI-Powered Learning Management System"
echo "=================================================="

# Check if this is a fresh clone
if [ ! -f "backend/.env" ]; then
    echo "📋 Setting up environment files..."
    
    # Copy environment example files
    if [ -f "backend/env.example" ]; then
        cp backend/env.example backend/.env
        echo "✅ Created backend/.env from env.example"
        echo "⚠️  Please edit backend/.env and add your GEMINI_API_KEY"
    else
        echo "❌ backend/env.example not found!"
        exit 1
    fi
    
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
        echo "✅ Created frontend/.env from .env.example"
    else
        echo "❌ frontend/.env.example not found!"
        exit 1
    fi
else
    echo "✅ Environment files already exist"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/data
mkdir -p backend/logs
mkdir -p backend/data/uploads
echo "✅ Directories created"

# Backend setup
echo "🐍 Setting up Python backend..."
cd backend

# Check if uv is installed
if command -v uv &> /dev/null; then
    echo "✅ uv package manager found"
    uv sync
    echo "✅ Backend dependencies installed with uv"
else
    echo "⚠️  uv not found, using pip instead"
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
        echo "✅ Backend dependencies installed with pip"
    else
        echo "❌ requirements.txt not found!"
        exit 1
    fi
fi

cd ..

# Frontend setup
echo "⚛️ Setting up React frontend..."
cd frontend

# Check if npm is installed
if command -v npm &> /dev/null; then
    echo "✅ npm found"
    npm install
    echo "✅ Frontend dependencies installed"
else
    echo "❌ npm not found! Please install Node.js and npm"
    exit 1
fi

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit backend/.env and add your GEMINI_API_KEY"
echo "2. Start the backend: cd backend && python main.py"
echo "3. Start the frontend: cd frontend && npm run dev"
echo ""
echo "🌐 Application will be available at:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo ""
echo "📚 For more information, see README.md"
