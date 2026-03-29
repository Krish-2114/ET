from fastapi import APIRouter
from app.schemas.life_event import LifeEventRequest, LifeEventResponse
from app.services.life_event_service import analyze_life_event

router = APIRouter()

@router.post("/analyze", response_model=LifeEventResponse)
def analyze_event(data: LifeEventRequest):
    return analyze_life_event(data)