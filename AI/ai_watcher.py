import os
import time
import generateContent


QUERY_FILE = "user_ai_query.txt"
RESPONSE_FILE = "user_ai_response.txt"

def run_ai(query: str) -> str:
    return generateContent.query(query)

def main():
    print("🤖 AI Engine started. Watching for queries...")
    while True:
        if os.path.exists(QUERY_FILE):
            with open(QUERY_FILE, "r") as f:
                query = f.read().strip()
            print(f"📩 Received query: {query}")

            # Run AI logic
            response = run_ai(query)

            # Write response file
            with open(RESPONSE_FILE, "w") as f:
                f.write(response)

            # Remove the query file
            os.remove(QUERY_FILE)
            print("✅ Response written.")
        time.sleep(1)

if __name__ == "__main__":
    main()
