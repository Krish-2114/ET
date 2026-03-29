from pydantic import BaseModel
from typing import List

class LifeEventRequest(BaseModel):
    event_type: str
    current_income: float
    current_savings: float
    event_amount: float

class LifeEventResponse(BaseModel):
    immediate_actions: List[str]
    hidden_risks: List[str]
    plan_adjustments: str