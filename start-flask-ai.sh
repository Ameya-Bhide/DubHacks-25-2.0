#!/bin/bash

echo "🚀 Starting Flask AI Service with AWS Bedrock"
echo "📁 Loading credentials from .env.local file..."
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create a .env.local file with the following variables:"
    echo "FLASK_AWS_ACCESS_KEY_ID=your_access_key_here"
    echo "FLASK_AWS_SECRET_ACCESS_KEY=your_secret_key_here"
    echo "FLASK_AWS_DEFAULT_REGION=us-east-1"
    exit 1
fi

# Check if required credentials are in .env.local
if ! grep -q "FLASK_AWS_ACCESS_KEY_ID" .env.local; then
    echo "❌ Error: FLASK_AWS_ACCESS_KEY_ID not found in .env.local"
    exit 1
fi

if ! grep -q "FLASK_AWS_SECRET_ACCESS_KEY" .env.local; then
    echo "❌ Error: FLASK_AWS_SECRET_ACCESS_KEY not found in .env.local"
    exit 1
fi

echo "✅ .env.local file found and contains required credentials"
echo "🔧 Starting Flask service on port 5004..."
echo ""

# Start the Flask service
python3 app.py
