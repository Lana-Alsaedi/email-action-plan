# FastAPI handles our backend/API, while these libraries let us connect to Claude
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from gmail import get_latest_emails, extract_email_content
from firebase import save_email, db
from fastapi.middleware.cors import CORSMiddleware
import anthropic
import os
import json

# Create the FastAPI app
app = FastAPI()

# Allow our local React app to connect to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the API key from our local .env file
load_dotenv()

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

    # Analyze each email with Claude only if it is not already saved
    for email in emails:
        existing_email = db.collection("emails").document(email["id"]).get()
        if existing_email.exists:
            # Skip emails we have already analyzed
            continue
        email_content = extract_email_content(email)
        task = analyze_email(
            Email(
                id=email["id"],
                subject=email_content["subject"],
                body=email_content["body"]
            )
        )

        # Save the analyzed email to Firestore
        save_email({
            "id": email["id"],
            "subject": task["subject"],
            "body": email_content["body"],
            "received_at": email_content["received_at"],
            "actionable": task["task"].actionable,
            "action": task["task"].action,
            "deadline": task["task"].deadline,
            "priority": task["task"].priority,
            "reason": task["task"].reason
        })

        tasks.append({
            "id": email["id"],
            "subject": task["subject"],
            "body": email_content["body"],
            "received_at": email_content["received_at"],
            "actionable": task["task"].actionable,
            "action": task["task"].action,
            "deadline": task["task"].deadline,
            "priority": task["task"].priority,
            "reason": task["task"].reason
        })
    return tasks

@app.get("/emails")
def get_emails():
    # Get all saved emails from Firestore
    emails = db.collection("emails").stream()
    results = []
    # Turn each Firestore document into a dictionary
    for email in emails:
        results.append(email.to_dict())
    return results

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