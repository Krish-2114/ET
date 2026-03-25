from pydantic import BaseModel, Field


class MoneyHealthScoreInputs(BaseModel):
    income_inr_monthly: float = Field(..., ge=0)
    expenses_inr_monthly: float = Field(..., ge=0)

    # Liquid emergency fund (cash + liquid equivalents) in INR.
    savings_inr: float = Field(..., ge=0)

    # Life cover amount (proxy) in INR.
    insurance_inr: float = Field(..., ge=0)

    # Total monthly loan payments (EMIs/instalments) in INR.
    loans_inr_monthly: float = Field(..., ge=0)

    # Current diversified investments corpus in INR (proxy).
    investments_inr: float = Field(..., ge=0)


class CategoryScore(BaseModel):
    score: float = Field(..., ge=0, le=100)
    why: str
    improvement: str


class MoneyHealthScoreResponse(BaseModel):
    overall_score: float = Field(..., ge=0, le=100)
    categories: dict[str, CategoryScore]
    improvement_suggestions: list[str]
    assumptions: dict[str, str]

