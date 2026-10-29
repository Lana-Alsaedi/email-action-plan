from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from email.message import EmailMessage
from email.utils import parseaddr
import base64
import re

SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]

def get_gmail_service():
    creds = None

    # Check if we already have a saved login
    try:
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    except FileNotFoundError:
        pass

    # Ask Google to log us in if we aren't already authorized
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "credentials.json", SCOPES
            )
            creds = flow.run_local_server(port=0)

        # Save our login so we don't have to sign in every time
        with open("token.json", "w") as token:
            token.write(creds.to_json())

    # Create a connection to Gmail
    return build("gmail", "v1", credentials=creds)

def get_latest_emails(page_token=None):
    service = get_gmail_service()

    # Request five messages from the current page
    request = service.users().messages().list(
        userId="me",
        labelIds=["INBOX"],
        maxResults=5,
        pageToken=page_token
    )

    results = request.execute()
    messages = results.get("messages", [])

    emails = []

    # Fetch the full contents of each message
    for message in messages:
        email = service.users().messages().get(
            userId="me",
            id=message["id"],
            format="full"
        ).execute()

        emails.append(email)

    # Return the emails and the token for the following page
    return {
        "emails": emails,
        "nextPageToken": results.get("nextPageToken")
    }

def clean_email_body(body):
    # Remove excessive blank lines
    body = re.sub(r"\n\s*\n+", "\n\n", body)
    # Remove obvious email tracking URLs
    body = re.sub(r"https?://click\.promotion\.bedbathandbeyond\.com/\S+", "", body)
    return body.strip()


def extract_email_content(email):
    # Get information from the email headers
    subject = ""
    sender = ""
    received_at = email.get("internalDate", "")
    for header in email["payload"]["headers"]:
        if header["name"].lower() == "subject":
            subject = header["value"]
        if header["name"].lower() == "from":
            sender = header["value"]
    # Find the email body
    def find_plain_text(part):
        if part.get("mimeType") == "text/plain":
            data = part.get("body", {}).get("data")
            if data:
                return base64.urlsafe_b64decode(data).decode("utf-8")
        # Check inside nested email parts
        for nested_part in part.get("parts", []):
            result = find_plain_text(nested_part)
            if result:
                return result
        return ""
    body = clean_email_body(
        find_plain_text(email["payload"])
    )

    return {
        "subject": subject,
        "sender": sender,
        "body": body,
        "received_at": received_at
    }

def delete_email(email_id):
    service = get_gmail_service()
    service.users().messages().trash(
        userId="me",
        id=email_id
    ).execute()

def create_reply_draft(email_id, reply_body):
    service = get_gmail_service()

    # Get the original email and its conversation details
    original = service.users().messages().get(
        userId="me",
        id=email_id,
        format="full"
    ).execute()

    headers = {
        header["name"].lower(): header["value"]
        for header in original.get("payload", {}).get("headers", [])
    }

    sender_email = parseaddr(headers.get("from", ""))[1]
    original_subject = headers.get("subject", "")
    message_id = headers.get("message-id", "")
    references = headers.get("references", "").strip()

    if not sender_email:
        raise ValueError("Could not determine the original sender's email address.")

    # Keep the reply connected to the original email
    subject = original_subject
    if not subject.lower().startswith("re:"):
        subject = f"Re: {subject}"

    message = EmailMessage()
    message["To"] = sender_email
    message["Subject"] = subject

    if message_id:
        message["In-Reply-To"] = message_id
        message["References"] = (
            f"{references} {message_id}".strip()
            if references
            else message_id
        )

    message.set_content(reply_body)

    # Encode the email for the Gmail API
    raw_message = base64.urlsafe_b64encode(
        message.as_bytes()
    ).decode("utf-8")

    # Save it as a draft in the original conversation
    draft = service.users().drafts().create(
        userId="me",
        body={
            "message": {
                "raw": raw_message,
                "threadId": original["threadId"],
            }
        },
    ).execute()

    return {
        "draft_id": draft["id"],
        "thread_id": original["threadId"],
        "message_id": draft["message"]["id"],
    }