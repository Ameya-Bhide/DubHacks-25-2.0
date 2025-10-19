# AI Integration Setup Guide

This guide explains how to set up and use the AI Study Tools integration with your Flask AI service.

## 🚀 Quick Start

### 1. Install Python Dependencies

```bash
pip install flask boto3 pyyaml
```

### 2. Configure AWS Credentials

Make sure your AWS credentials are configured for Bedrock access:

```bash
# Option 1: AWS CLI
aws configure

# Option 2: Environment variables
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1
```

### 3. Start the AI Service

```bash
# Option 1: Use the provided script
./start-ai-service.sh

# Option 2: Run directly
python3 app.py
```

The Flask server will start on `http://127.0.0.1:5000`

### 4. Start the Next.js App

In a separate terminal:

```bash
npm run dev
```

## 🎯 How It Works

### AI Study Tools Integration

1. **Click any AI tool** (Flashcards, Summaries, Practice Questions, Search)
2. **Select study groups** from your uploaded documents
3. **Add optional query** for specific focus areas
4. **Click Generate** to create AI content

### Supported AI Actions

- **Flashcards**: Generates 10 flashcards with questions and answers
- **Summaries**: Creates concise summaries (30% of original content)
- **Practice Questions**: Generates 5 exam-style questions
- **Search**: Finds relevant content using keyword matching

### Document Processing

The system automatically:
- Extracts content from selected study groups
- Combines document descriptions and metadata
- Sends formatted content to the AI service
- Displays results in a clean modal interface

## 🔧 Configuration

### Environment Variables

You can customize the AI service URL by setting:

```bash
export AI_SERVICE_URL=http://your-custom-url:5000/api
```

### AI Service Parameters

The system automatically sets appropriate parameters:
- **Flashcards**: 10 cards
- **Practice Questions**: 5 questions
- **Summaries**: 30% size reduction
- **Search**: Keyword-based matching

## 🐛 Troubleshooting

### Common Issues

1. **"AI service error"**: Make sure the Flask server is running
2. **"AWS credentials not valid"**: Check your AWS configuration
3. **"No documents found"**: Upload some documents first
4. **"Bedrock access denied"**: Ensure your AWS account has Bedrock permissions

### Debug Mode

Check the browser console and terminal for detailed error messages.

## 📝 API Endpoints

### Next.js API Route
- `POST /api/ai-tools` - Calls the Flask AI service

### Flask AI Service
- `POST /api` - Main AI processing endpoint
  - Actions: `getSummary`, `getQuestions`, `getFlashCards`, `search`

## 🎨 UI Features

- **Loading states** with spinner animations
- **Study group selection** with document counts
- **Query input** for custom instructions
- **Result modal** with formatted output
- **Error handling** with user-friendly messages

## 🔄 Workflow

1. User clicks AI tool → Study group selection modal opens
2. User selects groups and adds query → Generate button enabled
3. System extracts document content → Calls AI service
4. AI processes content → Returns formatted result
5. Result displayed in modal → User can close and try again

The integration is now complete and ready to use! 🎉
