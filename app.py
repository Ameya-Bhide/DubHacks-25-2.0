import json
import os
import boto3
import yaml
from botocore.exceptions import ClientError
from flask import Flask, request, jsonify

# --- Initialize Flask App ---
app = Flask(__name__)

# --- AWS Bedrock Configuration (Copied from your Lambda) ---
REGION = os.environ.get("AWS_REGION", "us-east-1")
MODEL_ID = os.environ.get("MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")

print(f"Initializing Bedrock client in region: {REGION}...")
try:
    bedrock = boto3.client("bedrock-runtime", region_name=REGION)
    # Test credentials by making a small, non-existent call (or list models)
    # This will fail fast if credentials aren't set up.
    # A better check might be bedrock.list_foundation_models()
    print("Bedrock client initialized.")
except Exception as e:
    print(f"CRITICAL: Failed to initialize Bedrock client: {e}")
    print("Please ensure your AWS credentials (e.g., ~/.aws/credentials) are set up correctly.")
    # We'll let it fail later if Bedrock is called, but this is a good warning.


SYSTEM_PROMPT = """You are a small Bedrock agent who will write in a professional and educational manner."""

# --- Core Bedrock Function (Copied from your Lambda) ---
# (This function is unchanged)
def call_bedrock(messages: list, max_tokens=2048) -> str:
    """Invokes the Bedrock model with a list of messages."""
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "system": SYSTEM_PROMPT,
        "messages": messages,
        "max_tokens": max_tokens, # Increased for summaries/long replies
        "temperature": 0.2,
    }
    try:
        resp = bedrock.invoke_model(
            modelId=MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=json.dumps(body).encode("utf-8"),
        )
        payload = json.loads(resp["body"].read())
        
        # Find the text content in the response
        text = "".join([p.get("text","") for p in payload.get("content",[]) if p.get("type")=="text"])
        return text.strip()
        
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") == 'ThrottlingException':
            raise e
        print(f"ERROR: Bedrock call failed: {e}")
        raise Exception(f"Bedrock AWS Error: {e}")
    except Exception as e:
        print(f"ERROR: Bedrock payload parsing failed: {e}")
        raise Exception(f"Bedrock Response Error: {e}")


# --- API Response Helpers (MODIFIED FOR FLASK) ---

def create_success_response(data: dict):
    """Formats a 200 OK response for Flask."""
    response = jsonify(data)
    # Add the CORS header, just like the Lambda function
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response, 200

def create_error_response(status_code: int, error_message: str):
    """Formats an error response for Flask."""
    response = jsonify({"error": error_message})
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response, status_code

# --- Internal Business Logic Helpers (Copied from your Lambda) ---
# (These functions are unchanged)

def get_base_history(notes_content: str) -> list:
    """Creates the initial conversation history with the notes."""
    if not notes_content or not notes_content.strip():
        return []
    return [
        {"role": "user", "content": notes_content},
        {"role": "assistant", "content": "Okay, I have received the notes. What should I do with them?"}
    ]

def _get_keywords_internal(prompt: str) -> list:
    """Internal helper to get keywords. Calls Bedrock directly."""
    messages = [
        {"role": "user", "content": f"What key words and topics are associated with this? Separate all possible ones by new line, in order of relevance: {prompt}"}
    ]
    reply = call_bedrock(messages, max_tokens=500)
    keywords = [k.strip() for k in reply.split('\n') if k.strip()]
    return keywords

# --- UNIFIED API HANDLER (MODIFIED FOR FLASK) ---

@app.route("/api", methods=["POST"])
def api_handler():
    """
    Handles all API requests from the JavaScript frontend.
    This single endpoint mimics the API Gateway + Lambda setup.
    """
    try:
        # 1. Parse the request body from the JavaScript call
        # In Flask, we use request.get_json() instead of json.loads(event["body"])
        body = request.get_json()
        if not body:
             return create_error_response(400, "No JSON body provided.")

        action = body.get("action")

        if not action:
            return create_error_response(400, "No 'action' specified in request body.")

        # 2. Route the request based on the "action"
        # (The rest of this logic is copied *directly* from your handler)
        
        # --- Get Summary Action ---
        if action == "getSummary":
            notes_content = body.get("notesContent")
            if not notes_content:
                return create_error_response(400, "'notesContent' is required.")
            
            history = get_base_history(notes_content)
            prompt = """Can you generate a summary based on my notes? They must be about 30% the size of my notes. 
Avoid mentioning that you got this information from notes, and DO NOT under any circumstance put a beginning sentence describing your 
task. Make it flow and sound human-like."""
            
            messages = history + [{"role": "user", "content": prompt}]
            reply = call_bedrock(messages)
            return create_success_response({"reply": reply})

        # --- Get Questions Action ---
        elif action == "getQuestions":
            notes_content = body.get("notesContent")
            num = body.get("numQuestions")
            if not notes_content or not num:
                return create_error_response(400, "'notesContent' and 'numQuestions' are required.")
            
            history = get_base_history(notes_content)
            prompt = f"""Can you generate {num} exam style questions based on my notes? 
They must deal with 1 or 2 topics, 1-3 sentences, and 50-100 words. 
Each question should be separated. Do not number the questions in any way, they should only be separated by a new line.
Avoid mentioning that you got this information from notes, and 
DO NOT under any circumstance put a beginning sentence describing your task. Make it flow and sound human-like."""
            
            messages = history + [{"role": "user", "content": prompt}]
            reply = call_bedrock(messages)
            return create_success_response({"reply": reply})

        # --- Check Answer Action ---
        elif action == "checkAnswer":
            notes_content = body.get("notesContent")
            question = body.get("question")
            answer = body.get("answer")
            if not notes_content or not question or not answer:
                return create_error_response(400, "'notesContent', 'question', and 'answer' are required.")

            history = get_base_history(notes_content)
            prompt = f"""I have this generated question: {question}
My answer is: {answer}
First, check if my answer is correct by either typing 'yes' or 'no' on the first line.
Then, on a new line, give me some feedback on how to improve my answer. Do not fully agree with my answer, 
give good feedback that will help me write a better answer next time.
If the answer is instead similar to 'I don't know', give a clear and educational explanation of the correct answer."""
            messages = history + [{"role": "user", "content": prompt}]
            reply = call_bedrock(messages)
            return create_success_response({"reply": reply})

        # --- Get Flashcards Action ---
        elif action == "getFlashCards":
            notes_content = body.get("notesContent")
            num = body.get("numCards") # Renamed for clarity
            if not notes_content or not num:
                return create_error_response(400, "'notesContent' and 'numCards' are required.")

            history = get_base_history(notes_content)
            prompt = f"""Can you generate {num} flash cards based on my notes? 
Each flash card follows the same format: One small question of 1 sentence with 5-30 words. Difficulty should range from very easy to slightly hard.
Answers should be even shorter, 1-10 words that answer the question.
Types of questions to include are: true and false questions, definition questions, questions with 1 word answers
Questions and Answers should only take 1 line and alternate with a new line in between them. Do not number them.
Avoid mentioning that you got this information from notes, and 
DO NOT under any circumstance put a beginning sentence describing your task. Make it flow and sound human-like."""
            
            messages = history + [{"role": "user", "content": prompt}]
            reply = call_bedrock(messages)
            return create_success_response({"reply": reply})

        # --- Get Keywords Action ---
        elif action == "getKeywords":
            prompt_content = body.get("prompt")
            if not prompt_content:
                return create_error_response(400, "'prompt' is required.")
                
            keywords_list = _get_keywords_internal(prompt_content)
            return create_success_response({"keywords": keywords_list})

        # --- Search Action ---
        elif action == "search":
            search_prompt = body.get("prompt")
            yaml_content = body.get("yamlContent") 
            
            if not search_prompt or not yaml_content:
                return create_error_response(400, "'prompt' and 'yamlContent' are required.")
                
            keywords = _get_keywords_internal(search_prompt)
            
            try:
                data = yaml.safe_load(yaml_content) # Parse the string
                if not isinstance(data, dict):
                    raise ValueError("YAML content does not represent a valid search index.")
            except Exception as e:
                return create_error_response(400, f"Invalid or malformed YAML content: {e}")

            results = []
            seen_paths = set()
            for k in keywords:
                if not hasattr(data, 'items'):
                        return create_error_response(400, "Invalid YAML structure. Root must be a dictionary/map.")

                for file_path, info in data.items():
                    if file_path in seen_paths:
                        continue
                    
                    info_dict = info if isinstance(info, dict) else {}
                    
                    if k.lower() in info_dict.get("one_sentence", "").lower():
                        results.append(file_path)
                        seen_paths.add(file_path)
            
            return create_success_response({"results": results})

        # --- Invalid Action ---
        else:
            return create_error_response(400, f"Invalid 'action': {action}.")

    # --- Global Error Handling (Copied from your Lambda) ---
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") == 'ThrottlingException':
            return create_error_response(429, "The agent is being rate-limited by AWS. Please wait 30 seconds and try again.")
        else:
            return create_error_response(500, f"An AWS error occurred: {e}")
    except Exception as e:
        # This will catch errors from request.get_json() if body isn't valid JSON
        return create_error_response(500, f"An unexpected error occurred: {e}")

# --- Add this block to run the server ---
if __name__ == "__main__":
    # Runs the server on http://127.0.0.1:5000
    # debug=True means the server will auto-reload when you save the file
    app.run(debug=True, port=5000)