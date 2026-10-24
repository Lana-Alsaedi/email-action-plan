# Inbox Copilot

Inbox Copilot is an **AI-powered Gmail assistant** that organizes your inbox into an actionable plan and helps you write personalized email replies.

Its standout feature is an **interactive AI questionnaire that gathers missing context before generating a reply**. By answering targeted follow-up questions, you help Claude create a draft tailored to your situation. You can edit the response and save it directly to Gmail Drafts without automatically sending it.

## AI-Powered Reply Drafting

- **Interactive questionnaire:** Answers targeted follow-up questions to gather the context needed for a better reply.
- **Personalized drafts:** Combines the original email with your answers to generate a relevant response.
- **Editable responses:** Review and revise the draft before saving it.
- **Gmail integration:** Saves the reply to the original email conversation in Gmail Drafts.
- **User control:** Keeps you in charge of the final message. Nothing is automatically sent.

## Inbox Organization

- **Email classification:** Uses Claude to separate actionable emails from informational ones.
- **Summaries and recommendations:** Summarizes emails and suggests next steps.
- **Deadline extraction:** Identifies relevant deadlines and assigns priorities.
- **Inbox organization:** Separates emails into Action Needed and No Action Needed.
- **Gmail integration:** Opens emails directly in Gmail and supports email deletion.
- **Persistent storage:** Stores analyzed email data in Cloud Firestore.
- **On-demand refresh:** Fetches the latest five emails when requested.

## How It Works

```text
Chrome Extension
  (React + TypeScript)
          ↕
    FastAPI Backend
      ↙    ↓    ↘
   Gmail  Claude  Firestore
    API    API    Database
```

The Chrome extension provides the user interface, while the FastAPI backend handles Gmail access, AI analysis, reply generation, and Firestore operations.

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- HTML and CSS

### Backend
- Python
- FastAPI
- Uvicorn
- Pydantic

### AI and Integrations
- Anthropic Claude API
- Gmail API
- Google OAuth

### Database
- Firebase Admin SDK
- Cloud Firestore

### Tools and Deployment
- Chrome Extension (Manifest V3)
- GitHub Actions
- GitHub Pages
- Git

## AI Evaluation

I evaluated email classification and action extraction using a manually labeled set of 100 emails. The system achieved **97% accuracy on this evaluation set**.

The evaluation examined whether the model correctly identified emails requiring action and extracted useful information, including recommended actions, deadlines, and priorities.

## Running Locally

### Prerequisites

Install the following:

- Git
- Python 3
- Node.js and npm
- Google Chrome

You will also need an Anthropic API key, Google Cloud OAuth credentials, and a Firebase project with Cloud Firestore configured.

### 1. Clone the Repository

```bash
git clone https://github.com/Lana-Alsaedi/email-action-plan.git
cd email-action-plan
```

### 2. Set Up the Backend

Navigate to the backend directory and create a virtual environment:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

Install the required packages:

```bash
pip install fastapi "uvicorn[standard]" python-dotenv anthropic firebase-admin google-api-python-client google-auth google-auth-oauthlib google-auth-httplib2
```

#### Configure Credentials

1. Create a `.env` file inside `backend/` and add your Anthropic API key:

   ```env
   ANTHROPIC_API_KEY=your_api_key
   ```

2. Enable the Gmail API in Google Cloud Console, configure OAuth, and save your OAuth client credentials as `backend/credentials.json`.

3. Create a Firebase service account key and save it as `backend/firebase-key.json`.

4. Complete the Google OAuth flow when prompted by the application. The authentication process may generate a token file.

#### Start the Backend

From the `backend/` directory, run:

```bash
uvicorn main:app --reload
```

The API runs at http://localhost:8000.

Interactive API documentation is available at http://localhost:8000/docs.

### 3. Set Up the Frontend

Open a second terminal and navigate to the repository root, then run:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite.

### 4. Build the Chrome Extension

From the repository root, run:

```bash
cd frontend
npm run build:extension
```

Then load the extension in Chrome:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose the generated `frontend/dist` folder.

**Note:** Developers using their own unpacked extension may need to update the allowed extension origin in `backend/main.py`. Google OAuth and Firebase must also be configured for their own accounts and projects.

Keep API keys, OAuth credentials, authentication tokens, and Firebase service account keys out of version control.

## CI/CD

- **Automated checks:** GitHub Actions runs the frontend TypeScript check and production build when changes are pushed to `main`.
- **Deployment:** The production frontend is deployed to GitHub Pages.
- **Extension builds:** A separate Vite build mode supports the Chrome extension's build configuration.

## Security

- **Credential protection:** API keys, OAuth credentials, tokens, and Firebase service account keys should never be committed to version control.
- **Gmail permissions:** Uses Google OAuth to access email according to the permissions granted by the user.
- **AI processing:** Email content is sent to Anthropic Claude for analysis and reply generation.
- **Draft review:** Generated replies are saved as drafts rather than automatically sent.

Always review AI-generated content before using it.

## Future Improvements

- **Instruction-based reply refinement:** Let users ask Claude to revise a generated reply with instructions such as "make it more professional," "sound warmer," or "shorten it." Users can review the updated version before saving it.
- **Simplified setup:** Add a `requirements.txt` file, a safe `.env.example`, and clearer onboarding instructions to make local setup easier.
- **More transparent AI decisions:** Provide clearer explanations of email classifications, assigned priorities, and uncertain predictions.

## Feedback and Contact

Have feedback, questions, or ideas for improving Inbox Copilot? I'd love to hear from you.

- **Email:** lalsaedi@berkeley.edu
