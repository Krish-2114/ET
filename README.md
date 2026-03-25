# AI Money Mentor

Hackathon-ready, AI-powered personal finance platform for Indian users.

## Tech Stack

- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS
- Backend: FastAPI (Python)
- Database-ready backend structure with SQLAlchemy + PostgreSQL config
- No Docker

## Project Structure

- `frontend/` - Next.js app shell and module routes
- `backend/` - FastAPI app with modular architecture
- `shared/` - reserved for shared types/interfaces

## Phase 1 Included

- Modular FastAPI backend (`routes/`, `services/`, `models/`, `schemas/`)
- Health endpoint and mock user endpoints
- Next.js dashboard shell and all required route pages
- Reusable UI components (cards, buttons, inputs)
- Mock data system
- Global financial disclaimer
- Environment examples for frontend and backend

## Run Locally (No Docker)

### 1) Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend URL: `http://localhost:8000`  
Health check: `http://localhost:8000/api/health`

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:3000`

## Environment Files

- Copy `backend/.env.example` to `backend/.env`
- Copy `frontend/.env.example` to `frontend/.env.local`

## Financial Note

All values are in INR. Calculations and AI recommendations in future phases should be treated as educational guidance and not guaranteed outcomes.

