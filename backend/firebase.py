import firebase_admin
from firebase_admin import credentials, firestore

# Connect my backend to Firebase
cred = credentials.Certificate("firebase-key.json")
firebase_admin.initialize_app(cred)

# Create my Firestore database connection
db = firestore.client()