# LangLab

## Overview

This project consists of a React frontend and an Express backend providing an AI-driven Mandarin chat tutoring experience. Learners progress through levels (beginner, intermediate, advanced, progression), practice conversation, and receive instant feedback, including optional English and pinyin output.

UI Components Used:
- https://www.shadcnui-blocks.com/blocks
- https://shadcn-chatbot-kit.vercel.app/docs/components/chat

---

## Prerequisites

- Node.js 18+
- pnpm
- A Firebase project with Authentication and Firestore enabled
- An OpenAI API key

---

## Environment Variables

Frontend (.env file at frontend/.env):
    VITE_FIREBASE_API_KEY=
    VITE_FIREBASE_AUTH_DOMAIN=
    VITE_FIREBASE_PROJECT_ID=
    VITE_FIREBASE_STORAGE_BUCKET=
    VITE_FIREBASE_MESSAGING_SENDER_ID=
    VITE_FIREBASE_APP_ID=
    VITE_API_BASE_URL=   Example: http://localhost:8080

Backend (.env file at backend/.env):
    PORT=8080
    OPENAI_API_KEY=

---

## Setup

1. Clone the repo:
       git clone <your-repo-url>
2. Install dependencies in each directory:
    In frontend/ run:
        pnpm install
    In backend/ run:
        pnpm install

---

## Development

### Frontend

1. `cd frontend`
2. `pnpm run dev`
3. Opens at http://localhost:5173

### Backend

1. `cd backend`
2. `pnpm run dev`  or `pnpm run start`
3. API server at http://localhost:8080

---

## Usage

1. Sign up or log in via the frontend.
2. Choose a chat mode.
3. Read the generated scenario.
4. Type your Mandarin message. (speaking not yet available)
5. Receive AI responses at your level.
6. Toggle English + pinyin output as needed.
7. End session to get detailed feedback and per-message grading.
8. Review results and new words learned.

---
