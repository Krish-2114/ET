from pydantic import BaseModel, Field, validator
from typing import List, Optional


class FIREInput(BaseModel):
    current_age: int = Field(..., ge=18, le=70, description="Current age in years")
    target_retirement_age: int = Field(..., ge=25, le=80, description="Age you want to retire")
    monthly_income: float = Field(..., gt=0, description="Monthly take-home income in INR")
    monthly_expenses: float = Field(..., gt=0, description="Current monthly expenses in INR")
    current_savings: float = Field(..., ge=0, description="Total current savings/investments in INR")
    monthly_sip: Optional[float] = Field(0, ge=0, description="Current monthly SIP/investment in INR")
    expected_monthly_expenses_at_retirement: Optional[float] = Field(
        None, ge=0,
        description="Monthly expenses you expect at retirement (INR). Leave blank to auto-calculate with inflation."
    )

    @validator("target_retirement_age")
    def retirement_must_be_after_current(cls, v, values):
        if "current_age" in values and v <= values["current_age"]:
            raise ValueError("Target retirement age must be greater than current age")
        return v

    @validator("monthly_expenses")
    def expenses_less_than_income(cls, v, values):
        if "monthly_income" in values and v >= values["monthly_income"]:
            raise ValueError("Monthly expenses must be less than monthly income")
        return v


class MilestoneCard(BaseModel):
    year: int
    age: int
    corpus_value: float
    label: str
    description: str
    achieved: bool = False


class YearlyProjection(BaseModel):
    year: int
    age: int
    corpus: float
    sip_contributed: float
    growth_from_existing: float


class FIREOutput(BaseModel):
    # Core numbers
    fire_corpus_needed: float           # Total corpus required at retirement
    current_corpus: float               # Current savings value
    corpus_gap: float                   # How much more is needed
    years_to_fire: int                  # Years left to retirement
    monthly_sip_needed: float           # SIP needed to reach corpus
    current_savings_rate: float         # % of income currently saved

    # Projections
    yearly_projections: List[YearlyProjection]
    milestones: List[MilestoneCard]

    # Retirement details
    inflation_adjusted_monthly_expense: float   # Monthly expense at retirement (inflation adjusted)
    annual_expense_at_retirement: float          # Annual expense at retirement
    corpus_lasts_till_age: int                   # How long corpus will last with 4% withdrawal

    # Assumptions used
    assumed_return_rate: float
    assumed_inflation_rate: float
    equity_allocation: float

    # AI explanation
    ai_explanation: str
    improvement_tips: List[str]

    # Feasibility
    is_achievable: bool
    feasibility_note: str