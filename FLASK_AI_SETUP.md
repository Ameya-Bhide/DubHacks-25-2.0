# Flask AI Service Setup

This document explains how to set up and run the Flask AI service that powers the AI Study Tools.

## Prerequisites

1. **Python 3.7+** installed
2. **Required Python packages:**
   ```bash
   pip install flask boto3 pyyaml pdfplumber PyPDF2 python-dotenv
   ```

## Setup Instructions

### 1. Configure AWS Credentials

The Flask service reads AWS credentials from the `.env.local` file. Add these variables to your `.env.local` file:

```bash
# Flask AI Service AWS Credentials
FLASK_AWS_ACCESS_KEY_ID=your_access_key_here
FLASK_AWS_SECRET_ACCESS_KEY=your_secret_key_here
FLASK_AWS_DEFAULT_REGION=us-east-1
```

**Note:** These are different from your main AWS credentials (which use `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`). The Flask-specific credentials use the `FLASK_` prefix to avoid conflicts.

### 2. Run the Flask Service

#### Option A: Using the startup script (Recommended)
```bash
./start-flask-ai.sh
```

#### Option B: Direct Python command
```bash
python3 app.py
```

#### Option C: Manual environment setup
```bash
export FLASK_AWS_ACCESS_KEY_ID=your_access_key_here
export FLASK_AWS_SECRET_ACCESS_KEY=your_secret_key_here
export FLASK_AWS_DEFAULT_REGION=us-east-1
python3 app.py
```

## Verification

The Flask service should start on `http://localhost:5004`. You can verify it's working by:

1. **Check the startup logs** - You should see:
   ```
   Initializing Bedrock client in region: us-east-1...
   Using AWS Access Key ID: AKIAXU4IM...
   Bedrock client initialized successfully with credentials from .env.local
   * Running on http://127.0.0.1:5004
   ```

2. **Test the API endpoint:**
   ```bash
   curl -X POST http://localhost:5004/api \
     -H "Content-Type: application/json" \
     -d '{"action": "getKeywords", "prompt": "test"}'
   ```

## AWS Permissions Required

Your AWS credentials need the following permissions:
- `bedrock:InvokeModel` - To call AWS Bedrock
- Access to the specific model: `anthropic.claude-3-haiku-20240307-v1:0`

## Troubleshooting

### "ModuleNotFoundError: No module named 'dotenv'"
```bash
pip install python-dotenv
```

### "CRITICAL: Failed to initialize Bedrock client"
- Check that your AWS credentials are correct in `.env.local`
- Verify the credentials have the required Bedrock permissions
- Ensure the region is set to `us-east-1`

### "Port 5004 is in use"
```bash
# Find and kill the process using port 5004
lsof -ti:5004 | xargs kill -9
```

## Integration with Next.js App

The Next.js application automatically connects to the Flask service at `http://localhost:5004` when using AI Study Tools. No additional configuration is needed in the Next.js app.

## Security Notes

- Never commit `.env.local` to version control
- Use different AWS credentials for different environments
- Consider using AWS IAM roles for production deployments
