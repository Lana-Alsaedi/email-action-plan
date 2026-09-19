import firebase_admin
from firebase_admin import credentials, firestore

# Connect my backend to Firebase
cred = credentials.Certificate("firebase-key.json")
firebase_admin.initialize_app(cred)

# Create my Firestore database connection
db = firestore.client()

def save_email(email_data):
    # Save the analyzed email to Firestore
    db.collection("emails").document(email_data["id"]).set(email_data)