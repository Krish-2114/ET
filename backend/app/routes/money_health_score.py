from fastapi import APIRouter

from app.schemas.money_health_score import MoneyHealthScoreInputs, MoneyHealthScoreResponse
from app.services.money_health_score_service import compute_money_health_score

router = APIRouter(prefix="/money-health-score", tags=["money-health-score"])


@router.post("/score", response_model=MoneyHealthScoreResponse)
def score_money_health(payload: MoneyHealthScoreInputs) -> MoneyHealthScoreResponse:
    return compute_money_health_score(payload)

