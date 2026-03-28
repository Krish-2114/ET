from fastapi import APIRouter, HTTPException
from app.schemas.fire_schemas import FIREInput, FIREOutput
from app.services.fire_service import calculate_fire

router = APIRouter(prefix="/fire", tags=["FIRE Planner"])


@router.post("/calculate", response_model=FIREOutput)
async def calculate_fire_plan(data: FIREInput):
    """
    Calculate FIRE (Financial Independence, Retire Early) corpus and roadmap.

    Returns:
    - Required retirement corpus
    - Monthly SIP needed
    - Year-by-year projections
    - Milestone cards
    - AI explanation and improvement tips

    All values in INR. Returns are projections, not guaranteed.
    """
    try:
        result = calculate_fire(data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")


@router.get("/assumptions")
async def get_fire_assumptions():
    """Returns the assumptions used in FIRE calculations for transparency."""
    from app.core.config import (
        INFLATION_RATE, EQUITY_RETURN, FIRE_MULTIPLIER,
        EQUITY_ALLOCATION_AGGRESSIVE, EQUITY_ALLOCATION_MODERATE
    )
    return {
        "inflation_rate": f"{INFLATION_RATE * 100:.0f}%",
        "expected_equity_return": f"{EQUITY_RETURN * 100:.0f}%",
        "fire_multiplier": FIRE_MULTIPLIER,
        "safe_withdrawal_rate": "4%",
        "aggressive_equity_allocation": f"{EQUITY_ALLOCATION_AGGRESSIVE * 100:.0f}%",
        "moderate_equity_allocation": f"{EQUITY_ALLOCATION_MODERATE * 100:.0f}%",
        "note": "These are assumptions for planning purposes only. Actual returns will vary.",
    }