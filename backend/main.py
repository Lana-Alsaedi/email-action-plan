# FastAPI handles our backend/API, while these libraries let us connect to Claude
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from gmail import get_latest_emails, extract_email_content
import anthropic
import os
import json

# Load the API key from our local .env file
load_dotenv()

# Create the FastAPI app.
app = FastAPI()

# Create a Claude client using the API key from .env
client = anthropic.Anthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY")
)

# Define the structure of an email our backend expects
class Email(BaseModel):
    id: str
    subject: str
    body: str

# Define the task information we want Claude to return
class Task(BaseModel):
    subject: str
    actionable: bool
    action: str
    deadline: str
    priority: str
    reason: str

# Simple test route to make sure our backend is running
@app.get("/")
def root():
    return {"message": "Email Action Plan backend is working!"}

@app.get("/gmail")
def gmail_test():
    # Get the 5 newest emails from Gmail
    emails = get_latest_emails()
    tasks = []
    # Analyze each email with Claude
    for email in emails:
        email_content = extract_email_content(email)
        task = analyze_email(
            Email(
                id=email["id"],
                subject=email_content["subject"],
                body=email_content["body"]
            )
        )
        tasks.append(task)
    return tasks

# Send the email to Claude and ask for structured task information
@app.post("/analyze")
def analyze_email(email: Email):
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[
            {
                "role": "user",
                "content": f"""
Analyze this email and return only valid JSON with these four fields:

{{
    "actionable": true or false,
    "action": "the main thing the recipient needs to do, or No action",
    "deadline": "deadline if there is one, otherwise None",
    "priority": "high, medium, or low",
    "reason": "short explanation for why this action is needed"
}}

Set actionable to true only when the recipient needs to take an action. Set it to false for promotional emails, informational emails, optional offers, and emails that require no response.

Subject: {email.subject}

Email:
{email.body}
"""
            }
        ]
    )

    # Get the text Claude returned
    analysis = response.content[0].text

    # Remove Markdown code fences if Claude adds them
    analysis = analysis.replace("```json", "").replace("```", "").strip()
    
    # Turn Claude's JSON text into a Python dictionary
    task_data = json.loads(analysis)

    # Add the email subject to our task data
    task_data["subject"] = email.subject

    # Validate Claude's data against our Task structure
    task = Task(**task_data)

    return {
        "id": email.id,
        "subject": email.subject,
        "task": task
}