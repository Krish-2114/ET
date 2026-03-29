from pydantic import BaseModel
from typing import List

class IndividualProfile(BaseModel):
    name: str
    income: float
    expenses: float
    tax_regime: str  # 'old' or 'new'

class SharedGoal(BaseModel):
    goal_name: str
    target_amount: float
    years: int

class CoupleProfileRequest(BaseModel):
    user: IndividualProfile
    partner: IndividualProfile
    shared_goals: List[SharedGoal]
    expense_split_preference: str  # e.g., 'proportional' or '50/50'

class GoalSplit(BaseModel):
    goal_name: str
    total_monthly_sip: float
    user_contribution: float
    partner_contribution: float

class CouplePlanResponse(BaseModel):
    total_combined_income: float
    total_combined_expenses: float
    suggested_split_ratio: str
    goal_splits: List[GoalSplit]
    tax_optimization_tips: List[str]
    ai_compatibility_report: str