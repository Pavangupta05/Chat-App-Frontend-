#!/bin/bash
# Development startup script
# Ensures backend is running before starting the frontend

echo "🚀 Starting Chat Application..."

# Check if server is running
echo "📡 Checking backend server..."
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:5000"
else
    echo "⚠️  Backend not found at http://localhost:5000"
    echo "📝 Please start the backend first:"
    echo "   cd server && npm run dev"
fi

# Start frontend dev server
echo "🔧 Starting frontend dev server..."
npm run dev
