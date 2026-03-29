from fastapi import APIRouter
from app.schemas.couple import CoupleProfileRequest, CouplePlanResponse
from app.services.couple_service import calculate_couple_plan

router = APIRouter()

@router.post("/optimize", response_model=CouplePlanResponse)
def optimize_couple_finances(data: CoupleProfileRequest):
    return calculate_couple_plan(data)