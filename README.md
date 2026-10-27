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

Install:

- Git

- Python 3

- Node.js and npm

- Google Chrome

You will also need an Anthropic API key, a Google Cloud project with the Gmail API enabled, and a Firebase project with Cloud Firestore enabled.

### 1. Clone the repository

    git clone https://github.com/Lana-Alsaedi/email-action-plan.git

    cd email-action-plan

### 2. Install dependencies

Run the setup script from the project root:

    chmod +x setup.sh dev.sh

    ./setup.sh

This creates the Python virtual environment, installs backend and frontend dependencies, and creates `backend/.env` from the example if it doesn't already exist.

The script preserves an existing `.env` file.

### 3. Configure credentials

Before starting the app, configure these three files.

**`backend/.env`**

Add your Anthropic API key:

    ANTHROPIC_API_KEY=your_actual_api_key

Get an API key from the Anthropic Console.

**`backend/credentials.json`**

1. Open the Google Cloud Console.

2. Select or create a project.

3. Enable the Gmail API.

4. Configure the OAuth consent screen and create an OAuth client appropriate for the application.

5. Download the OAuth client JSON file and save it as `backend/credentials.json`.

The application uses Google OAuth to request Gmail access. On first use, complete the browser sign-in and authorization flow. The backend saves the resulting `backend/token.json` locally for subsequent runs.

**`backend/firebase-key.json`**

1. Open your Firebase project.

2. Enable Cloud Firestore.

3. Create a service account key through the project's service-account settings.

4. Download the JSON key and save it as `backend/firebase-key.json`.

Keep all three files private. Do not commit API keys, OAuth credentials, authentication tokens, or Firebase service-account keys.

### 4. Start the app

From the project root, run:

    ./dev.sh

This starts both the backend and frontend.

- **Frontend:** http://localhost:5173

- **Backend:** http://127.0.0.1:8000

- **API documentation:** http://127.0.0.1:8000/docs

Press **Control + C** to stop the development servers.

### 5. Load the Chrome extension

Build the extension from the project root:

    cd frontend

    npm run build:extension

Then:

1. Open `chrome://extensions` in Chrome.

2. Enable **Developer mode**.

3. Select **Load unpacked**.

4. Choose the generated `frontend/dist` directory.

Developers using their own unpacked extension may need to update the allowed Chrome extension origin in `backend/main.py` to match their extension ID. Google OAuth and Firebase must also be configured for their own accounts and projects.

## CI/CD

- **Automated checks:** GitHub Actions runs the frontend TypeScript check and production build when changes are pushed to `main`.
- **Deployment:** The production frontend is deployed to GitHub Pages.
- **Extension builds:** A separate Vite build mode supports the Chrome extension's build configuration.

## Security

- Never commit API keys, OAuth credentials, tokens, or Firebase service-account keys.
- Gmail access is controlled by Google OAuth permissions.
- Email content is sent to Anthropic Claude for analysis and reply generation.
- Generated replies are saved as drafts, not automatically sent.


## Future Improvements

- **Instruction-based reply refinement:** Let users ask Claude to revise a generated reply with instructions such as "make it more professional," "sound warmer," or "shorten it." Users can review the updated version before saving it.

## Feedback and Contact

Have feedback, questions, or ideas for improving Inbox Copilot? I'd love to hear from you.

- **Email:** lalsaedi@berkeley.edu
