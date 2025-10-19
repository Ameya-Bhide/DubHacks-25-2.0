#!/bin/bash

# Start the Flask AI service
echo "🚀 Starting Flask AI service..."
echo "📝 Make sure you have the required Python packages installed:"
echo "   pip install flask boto3 pyyaml"
echo ""
echo "🔧 Make sure your AWS credentials are configured for Bedrock access"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed or not in PATH"
    exit 1
fi

# Check if app.py exists
if [ ! -f "app.py" ]; then
    echo "❌ app.py not found in current directory"
    exit 1
fi

echo "✅ Starting Flask server on http://127.0.0.1:5000"
echo "🔄 The server will auto-reload when you make changes"
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

# Start the Flask server
python3 app.py
