# Inbox Copilot

Inbox Copilot turns your Gmail inbox into a short action plan. It pulls your latest emails, uses Claude to figure out which ones actually need attention, and gives you a quick summary, recommended action, deadline, and priority.

I built this as a way to make my own inbox easier to manage while getting hands-on experience connecting an AI API, Gmail, a backend, a database, and a Chrome extension into one application.

## What it does

- Pulls the latest 5 emails from Gmail

- Uses Claude to classify emails as actionable or informational

- Generates a short summary and recommended action

- Extracts deadlines and assigns a priority

- Separates emails into **Action needed** and **No action needed**

- Opens emails directly in Gmail

- Deletes emails from Gmail

- Stores analyzed emails in Firestore

- Refreshes the inbox on demand

- Runs as a Chrome extension

## How it works

```text

Gmail

  ↓

FastAPI backend

  ↓

Claude API

  ↓

Firestore

  ↓

React + TypeScript

  ↓

Chrome Extension

```

The Chrome extension provides the interface, while the FastAPI backend handles Gmail access, Claude analysis, and Firestore operations.

## Tech Stack

### Frontend

- React

- TypeScript

- Vite

- HTML/CSS

### Backend

- Python

- FastAPI

- Uvicorn

- Gmail API

- Anthropic Claude API

### Database

- Firebase

- Cloud Firestore

### Tools & Deployment

- Chrome Extension, Manifest V3

- GitHub Actions

- GitHub Pages

- Git

## AI Evaluation

I evaluated the email classification and action extraction on a manually labeled set of 100 emails.

The system reached **97% accuracy** on this evaluation set.

The evaluation focused on whether the model correctly identified emails that required action and extracted useful information such as the recommended action, deadline, and priority.

## Running Locally

### 1. Clone the repository

```bash

git clone https://github.com/Lana-Alsaedi/email-action-plan.git

cd email-action-plan

```

### 2. Start the backend

```bash

cd backend

source venv/bin/activate

uvicorn main:app --reload

```

The FastAPI server runs at:

```text

http://localhost:8000

```

### 3. Start the frontend

In a separate terminal:

```bash

cd frontend

npm install

npm run dev

```

The development frontend runs through Vite.

### 4. Build the Chrome extension

```bash

cd frontend

npm run build:extension

```

Then load the generated `frontend/dist` folder as an unpacked extension through Chrome's Extensions page.

## CI/CD

GitHub Actions automatically runs the frontend TypeScript check and production build whenever changes are pushed to `main`.

The production frontend is deployed to GitHub Pages.

The project uses a separate Vite build mode for the Chrome extension so the extension and GitHub Pages deployment can use their own paths.

## Security

API keys, OAuth credentials, and Firebase credentials are kept outside the repository using environment variables and local credential files.

The Gmail integration uses Google's OAuth flow and requests the permissions needed to read and modify the user's email.

## Why I Built It

I wanted a project that was more than just an AI chatbot. Inbox Copilot connects several parts of a real application: authentication, an external API, AI processing, a backend, persistent storage, a React interface, and a browser extension.

It also solves a problem I actually have, which is turning a crowded inbox into a manageable list of things I need to do.

