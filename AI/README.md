# Bedrock Agent Project

This is a simple Python agent that uses Amazon Bedrock to answer questions and use tools.
This requires setting up a lot, might just be worth for me to run the entire thing for demo?

## 1. Installation

1.  Clone this repository.
2.  (Recommended) Create a virtual environment:
    ```bash
    python -m venv .venv
    source .venv/bin/activate 
    ```
3.  Install the required packages:
    ```bash
    pip install -r requirements.txt
    ```

## 2. AWS Setup

This script requires AWS credentials with permission to use Bedrock.

1.  **Configure AWS CLI:** Run `aws configure` and enter your AWS Access Key ID and Secret Access Key.
    ```bash
    aws configure
    AWS Access Key ID [None]: YOUR_KEY_HERE
    AWS Secret Access Key [None]: YOUR_SECRET_HERE
    Default region name [None]: us-east-1
    Default output format [None]: json
    ```

2.  **Enable Model Access:** You must log in to the AWS Console and enable access for the Anthropic models.
    * Go to the **Amazon Bedrock** service.
    * In the bottom-left menu, find **"Model access"**.
    * Request access for **Claude 3 Haiku** (or any other model you're using).
    * You may also need to **"Submit use case details"** for Anthropic models.

## 3. Running the Script

Once setup is complete, you can run the agent:

```bash
python generateContent.py