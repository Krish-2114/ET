from app.routes import health, users, money_health_score, fire, tax
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import health, users, money_health_score, fire

app = FastAPI(
    title="AI Money Mentor API",
    description="Backend API for AI-powered personal finance mentor.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(money_health_score.router, prefix="/api")
app.include_router(fire.router, prefix="/api")

app.include_router(tax.router, prefix="/api")