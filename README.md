# AI Money Mentor

Hackathon-ready, AI-powered personal finance platform for Indian users.

## Tech Stack
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend:** FastAPI (Python)
- **Database-ready:** SQLAlchemy + PostgreSQL config
- **No Docker required**

## Project Structure
- `frontend/` - Next.js app shell and module routes
- `backend/` - FastAPI app with modular architecture
- `shared/` - reserved for shared types/interfaces

## Features

### Phase 1 — Foundation
- Modular FastAPI backend (routes, services, models, schemas)
- Next.js dashboard shell with all module routes
- Reusable UI components (cards, buttons, inputs)
- Mock data system
- Global financial disclaimer
- Environment examples for frontend and backend

### Phase 2 — Money Health Score
- Multi-step financial health assessment
- Scoring engine across 5 categories
- Visual score display with Recharts

### Phase 3 — FIRE Planner
- FIRE corpus calculator (25x rule)
- Inflation-adjusted projections
- Monthly SIP needed to reach FIRE
- Year-by-year corpus growth chart
- Milestone cards (25%, 50%, 75%, 100%)
- AI explanation of your FIRE plan

### Phase 4 — Tax Wizard
- FY 2024-25 old vs new regime comparison
- Full deductions engine (80C, 80D, HRA, NPS, Home Loan)
- Monthly in-hand salary calculator
- Slab-by-slab breakdown
- AI recommendation on which regime to pick

### Phase 6 — Couple Planner
-Income-Proportional Split: Automatically calculates fair expense sharing based on each partner's relative salary.
-Joint Goal Sync: Maps out shared monthly SIP requirements for milestones like home buying or weddings.
-Tax Optimization: Identifies the optimal partner to claim specific deductions to lower total household tax.

### Phase 7: Life Event Advisor
-Major Life Simulations: Instant advice for events like having a baby, switching jobs, or receiving a bonus.
-Risk Mitigation Recommendation: Flags "Hidden Risks" like lifestyle creep or liquidity gaps during unpaid leave.
-FIRE Impact Analysis: Estimates how specific events will either speed up or delay your retirement timeline.
## Run Locally (No Docker)

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Backend: http://localhost:8000
API Docs: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:3000

## Environment Files
- Copy `backend/.env.example` to `backend/.env`
- Copy `frontend/.env.example` to `frontend/.env.local`

## Financial Disclaimer
All values are in INR. All calculations and AI recommendations are for educational purposes only and should not be treated as financial advice or guaranteed outcomes.
