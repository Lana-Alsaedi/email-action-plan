from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
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

def get_latest_emails():
    service = get_gmail_service()
    # Ask Gmail for the 5 newest emails
    results = service.users().messages().list(
        userId="me",
        maxResults=5
    ).execute()
    messages = results.get("messages", [])
    if not messages:
        return []
    emails = []
    # Get the full contents of each email
    for message in messages:
        email = service.users().messages().get(
            userId="me",
            id=message["id"],
            format="full"
        ).execute()
        emails.append(email)
    return emails

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
    body = clean_email_body(find_plain_text(email["payload"]))
    return {
        "subject": subject,
        "body": body,
        "received_at": received_at
    }

def delete_email(email_id):
    service = get_gmail_service()
    service.users().messages().trash(
        userId="me",
        id=email_id
    ).execute()