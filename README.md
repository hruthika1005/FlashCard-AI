<img width="1110" height="831" alt="Screenshot 2026-07-05 151437" src="https://github.com/user-attachments/assets/ffcf6c83-6091-4dc1-b5a3-da03488ab733" />
<img width="1902" height="918" alt="Screenshot 2026-07-05 151822" src="https://github.com/user-attachments/assets/bc5756f0-4614-4df6-9c75-c4363e809deb" />
<img width="1908" height="922" alt="Screenshot 2026-07-05 151838" src="https://github.com/user-attachments/assets/7c1489af-0124-4363-8ce4-3189f50d6742" />
<img width="1902" height="922" alt="Screenshot 2026-07-05 151853" src="https://github.com/user-attachments/assets/8fbab6a8-d96b-4aa0-a578-2b78e908dfb1" />
<img width="1906" height="928" alt="Screenshot 2026-07-05 151900" src="https://github.com/user-attachments/assets/27e2b3c0-e260-42f2-b8d7-b6c76bcef5da" />
<img width="1917" height="923" alt="Screenshot 2026-07-05 151907" src="https://github.com/user-attachments/assets/3fce8979-4b42-49ee-9c45-e4621b49a30f" />
<img width="1898" height="923" alt="Screenshot 2026-07-05 151917" src="https://github.com/user-attachments/assets/d59a00bd-04a1-4b92-a9ac-3c8cadc61f9d" />
# AI Flashcard Generator

A full-stack, production-ready SaaS application that turns handwritten or typed notes (PDF/image) into high-quality, AI-generated flashcards — complete with spaced repetition, quiz mode, statistics, and a modern glassmorphism UI.
"Web-App" : https://flash-card-ai-orpin.vercel.app

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- Framer Motion
- Recharts

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt

### AI
- Google Gemini 2.5 Flash
- Tesseract OCR

### Storage
- Cloudinary

### Deployment
- Vercel (Frontend)
- Render (Backend)

## Features

- Register / Login (JWT auth, bcrypt password hashing)
- Upload notes as PDF or image
- OCR text extraction using Tesseract.js
- AI flashcard generation using Google Gemini 2.5 Flash, grounded strictly in the extracted text (no hallucination by design)
- Flashcards organized by Subject → Chapter → Topic
- Full CRUD, search, tag filtering, pagination
- Favorites
- Study Mode with SM-2 spaced repetition scheduling
- Quiz Mode with auto-generated multiple choice questions
- Dashboard with charts (difficulty breakdown, top subjects)
- Statistics page (accuracy rate, streak, cards per chapter)
- User profile with avatar upload
- Dark mode
- Rate limiting, input validation, centralized error handling, structured logging

## Project Structure

```
ai-flashcard-generator/
├── backend/
│   └── src/
│       ├── config/       # db, cloudinary, googleVision, openai
│       ├── models/       # User, Flashcard, Note
│       ├── controllers/  # auth, user, flashcard, upload, stats
│       ├── routes/
│       ├── middleware/   # auth, error, validate, upload, rateLimiter
│       ├── services/     # ocrService, aiService
│       ├── utils/        # logger, ApiError, ApiResponse, asyncHandler, spacedRepetition
│       ├── app.js
│       └── server.js
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── context/      # AuthContext, ThemeContext
│       ├── services/     # axios API clients
│       ├── App.jsx
│       └── main.jsx
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Node.js 18+
- MongoDB (local install or MongoDB Atlas)
- A Cloudinary account (free tier is fine)
- A Google Cloud project with the **Vision API** enabled and a service-account JSON key
- An OpenAI API key

## Setup — Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and fill in:
- `MONGO_URI` — your MongoDB connection string
- `JWT_SECRET` — any long random string
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — from your Cloudinary dashboard
- `GOOGLE_APPLICATION_CREDENTIALS` — path to your downloaded Google Vision service-account JSON key (place the file at `backend/src/config/google-vision-key.json`, which is already git-ignored)
- `OPENAI_API_KEY` — from platform.openai.com

Run the backend:
```bash
npm run dev      # development, with nodemon
npm start        # production
```

The API will be available at `http://localhost:5000/api`. Health check: `GET /api/health`.

## Setup — Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `frontend/.env` if your backend runs somewhere other than `http://localhost:5000/api`.

Run the frontend:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Getting Your API Keys

**Cloudinary:** Sign up at cloudinary.com → Dashboard → copy Cloud Name, API Key, API Secret.

**Google Cloud Vision:**
1. Create a project at console.cloud.google.com
2. Enable the "Cloud Vision API"
3. Create a Service Account → grant it the "Cloud Vision AI Service Agent" role (or Editor for simplicity in dev)
4. Create a JSON key for that service account and download it
5. Save it as `backend/src/config/google-vision-key.json`

**OpenAI:** Create a key at platform.openai.com/api-keys.

## Running with Docker

Once your `backend/.env` is filled in and your Google Vision key is at `backend/src/config/google-vision-key.json`:

```bash
docker-compose up --build
```

This starts MongoDB, the backend API (port 5000), and the frontend served via nginx (port 80).

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/change-password` | Change password |
| PUT | `/api/users/profile` | Update profile |
| PUT | `/api/users/avatar` | Upload avatar |
| POST | `/api/upload/generate` | Upload note file → OCR → AI → flashcards |
| GET | `/api/upload/history` | List uploaded notes |
| GET | `/api/flashcards` | List/search/filter/paginate flashcards |
| POST | `/api/flashcards` | Create a flashcard manually |
| GET/PUT/DELETE | `/api/flashcards/:id` | Read/update/delete a flashcard |
| PATCH | `/api/flashcards/:id/favorite` | Toggle favorite |
| GET | `/api/flashcards/study/due` | Get cards due for review |
| POST | `/api/flashcards/:id/review` | Submit SM-2 review (quality 0-5) |
| POST | `/api/flashcards/:id/quiz-result` | Submit quiz answer result |
| GET | `/api/stats/dashboard` | Dashboard summary stats |
| GET | `/api/stats/detailed` | Accuracy, streak, chapter breakdown |

All routes except `/auth/register` and `/auth/login` require an `Authorization: Bearer <token>` header.

## Notes on the AI Pipeline

1. The uploaded file is stored on Cloudinary and a `Note` record is created.
2. Text is extracted: PDFs use `pdf-parse` (text-layer PDFs); images use Google Vision's document text detection. Scanned PDFs without a text layer are rejected with a message asking the user to upload as an image instead — this keeps extraction accurate and predictable rather than guessing.
3. Extracted text is chunked (~6000 characters per chunk, split on paragraph boundaries) and sent to OpenAI with a strict system prompt that forbids hallucination, requires JSON-mode structured output, and asks for concise questions, accurate answers, mnemonics where useful, and Subject/Chapter/Topic classification.
4. Generated flashcards are validated and persisted with `sourceNoteId` for traceability.

## License

MIT
