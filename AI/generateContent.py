import json
import os
import datetime
import boto3
import zoneinfo
import time
from botocore.exceptions import ClientError
# --- FIX 1: Specify your AWS Region ---
# Set your region here or via the AWS_REGION environment variable
REGION = os.environ.get("AWS_REGION", "us-east-1") 
MODEL_ID = os.environ.get("MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")

print(f"Initializing Bedrock client in region: {REGION}...")
bedrock = boto3.client("bedrock-runtime", region_name=REGION)


SYSTEM_PROMPT = """You are a small Bedrock agent who will write in a professional and educational"""
"""
If a tool is needed, respond with ONLY this JSON (no extra text):
{"tool":"<name>","args":{...}}
Available tools:
- calc(op, a, b) -> op in [add, sub, mul, div]; a and b are numbers.
If no tool is needed, just answer normally (no JSON). Be concise.
"""

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

# --- Tool Functions (Slightly improved tool_get_time) ---
"""
def tool_get_time(zone: str | None = None):
    tz = None
    if zone:
        try:
            tz = zoneinfo.ZoneInfo(zone)
        except zoneinfo.ZoneInfoNotFoundError:
            # Invalid zone, fall back to local
            print(f"Warning: Zone '{zone}' not found. Using local time.")
            tz = datetime.datetime.now().astimezone().tzinfo
    else:
        # No zone provided, use local
        tz = datetime.datetime.now().astimezone().tzinfo
    
    now = datetime.datetime.now(tz)
    return now.strftime("%Y-%m-%d %H:%M:%S %Z")

def tool_calc(op: str, a, b):
    try:
        x = float(a); y = float(b)
        if op == "add": return x + y
        if op == "sub": return x - y
        if op == "mul": return x * y
        if op == "div": return x / y if y != 0 else "Error: division by zero"
        return f"Unknown op: {op}"
    except Exception as e:
        return f"Calc error: {e}"
    """
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
            name = call.get("tool")
            args = call.get("args", {}) or {}
            
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
def getSummary(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
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

def getQuestions(file_path, num):
    with open(file_path, 'r') as f:
        content = f.read()
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


def checkAnswer(file_path, question, answer):
    with open(file_path, 'r') as f:
        content = f.read()
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



def main():
    """Runs a continuous loop to chat with the agent from the console."""
    print("--- Bedrock Agent Test ---")
    print(f"Using model: {MODEL_ID}")
    print("Type 'exit' or 'quit' to end.")
    print("-" * 28)
    getSummary("results/notes.txt")
    getQuestions("results/notes.txt", 3)
    file = open("results/questions.txt", "r")
    question = file.read().splitlines()
    file.close()
    checkAnswer("results/notes.txt", question[0], "I don't know the answer to this one, can you explain it to me?")
if __name__ == "__main__":
    main()