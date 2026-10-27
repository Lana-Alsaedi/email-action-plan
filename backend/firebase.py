from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore

# Find the Firebase key beside this file
firebase_key = Path(__file__).parent / "firebase-key.json"

if not firebase_key.exists():
    raise FileNotFoundError(
        f"Firebase credentials are missing: {firebase_key}\n"
        "Download a Firebase service-account key and save it as "
        "'backend/firebase-key.json'."
    )

# Connect my backend to Firebase
cred = credentials.Certificate(str(firebase_key))
firebase_admin.initialize_app(cred)

# Create my Firestore database connection
db = firestore.client()


def save_email(email_data):
    # Save the analyzed email to Firestore
    db.collection("emails").document(email_data["id"]).set(email_data)