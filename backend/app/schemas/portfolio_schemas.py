from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class PortfolioHolding(BaseModel):
    scheme_name: str
    amc: str
    category: str
    folio_no: str
    isin: str
    units_held: float = Field(..., ge=0)
    invested_amount: float = Field(..., ge=0)
    avg_cost: float = Field(..., ge=0)
    current_nav: float = Field(..., ge=0)
    current_value: float = Field(..., ge=0)
    gain_loss: float
    weight_percent: float = Field(..., ge=0)
    expense_ratio: float = Field(..., ge=0)


class PortfolioSummary(BaseModel):
    total_invested: float = Field(..., ge=0)
    current_value: float = Field(..., ge=0)
    absolute_gain: float
    absolute_gain_percent: float
    xirr: Optional[float] = None
    weighted_expense_ratio: float = Field(..., ge=0)
    annual_expense_drag_inr: float = Field(..., ge=0)


class ConcentrationAnalysis(BaseModel):
    top_fund_weight: float = Field(..., ge=0)
    top_amc_weight: float = Field(..., ge=0)
    top_category_weight: float = Field(..., ge=0)
    category_weights: Dict[str, float]
    risk_level: str


class OverlapPair(BaseModel):
    fund_a: str
    fund_b: str
    overlap_percent: float = Field(..., ge=0)


class OverlapAnalysis(BaseModel):
    portfolio_overlap_score: float = Field(..., ge=0)
    pairs: List[OverlapPair]


class PortfolioAnalysisResponse(BaseModel):
    investor_name: str
    as_of_date: str
    summary: PortfolioSummary
    holdings: List[PortfolioHolding]
    concentration: ConcentrationAnalysis
    overlap: OverlapAnalysis
    insights: List[str]
    rebalance_suggestions: List[str]
    warnings: List[str]