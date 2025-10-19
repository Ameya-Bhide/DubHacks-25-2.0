import json
import os
import boto3
import yaml  # Make sure to include this in your Lambda deployment package
from botocore.exceptions import ClientError

# --- AWS Bedrock Configuration ---
REGION = os.environ.get("AWS_REGION", "us-east-1") 
MODEL_ID = os.environ.get("MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")

print(f"Initializing Bedrock client in region: {REGION}...")
bedrock = boto3.client("bedrock-runtime", region_name=REGION)

SYSTEM_PROMPT = """You are a small Bedrock agent who will write in a professional and educational manner."""

# This is the path to your search index file *within* the Lambda package.
# You must include this YAML file in the .zip file you upload to Lambda.
SEARCH_INDEX_FILE = 'search_index.yaml' 

# --- Core Bedrock Function ---

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
        # Re-raise throttled exceptions to be caught by the handler
        if e.response.get("Error", {}).get("Code") == 'ThrottlingException':
            raise e
        # Log other errors and raise a more generic one
        print(f"ERROR: Bedrock call failed: {e}")
        raise Exception(f"Bedrock AWS Error: {e}")
    except Exception as e:
        print(f"ERROR: Bedrock payload parsing failed: {e}")
        raise Exception(f"Bedrock Response Error: {e}")


# --- API Response Helpers ---

def create_success_response(data: dict) -> dict:
    """Formats a 200 OK response for API Gateway."""
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*" # Allows cross-origin requests
        },
        "body": json.dumps(data)
    }

def create_error_response(status_code: int, error_message: str) -> dict:
    """Formats an error response for API Gateway."""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps({"error": error_message})
    }

# --- Internal Business Logic Helpers ---

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
    # Note: This function does NOT use history
    messages = [
        {"role": "user", "content": f"What key words and topics are associated with this? Separate all possible ones by new line, in order of relevance: {prompt}"}
    ]
    reply = call_bedrock(messages, max_tokens=500)
    # Split the newline-separated string into a clean list
    keywords = [k.strip() for k in reply.split('\n') if k.strip()]
    return keywords

# --- UNIFIED API HANDLER ---
# This is the ONLY entry point for your Lambda function.

def handler(event, context):
    """
    Handles all API requests from the JavaScript frontend.
    
    Expects a JSON body with an "action" key.
    """
    try:
        # 1. Parse the request body from the JavaScript call
        body = json.loads(event.get("body") or "{}")
        action = body.get("action")

        if not action:
            return create_error_response(400, "No 'action' specified in request body.")

        # 2. Route the request based on the "action"
        
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
                
            # This action doesn't use history, it just gets keywords for a prompt
            keywords_list = _get_keywords_internal(prompt_content)
            # Return the keywords as a JSON list
            return create_success_response({"keywords": keywords_list})

        # --- Search Action ---
        elif action == "search":
            search_prompt = body.get("prompt")
            # --- NEW: Get the YAML content as a string ---
            yaml_content = body.get("yamlContent") 
            
            if not search_prompt or not yaml_content:
                return create_error_response(400, "'prompt' and 'yamlContent' are required.")
                
            # 1. Get keywords for the search prompt
            keywords = _get_keywords_internal(search_prompt)
            
            # 2. Load the search index from the provided YAML string
            try:
                data = yaml.safe_load(yaml_content) # Parse the string
                if not isinstance(data, dict):
                    # Ensure the YAML is in the expected format (a dictionary)
                    raise ValueError("YAML content does not represent a valid search index.")
            except Exception as e:
                return create_error_response(400, f"Invalid or malformed YAML content: {e}")

            # 3. Perform the search (This logic is unchanged)
            results = []
            seen_paths = set()
            for k in keywords:
                # Make sure data.items() is valid
                if not hasattr(data, 'items'):
                     return create_error_response(400, "Invalid YAML structure. Root must be a dictionary/map.")

                for file_path, info in data.items():
                    if file_path in seen_paths:
                        continue
                    
                    # Ensure 'info' is a dictionary as expected
                    info_dict = info if isinstance(info, dict) else {}
                    
                    if k.lower() in info_dict.get("one_sentence", "").lower() or \
                       k.lower() in info_dict.get("five_sentence", "").lower():
                        
                        results.append(file_path)
                        seen_paths.add(file_path)
            
            return create_success_response({"results": results})

        # --- Invalid Action ---
        else:
            return create_error_response(400, f"Invalid 'action': {action}.")

    # --- Global Error Handling ---
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") == 'ThrottlingException':
            return create_error_response(429, "The agent is being rate-limited by AWS. Please wait 30 seconds and try again.")
        else:
            return create_error_response(500, f"An AWS error occurred: {e}")
    except Exception as e:
        return create_error_response(500, f"An unexpected error occurred: {e}")




'''
import json
import os
import boto3
import time
from botocore.exceptions import ClientError
import docx
import fitz
import yaml
# --- FIX 1: Specify your AWS Region ---
# Set your region here or via the AWS_REGION environment variable
REGION = os.environ.get("AWS_REGION", "us-east-1") 
MODEL_ID = os.environ.get("MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")

print(f"Initializing Bedrock client in region: {REGION}...")
bedrock = boto3.client("bedrock-runtime", region_name=REGION)


SYSTEM_PROMPT = """You are a small Bedrock agent who will write in a professional and educational"""


# --- FIX 2: Updated call_bedrock to accept a message list ---
def call_bedrock(messages: list) -> str:
    """Invokes the Bedrock model with a list of messages."""
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "system": SYSTEM_PROMPT,
        "messages": messages,  # <-- Use the passed-in list
        "max_tokens": 400,
        "temperature": 0.2,
    }
    resp = bedrock.invoke_model(
        modelId=MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(body).encode("utf-8"),
    )
    payload = json.loads(resp["body"].read())
    
    # Handle potential stop reasons like 'tool_use'
    if payload.get("stop_reason") == "tool_use":
        # This shouldn't happen with our manual JSON prompt, but it's good practice
        # to find the text part.
        pass

    text = "".join([p.get("text","") for p in payload.get("content",[]) if p.get("type")=="text"])
    return text.strip()

# --- Helper Function (Unchanged) ---
def maybe_tool_call(text: str):
    """Checks if the model output is a JSON tool call."""
    try:
        # Handle cases where the model might add markdown ```json
        if text.startswith("```json"):
            text = text[7:-3].strip()
        obj = json.loads(text)
        if isinstance(obj, dict) and "tool" in obj:
            return obj
    except Exception:
        pass
    return None

# --- FIX 2: Updated handler to complete the agent loop ---
def handler(event, context):
    """
    Handles the agent interaction, now accepting and returning conversation history.
    """
    body = json.loads(event.get("body") or "{}")
    msg = (body.get("message") or "").strip()
    history = body.get("history") or []  # <-- Load the history

    if not msg:
        return {"statusCode": 400, "body": json.dumps({"error":"message required"})}

    try:
        # --- FIRST CALL ---
        # Build the message list from the *entire* history
        messages_for_first_call = history + [{"role": "user", "content": msg}]
        
        model_reply = call_bedrock(messages_for_first_call)
        call = maybe_tool_call(model_reply)

        # This is the history to be saved if no tool is called
        final_history = messages_for_first_call + [{"role": "assistant", "content": model_reply}]
        
        if call:
            
            # --- Build history for the SECOND call ---
            # This correctly includes all previous context
            messages_for_second_call = final_history + [
                {"role": "user", "content": ""}
            ]
            
            # --- SECOND CALL (with retry) ---
            try:
                final_text = call_bedrock(messages_for_second_call)
                # This is the final history to save after a successful tool call
                final_history = messages_for_second_call + [{"role": "assistant", "content": final_text}]
            
            except ClientError as e:
                if e.response.get("Error", {}).get("Code") == 'ThrottlingException':
                    print("Warning: Throttled on second call. Retrying after 5s...")
                    time.sleep(5) # Shorter wait, as requested
                    final_text = call_bedrock(messages_for_second_call)
                    final_history = messages_for_second_call + [{"role": "assistant", "content": final_text}]
                else:
                    raise e # Re-raise other AWS errors
        else:
            # No tool was needed, just return the model's first reply
            final_text = model_reply

    # --- Error handling now returns proper status codes ---
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") == 'ThrottlingException':
            return {
                "statusCode": 429, # Too Many Requests
                "body": json.dumps({
                    "error": "Tool error: The agent is being rate-limited by AWS. Please wait 30 seconds and try again.",
                    "history": history # Return the *old* history
                })
            }
        else:
            return {"statusCode": 500, "body": json.dumps({"error": f"AWS error: {e}", "history": history})}
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": f"An unexpected error occurred: {e}", "history": history})}

    # --- Success ---
    return {
        "statusCode": 200,
        "headers": {"Content-Type":"application/json"},
        "body": json.dumps({
            "reply": final_text,
            "history": final_history # <-- Return the new, updated history
        })
    }
# --- FIX 3: Added main function for command-line execution ---
# --- Updated main function to manage state ---

def getContents(file_path: str) -> str:
    """
    Extracts the text content from a file (.txt, .docx, or .pdf).

    Args:
        file_path: The full path to the file.

    Returns:
        A string containing the text content of the file.
        If an error occurs or the file type is unsupported,
        an error message string is returned.

    Requires:
        - 'python-docx' for .docx files (pip install python-docx)
        - 'PyMuPDF' for .pdf files (pip install PyMuPDF)
    """
    
    # 1. Check if file exists
    if not os.path.exists(file_path):
        return f"Error: File not found at path: {file_path}"

    # 2. Get the file extension and normalize it
    # os.path.splitext splits "notes.txt" into ("notes", ".txt")
    _, file_extension = os.path.splitext(file_path)
    file_extension = file_extension.lower()

    # 3. Process based on file type
    if file_extension == '.txt':
        try:
            # Simple text file, just read it with utf-8 encoding
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            return f"Error reading TXT file: {e}"

    elif file_extension == '.docx':
        if docx is None:
            return "Error: 'python-docx' library is not installed. Cannot read .docx file."
        try:
            # Open the docx file
            doc = docx.Document(file_path)
            # Extract text from all paragraphs and join them with a newline
            full_text = [para.text for para in doc.paragraphs]
            return '\n'.join(full_text)
        except Exception as e:
            # This can happen if the file is corrupt or not a valid docx
            return f"Error reading DOCX file: {e}"

    elif file_extension == '.pdf':
        if fitz is None:
            return "Error: 'PyMuPDF' (fitz) library is not installed. Cannot read .pdf file."
        try:
            # Open the PDF file
            doc = fitz.open(file_path)
            full_text = []
            # Iterate through each page and get its text
            for page in doc:
                full_text.append(page.get_text())
            doc.close()
            # Join all pages' text with a newline
            return '\n'.join(full_text)
        except Exception as e:
            # This can happen if the file is corrupt or password-protected
            return f"Error reading PDF file: {e}"

    else:
        # Handle all other file types
        return f"Error: Unsupported file type: {file_extension}. Only .txt, .docx, and .pdf are supported."
    

def getKeywords(prompt: str) -> []:
    mock_event = {
        "body": json.dumps({
            "message": "What key words and topics are associated with this? Seperate all possible ones by new line, in order of relevance: " + prompt,
            "history": [] # <-- Pass the current history
        })
    }
    try:
        # 3. Call the handler function
        response = handler(mock_event, None)
        
        # 4. Parse the handler's response
        response_body_data = json.loads(response.get("body", "{}"))
        
        if response.get("statusCode") == 200:
            reply = response_body_data.get("reply", "No reply found.")
            file = open("results/keywords.txt", "w")
            file.write(f"{reply}")
            file.close()
            output = {
                "output" : f"{reply}"
            }
            json_output = json.dumps(output, indent=4)
            result = json_output.splitlines()
            print(result)
            return result
        else:
            # Handle errors returned by the handler (like 429 or 500)
            error = response_body_data.get("error", "Unknown error")
            print(f"Error: {error} (Code: {response.get('statusCode')})")
            
            # Restore history from the error response (in case of a processing error)
            conversation_history = response_body_data.get("history", conversation_history)
    except Exception as e:
        # This catches fatal errors in the main loop itself
        print(f"\n--- An unexpected Python error occurred ---")
        print(f"Error: {e}")


def search(file_path: str, prompt: str) -> []:
    keywords = getKeywords(prompt)
    result = []
    with open(file_path, 'r') as file:
        data = yaml.safe_load(file)
    for k in keywords:
        for file_path, info in data.items():
            if file_path in result:
                continue
            if k in info.get("one_sentence", ""):
                result.append(file_path)
            elif k in info.get("five_sentence", ""):
                result.append(file_path)
    return result

def getSummary(file_path: str):
    content = getContents(file_path)
    conversation_history = [
    {
        "role": "user", "content": content
    },
    {
        "role": "assistant",
        "content": "Okay,  I got the notes, what should I do with it?"
    }
    ]
    mock_event = {
        "body": json.dumps({
            "message": """Can you generate a summary based on my notes? They must about 30% the size of my notes. 
        Avoid mention that you got this infromation from notes, and DO NOT under any circumstance put a beginning sentence describe your 
        task. Make it flow and sound human-like""",
            "history": conversation_history  # <-- Pass the current history
        })
    }

    try:
        # 3. Call the handler function
        response = handler(mock_event, None)
        
        # 4. Parse the handler's response
        response_body_data = json.loads(response.get("body", "{}"))
        
        if response.get("statusCode") == 200:
            reply = response_body_data.get("reply", "No reply found.")
            file = open("results/summary.txt", "w")
            file.write(f"{reply}")
            file.close()
            output = {
                "output" : f"{reply}"
            }
            json_output = json.dumps(output, indent=4)
            print(json_output)
            return json_output
        else:
            # Handle errors returned by the handler (like 429 or 500)
            error = response_body_data.get("error", "Unknown error")
            print(f"Error: {error} (Code: {response.get('statusCode')})")
            
            # Restore history from the error response (in case of a processing error)
            conversation_history = response_body_data.get("history", conversation_history)
    except Exception as e:
        # This catches fatal errors in the main loop itself
        print(f"\n--- An unexpected Python error occurred ---")
        print(f"Error: {e}")

def getQuestions(file_path: str, num: int):
    content = getContents(file_path)
    conversation_history = [
    {
        "role": "user", "content": content
    },
    {
        "role": "assistant",
        "content": "Okay,  I got the notes, what should I do with it?"
    }
    ]
    mock_event = {
        "body": json.dumps({
            "message": """Can you generate """+str(num)+""" exam style questions based on my notes? 
                They must deal with 1 or 2 topics, 1-3 sentences, and 50-100 words. 
                Each question should be seperated. Do not number the questions in any way, they should only be seperated by the new line.
                Avoid mention that you got this infromation from notes, and 
                DO NOT under any circumstance put a beginning sentence describe your task. Make it flow and sound human-like. """,
            "history": conversation_history  # <-- Pass the current history
        })
    }

    try:
        # 3. Call the handler function
        response = handler(mock_event, None)
        
        # 4. Parse the handler's response
        response_body_data = json.loads(response.get("body", "{}"))
        
        if response.get("statusCode") == 200:
            reply = response_body_data.get("reply", "No reply found.")
            file = open("results/questions.txt", "w")
            file.write(f"{reply}")
            file.close()
            output = {
                "output" : f"{reply}"
            }
            json_output = json.dumps(output, indent=4)
            print(json_output)
            return json_output
        else:
            # Handle errors returned by the handler (like 429 or 500)
            error = response_body_data.get("error", "Unknown error")
            print(f"Error: {error} (Code: {response.get('statusCode')})")
            
            # Restore history from the error response (in case of a processing error)
            conversation_history = response_body_data.get("history", conversation_history)
    except Exception as e:
        # This catches fatal errors in the main loop itself
        print(f"\n--- An unexpected Python error occurred ---")
        print(f"Error: {e}")


def checkAnswer(file_path: str, question: str, answer: str):
    content = getContents(file_path)
    conversation_history = [
    {
        "role": "user", "content": content
    },
    {
        "role": "assistant",
        "content": "Okay,  I got the notes, what should I do with it?"
    }
    ]
    mock_event = {
        "body": json.dumps({
            "message": """I have this generated question: """ + question + "\n" +
                        "My answer is: " + answer + "\n"+
                        """First, check if my answer is correct by either typing 'yes' or 'no' on the first line.
                        Then, on a new line, give me some feedback on how to improve my answer. Do not fully agree with my answer, 
                        give good feedback that will help me write a better answer next time.
                        If the answer is instead similar to 'I don't know', give a clear and educational explanation of the correct answer""",
            "history": conversation_history  # <-- Pass the current history
        })
    }

    try:
        # 3. Call the handler function
        response = handler(mock_event, None)
        
        # 4. Parse the handler's response
        response_body_data = json.loads(response.get("body", "{}"))
        
        if response.get("statusCode") == 200:
            reply = response_body_data.get("reply", "No reply found.")
            file = open("results/answers.txt", "w")
            file.write(f"{reply}")
            file.close()
            output = {
                "output" : f"{reply}"
            }
            json_output = json.dumps(output, indent=4)
            print(json_output)
            return json_output
        else:
            # Handle errors returned by the handler (like 429 or 500)
            error = response_body_data.get("error", "Unknown error")
            print(f"Error: {error} (Code: {response.get('statusCode')})")
            
            # Restore history from the error response (in case of a processing error)
            conversation_history = response_body_data.get("history", conversation_history)
    except Exception as e:
        # This catches fatal errors in the main loop itself
        print(f"\n--- An unexpected Python error occurred ---")
        print(f"Error: {e}")

def getFlashCards(file_path: str, num: int):
    content = getContents(file_path)
    conversation_history = [
    {
        "role": "user", "content": content
    },
    {
        "role": "assistant",
        "content": "Okay,  I got the notes, what should I do with it?"
    }
    ]
    mock_event = {
        "body": json.dumps({
            "message": """Can you generate """+str(num)+""" flash cards based on my notes? 
                Each flash card follows the same format: One small question of 1 sentence with 5-30 words. Difficulty should range from very easy to slightly hard.
                Answers should be even shorter, 1-10 words that answer the question.
                Types of questions to include are: true and false questions, definition questions, questions with 1 word answers
                Questions and Answers should only take 1 line and alternate with a new line in between them. Do not number them.
                Avoid mention that you got this infromation from notes, and 
                DO NOT under any circumstance put a beginning sentence describe your task. Make it flow and sound human-like. """,
            "history": conversation_history  # <-- Pass the current history
        })
    }

    try:
        # 3. Call the handler function
        response = handler(mock_event, None)
        
        # 4. Parse the handler's response
        response_body_data = json.loads(response.get("body", "{}"))
        
        if response.get("statusCode") == 200:
            reply = response_body_data.get("reply", "No reply found.")
            file = open("results/flashcards.txt", "w")
            file.write(f"{reply}")
            file.close()
            output = {
                "output" : f"{reply}"
            }
            json_output = json.dumps(output, indent=4)
            print(json_output)
            return json_output
        else:
            # Handle errors returned by the handler (like 429 or 500)
            error = response_body_data.get("error", "Unknown error")
            print(f"Error: {error} (Code: {response.get('statusCode')})")
            
            # Restore history from the error response (in case of a processing error)
            conversation_history = response_body_data.get("history", conversation_history)
    except Exception as e:
        # This catches fatal errors in the main loop itself
        print(f"\n--- An unexpected Python error occurred ---")
        print(f"Error: {e}")



def main():
    """Runs a continuous loop to chat with the agent from the console."""
    print("--- Bedrock Agent Test ---")
    print(f"Using model: {MODEL_ID}")
    print("Type 'exit' or 'quit' to end.")
    print("-" * 28)
    #getSummary("results/englishNotes.txt")
    #getQuestions("results/YouDreamedOfEmpires.pdf", 3)
    getFlashCards("results/notes.txt", 10)
    #file = open("results/questions.txt", "r")
    #question = file.read().splitlines()
    #file.close()
    #checkAnswer("results/YouDreamedOfEmpires.pdf", question[0], "I don't know the answer to this one, can you explain it to me?")
if __name__ == "__main__":
    main()
    '''