#!/bin/bash

# LearnPath - Setup Validation Script
# This script validates that the application can be started from scratch

echo "🔍 LearnPath - Setup Validation"
echo "==============================="

ERRORS=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1 exists"
    else
        echo "❌ $1 missing"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo "✅ $1/ directory exists"
    else
        echo "❌ $1/ directory missing"
        ERRORS=$((ERRORS + 1))
    fi
}

echo ""
echo "📋 Checking essential configuration files..."
check_file "backend/env.example"
check_file "frontend/.env.example"
check_file "backend/requirements.txt"
check_file "backend/pyproject.toml"
check_file "frontend/package.json"
check_file "frontend/tsconfig.json"
check_file "frontend/vite.config.ts"
check_file "backend/main.py"
check_file "README.md"
check_file ".gitignore"
check_file "start.sh"

echo ""
echo "📁 Checking essential directories..."
check_dir "backend"
check_dir "frontend"
check_dir "backend/app"
check_dir "backend/prompts"
check_dir "backend/data"
check_dir "backend/logs"
check_dir "frontend/src"

echo ""
echo "🤖 Checking AI prompt files..."
check_file "backend/prompts/study_plan_generation.txt"
check_file "backend/prompts/custom_questions_generation.txt"
check_file "backend/prompts/adaptive_questions_generation.txt"
check_file "backend/prompts/programming_question_evaluation.txt"

echo ""
echo "🐍 Checking Python source files..."
check_file "backend/app/__init__.py"
check_file "backend/main.py"
check_file "backend/app/database.py"
check_file "backend/app/config.py"

echo ""
echo "⚛️ Checking React source files..."
check_file "frontend/src/main.tsx"
check_file "frontend/src/LearnPathApp.tsx"
check_file "frontend/src/services/learningApiService.ts"

echo ""
echo "📦 Checking package management files..."
if [ -f "backend/uv.lock" ]; then
    echo "✅ backend/uv.lock exists (uv package manager)"
elif [ -f "backend/requirements.txt" ]; then
    echo "✅ backend/requirements.txt exists (pip package manager)"
else
    echo "❌ No Python package management file found"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "frontend/package-lock.json" ]; then
    echo "✅ frontend/package-lock.json exists (npm)"
elif [ -f "frontend/yarn.lock" ]; then
    echo "✅ frontend/yarn.lock exists (yarn)"
else
    echo "⚠️  No frontend lock file found (will be created on npm install)"
fi

echo ""
echo "🔒 Checking that sensitive files are properly ignored..."
if [ -f "backend/.env" ]; then
    echo "⚠️  backend/.env exists (should be ignored by git)"
else
    echo "✅ backend/.env not present (will be created from example)"
fi

if [ -f "frontend/.env" ]; then
    echo "⚠️  frontend/.env exists (should be ignored by git)"
else
    echo "✅ frontend/.env not present (will be created from example)"
fi

echo ""
echo "📊 Validation Summary"
echo "===================="

if [ $ERRORS -eq 0 ]; then
    echo "🎉 All checks passed! The application should work from scratch."
    echo ""
    echo "🚀 To get started:"
    echo "1. Run: ./start.sh"
    echo "2. Edit backend/.env and add your GEMINI_API_KEY"
    echo "3. Start backend: cd backend && python main.py"
    echo "4. Start frontend: cd frontend && npm run dev"
    exit 0
else
    echo "❌ Found $ERRORS issues that need to be fixed."
    echo ""
    echo "🔧 Common fixes:"
    echo "- Ensure all source files are committed to git"
    echo "- Check that .gitignore is not ignoring essential files"
    echo "- Verify directory structure is complete"
    exit 1
fi
