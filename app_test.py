import json
import os
from flask import Flask, request, jsonify

# --- Initialize Flask App ---
app = Flask(__name__)

# --- Mock AI Responses for Testing ---
MOCK_RESPONSES = {
    "getSummary": "This is a mock summary of your study materials. The content covers key concepts and important information that will help you understand the subject matter better.",
    "getQuestions": "What is the main topic discussed in the materials?\nHow does this concept relate to other topics?\nWhat are the key takeaways from this content?",
    "getFlashCards": "What is the definition of the main concept?\nThe primary definition\n\nWhat are the key characteristics?\nImportant features\n\nWhat is the purpose?\nMain objective",
    "getKeywords": ["concept", "topic", "key", "important", "main"],
    "search": ["document1.txt", "document2.txt"]
}

def create_success_response(data: dict):
    """Formats a 200 OK response for Flask."""
    response = jsonify(data)
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response, 200

def create_error_response(status_code: int, error_message: str):
    """Formats an error response for Flask."""
    response = jsonify({"error": error_message})
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response, status_code

@app.route("/api", methods=["POST"])
def api_handler():
    """
    Mock AI handler for testing without AWS credentials.
    """
    try:
        body = request.get_json()
        if not body:
             return create_error_response(400, "No JSON body provided.")

        action = body.get("action")
        if not action:
            return create_error_response(400, "No 'action' specified in request body.")

        print(f"🤖 Mock AI Request: {action}")

        # Return mock responses
        if action in MOCK_RESPONSES:
            if action == "search":
                return create_success_response({"results": MOCK_RESPONSES[action]})
            elif action == "getKeywords":
                return create_success_response({"keywords": MOCK_RESPONSES[action]})
            else:
                return create_success_response({"reply": MOCK_RESPONSES[action]})
        else:
            return create_error_response(400, f"Invalid 'action': {action}.")

    except Exception as e:
        return create_error_response(500, f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    print("🚀 Starting Mock AI service for testing...")
    print("📝 This version doesn't require AWS credentials")
    print("🔧 Make sure to configure AWS credentials for production use")
    app.run(debug=True, port=5000)
