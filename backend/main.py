from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from gmail import get_latest_emails, extract_email_content, create_reply_draft
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
api_key = os.getenv("ANTHROPIC_API_KEY")

if not api_key or api_key == "your_anthropic_api_key_here":
    raise RuntimeError(
        "Anthropic API key is missing. Add your key to "
        "'backend/.env' as ANTHROPIC_API_KEY=your_actual_api_key."
    )

client = anthropic.Anthropic(api_key=api_key)


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


class QuestionsRequest(BaseModel):
    subject: str
    sender: str
    body: str


class ReplyQuestion(BaseModel):
    id: str
    question: str
    type: str
    required: bool
    options: list[str] = Field(default_factory=list)
    allow_custom_answer: bool = True


class ReplyAnswer(BaseModel):
    question: str
    answer: str


class GenerateReplyRequest(BaseModel):
    subject: str
    sender: str
    body: str
    answers: list[ReplyAnswer]


class GenerateReplyResponse(BaseModel):
    reply: str


class SaveDraftRequest(BaseModel):
    email_id: str
    reply: str


# Read the AI response and return a useful error if it is not valid JSON
def parse_json_response(text: str, description: str) -> dict:
    cleaned = text.strip()

    if not cleaned:
        raise HTTPException(
            status_code=502,
            detail=f"The AI service returned an empty response while {description}. Please try again.",
        )

    # Remove Markdown fences if the AI included them
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()

        if lines and lines[0].startswith("```"):
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        cleaned = "\n".join(lines).strip()

    try:
        # Parse the complete response first
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        # Fall back to the first JSON object if the AI adds extra text
        try:
            start = cleaned.index("{")
            parsed, _ = json.JSONDecoder().raw_decode(cleaned[start:])
        except (ValueError, json.JSONDecodeError) as error:
            print(
                f"Could not parse AI response while {description}: "
                f"{error}; response starts with {cleaned[:300]!r}"
            )
            raise HTTPException(
                status_code=502,
                detail=f"The AI service returned an unexpected response while {description}. Please try again.",
            ) from error

    if not isinstance(parsed, dict):
        raise HTTPException(
            status_code=502,
            detail=f"The AI service returned an unexpected data format while {description}. Please try again.",
        )

    return parsed


@app.post("/reply/generate", response_model=GenerateReplyResponse)
def generate_reply(request: GenerateReplyRequest):
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1200,
        messages=[
            {
                "role": "user",
                "content": f"""
Write a ready-to-use email reply for the user.

Use the original email and the user's answers below.
Be natural, concise, and professional.
Do not invent personal facts, experience, dates, or commitments.
Do not include a subject line or explanation.
Return only the email reply.

Original email sender: {request.sender}
Original email subject: {request.subject}
Original email body:
{request.body}

User's answers:
{json.dumps(
    [answer.model_dump() for answer in request.answers],
    ensure_ascii=False,
)}
""",
            }
        ],
    )

    if not response.content or not hasattr(response.content[0], "text"):
        raise HTTPException(
            status_code=502,
            detail="The AI service did not return a reply. Please try again.",
        )

    reply = response.content[0].text.strip()

    if not reply:
        raise HTTPException(
            status_code=502,
            detail="The AI service returned an empty reply. Please try again.",
        )

    return {"reply": reply}


@app.post("/reply/draft")
def save_reply_draft(request: SaveDraftRequest):
    if not request.reply.strip():
        return {"error": "The reply cannot be empty."}

    try:
        draft = create_reply_draft(
            request.email_id,
            request.reply.strip(),
        )

        return {
            "success": True,
            "draft_id": draft["draft_id"],
            "thread_id": draft["thread_id"],
            "message_id": draft["message_id"],
            "message": "Reply saved to Gmail Drafts.",
        }

    except ValueError as error:
        return {"error": str(error)}

    except Exception as error:
        print(f"Could not save Gmail draft: {error}")
        return {
            "error": "Could not save the reply to Gmail Drafts."
        }


@app.get("/")
def root():
    return {"message": "Email Action Plan backend is working!"}


@app.get("/gmail")
def gmail_test(page_token: str | None = None):
    # Get five emails from the requested Gmail page
    gmail_page = get_latest_emails(page_token=page_token)
    emails = gmail_page["emails"]
    next_page_token = gmail_page["nextPageToken"]

    # Load emails already saved in Firestore
    existing_emails = {}
    for saved_email in db.collection("emails").stream():
        existing_emails[saved_email.id] = saved_email.to_dict()

    new_tasks = []

    # Analyze the current batch
    for email in emails:
        email_id = email["id"]
        email_content = extract_email_content(email)

        # Reuse an existing analysis when available
        if (
            email_id in existing_emails
            and "summary" in existing_emails[email_id]
        ):
            saved = existing_emails[email_id].copy()
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

    # Save this batch without deleting previously loaded emails
    for email in new_tasks:
        save_email(email)

    return {
        "emails": new_tasks,
        "nextPageToken": next_page_token,
    }


@app.delete("/gmail/{email_id}")
def delete_gmail_email(email_id: str):
    from gmail import delete_email

    delete_email(email_id)
    db.collection("emails").document(email_id).delete()

    return {"success": True}


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
- leave out secondary details such as discounts, percentages, dates, or extra context unless essential
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
""",
            }
        ],
    )

    if not response.content or not hasattr(response.content[0], "text"):
        raise HTTPException(
            status_code=502,
            detail="The AI service did not return an email analysis. Please try again.",
        )

    analysis = response.content[0].text.strip()

    task_data = parse_json_response(analysis, "analyzing the email")

    task_data["subject"] = email.subject
    task = Task(**task_data)

    return {
        "id": email.id,
        "subject": email.subject,
        "task": task,
    }


@app.post("/reply/questions")
def generate_reply_questions(request: QuestionsRequest):
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1500,
        messages=[
            {
                "role": "user",
                "content": f"""
You help the user prepare accurate, personalized email replies.

Read the email and determine what information is needed
before writing a useful reply.

Ask only questions that are genuinely necessary.
Do not ask for information already provided in the email.
Never invent personal facts or commitments.

Return only valid JSON in this format:
{{
    "questions": [
        {{
            "id": "short_unique_id",
            "question": "The question to ask",
            "type": "multiple_choice",
            "required": true,
            "options": ["Option 1", "Option 2", "Option 3"],
            "allow_custom_answer": true
        }}
    ]
}}

Rules:
- Return no more than 4 questions.
- Return an empty questions list if no extra information is needed.
- Use multiple_choice when a few clear options can capture the answer.
- For multiple_choice, provide 2 to 5 relevant options.
- Do not include "Other" as an option. The interface provides a
  separate custom-answer field automatically.
- Always allow an optional custom answer or clarification.
- Use short_answer when multiple choice would be awkward,
  incomplete, or misleading.
- For short_answer, return an empty options list.
- Set required to true only when the information is necessary.
- Use simple, direct language.
- Every question must ask for one specific piece of information.

Email sender: {request.sender}
Email subject: {request.subject}
Email body:
{request.body}
""",
            }
        ],
    )

    if not response.content or not hasattr(response.content[0], "text"):
        raise HTTPException(
            status_code=502,
            detail="The AI service did not return reply questions. Please try again.",
        )

    result = response.content[0].text
    questions_data = parse_json_response(result, "preparing reply questions")

    raw_questions = questions_data.get("questions")

    if not isinstance(raw_questions, list):
        raise HTTPException(
            status_code=502,
            detail="The AI service returned reply questions in an unexpected format. Please try again.",
        )

    questions = []

    for index, question in enumerate(raw_questions[:4]):
        if not isinstance(question, dict):
            print(f"Skipping malformed reply question at index {index}")
            continue

        # Keep question fields and options in the format the frontend expects
        question_type = question.get("type", "short_answer")
        if question_type not in ("multiple_choice", "short_answer"):
            question_type = "short_answer"

        options = question.get("options", [])
        if not isinstance(options, list):
            options = []

        options = [
            option if isinstance(option, str) else str(option.get("label", option.get("text", "")))
            for option in options
            if isinstance(option, str)
            or (isinstance(option, dict) and (option.get("label") or option.get("text")))
        ]

        try:
            questions.append(
                ReplyQuestion(
                    id=str(question.get("id") or f"question-{index + 1}"),
                    question=str(question.get("question") or ""),
                    type=question_type,
                    required=bool(question.get("required", False)),
                    options=options,
                    allow_custom_answer=bool(question.get("allow_custom_answer", True)),
                )
            )
        except Exception as error:
            print(f"Skipping invalid reply question at index {index}: {error}")

    return {"questions": questions}