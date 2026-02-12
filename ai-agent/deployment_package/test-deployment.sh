#!/bin/bash
# Pre-deployment test script
# Run this before deploying to ensure everything works

set -e  # Exit on error

echo "🧪 AccreditEx AI Agent - Pre-Deployment Tests"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "main.py" ]; then
    echo "❌ Error: main.py not found. Run this script from ai-agent/deployment_package/"
    exit 1
fi

# Check Python version
echo "📋 Checking Python version..."
python --version

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment (Linux/Mac)
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    # Windows Git Bash
    source venv/Scripts/activate
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pip install -q -r requirements.txt

# Run tests
echo ""
echo "🧪 Running tests..."
pytest -v --tb=short

# Check if all tests passed
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests passed!"
else
    echo ""
    echo "❌ Tests failed. Fix errors before deploying."
    exit 1
fi

# Test server startup (quick check)
echo ""
echo "🚀 Testing server startup..."
timeout 5s python main.py &
SERVER_PID=$!
sleep 3

# Check if server is running
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Server started successfully"
    kill $SERVER_PID
else
    echo "❌ Server failed to start"
    exit 1
fi

# Summary
echo ""
echo "=============================================="
echo "✅ Pre-deployment checks complete!"
echo ""
echo "Next steps:"
echo "1. Set environment variables in Render.com"
echo "2. Deploy to Render.com"
echo "3. Verify health endpoint after deployment"
echo ""
echo "See DEPLOYMENT_GUIDE.md for detailed instructions"
