from fastapi import APIRouter, HTTPException
from app.schemas.tax_schemas import TaxInput, TaxOutput
from app.services.tax_service import calculate_tax

router = APIRouter(prefix="/tax", tags=["Tax Wizard"])


@router.post("/calculate", response_model=TaxOutput)
async def calculate_tax_plan(data: TaxInput):
    """
    Calculate income tax under Old and New regime for FY 2024-25.

    Returns:
    - Tax under both regimes with slab breakdown
    - Recommended regime
    - Deduction breakdown
    - Tax saving tips
    - AI explanation

    All values in INR. For informational purposes only.
    """
    try:
        result = calculate_tax(data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")


@router.get("/regimes")
async def get_regime_info():
    """Returns FY 2024-25 tax slab info for both regimes."""
    return {
        "financial_year": "2024-25",
        "assessment_year": "2025-26",
        "old_regime_slabs": [
            {"upto": "2,50,000", "rate": "Nil"},
            {"upto": "5,00,000", "rate": "5%"},
            {"upto": "10,00,000", "rate": "20%"},
            {"above": "10,00,000", "rate": "30%"},
        ],
        "new_regime_slabs": [
            {"upto": "3,00,000", "rate": "Nil"},
            {"upto": "7,00,000", "rate": "5%"},
            {"upto": "10,00,000", "rate": "10%"},
            {"upto": "12,00,000", "rate": "15%"},
            {"upto": "15,00,000", "rate": "20%"},
            {"above": "15,00,000", "rate": "30%"},
        ],
        "standard_deduction_old": 50000,
        "standard_deduction_new": 75000,
        "cess": "4%",
        "rebate_87a_old": "Up to ₹12,500 if income ≤ ₹5L",
        "rebate_87a_new": "Up to ₹25,000 if income ≤ ₹7L",
    }