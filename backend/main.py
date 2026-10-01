from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from gmail import get_latest_emails, extract_email_content
from firebase import save_email, db
from fastapi.middleware.cors import CORSMiddleware
import anthropic
import os
import json
from datetime import datetime
from zoneinfo import ZoneInfo

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "chrome-extension://domnbnbfipidkhfehoaennghefhlijdf",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
client = anthropic.Anthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY")
)

class Email(BaseModel):
    id: str
    subject: str
    body: str

class Task(BaseModel):
    subject: str
    summary: str
    actionable: bool
    action: str
    deadline: str | None
    deadline_date: str | None
    priority: str
    reason: str

@app.get("/")
def root():
    return {"message": "Email Action Plan backend is working!"}

@app.get("/gmail")
def gmail_test():
    # Get the latest 5 emails from Gmail
    emails = get_latest_emails()
    # Load emails currently saved in Firestore
    existing_emails = {}
    for saved_email in db.collection("emails").stream():
        existing_emails[saved_email.id] = saved_email.to_dict()
    new_tasks = []
    # Analyze the current Gmail batch
    for email in emails:
        email_id = email["id"]
        # Extract sender and email content locally
        email_content = extract_email_content(email)
        # Reuse existing data only when it already has the new summary field
        if email_id in existing_emails and "summary" in existing_emails[email_id]:
            saved = existing_emails[email_id]
            # Keep sender information up to date
            saved["sender"] = email_content["sender"]
            saved["body"] = email_content["body"]
            saved["received_at"] = email_content["received_at"]
            new_tasks.append(saved)
            continue
        task = analyze_email(
            Email(
                id=email_id,
                subject=email_content["subject"],
                body=email_content["body"],
            )
        )

        new_tasks.append({
            "id": email_id,
            "subject": task["subject"],
            "sender": email_content["sender"],
            "summary": task["task"].summary,
            "body": email_content["body"],
            "received_at": email_content["received_at"],
            "actionable": task["task"].actionable,
            "action": task["task"].action,
            "deadline": task["task"].deadline,
            "deadline_date": task["task"].deadline_date,
            "priority": task["task"].priority,
            "reason": task["task"].reason,
        })
    # Only keep the current Gmail batch in Firestore
    current_ids = {email["id"] for email in new_tasks}
    for saved_email in db.collection("emails").stream():
        if saved_email.id not in current_ids:
            saved_email.reference.delete()
    # Save the current batch
    for email in new_tasks:
        save_email(email)
    return new_tasks

@app.get("/emails")
def get_emails():
    emails = db.collection("emails").stream()
    results = []
    for email in emails:
        results.append(email.to_dict())
    return results


@app.post("/analyze")
def analyze_email(email: Email):
    today = datetime.now(
        ZoneInfo("America/Los_Angeles")
    ).strftime("%Y-%m-%d")
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[
            {
                "role": "user",
                "content": f"""
Analyze this email and return only valid JSON with these seven fields:
{{
    "summary": "a short, natural phrase that tells the recipient what this email is about",
    "actionable": true or false,
    "action": "the main thing the recipient needs to do, or No action needed",
    "deadline": "a friendly description of the deadline, such as September 30 at 12:00 PM PT, if there is one, otherwise null",
    "deadline_date": "deadline as YYYY-MM-DD if there is one, otherwise null",
    "priority": "high, medium, or low",
    "reason": "a very short explanation for why this action is needed, or why no action is needed"
}}

The summary must:
- be a short, natural phrase that tells the recipient what this email is mainly about
- usually be 4 to 8 words
- sound like a quick personal inbox note
- focus on the main subject, offer, request, update, or information
- include the sender's name when it makes the meaning clearer
- choose the simplest useful description
- leave out secondary details such as discounts, percentages, dates, or extra context unless they are essential to understanding the main point
- avoid words like "email", "newsletter", "message", "discussing", "sharing", or "regarding"
- do not repeat the email subject word-for-word
- do not use a period at the end

Good examples:
- "Berkeley seeks donations for student projects"
- "Google promotes AI Studio app builder"
- "Chase sent a daily account summary"
- "Bed Bath & Beyond has a bedding sale"
- "Resume Worded shares career advice"
- "Your security settings need attention"
- "Your interview has been scheduled"

Bad examples:
- "Bed Bath & Beyond has new bedding with 25% off"
- "Coached newsletter on legacy and personal development"
- "This is an email about Berkeley donations"
- "Email regarding Google AI Studio"
- "This newsletter discusses personal development"

Set actionable to true only when the recipient actually needs to take an action.

Set actionable to false for:
- promotional emails
- informational emails
- optional offers
- emails that require no response
- emails where the recipient does not need to do anything

If actionable is false:
- set action to "No action needed"
- set deadline to null
- set deadline_date to null
- keep priority low
- keep reason to one short sentence

For actionable emails:
- make action specific and concise
- identify the actual task the recipient needs to complete
- include a deadline when one exists
- assign high priority when the action is urgent or time-sensitive

Today's date is {today}. Use this date to determine the correct year for any deadlines mentioned in the email.

Subject: {email.subject}
Email:
{email.body}
"""
            }
        ],
    )
    analysis = response.content[0].text

    analysis = (
        analysis
        .replace("```json", "")
        .replace("```", "")
        .strip()
    )

    task_data = json.loads(analysis)
    task_data["subject"] = email.subject
    task = Task(**task_data)

    return {
        "id": email.id,
        "subject": email.subject,
        "task": task,
    }