from pydantic import BaseModel, Field
from typing import List, Optional


class TaxInput(BaseModel):
    # Income
    basic_salary: float = Field(..., gt=0, description="Basic salary per annum in INR")
    hra_received: float = Field(0, ge=0, description="HRA received per annum in INR")
    special_allowance: float = Field(0, ge=0, description="Special allowance per annum in INR")
    other_income: float = Field(0, ge=0, description="Other income (interest, freelance etc) in INR")

    # HRA exemption inputs
    rent_paid_annual: float = Field(0, ge=0, description="Annual rent paid in INR")
    is_metro: bool = Field(False, description="Living in metro city (Mumbai, Delhi, Kolkata, Chennai)")

    # Deductions — Chapter VI A
    section_80c: float = Field(0, ge=0, le=150000, description="80C investments (PF, ELSS, LIC etc) max 1.5L")
    section_80d_self: float = Field(0, ge=0, le=25000, description="80D health insurance self/family max 25k")
    section_80d_parents: float = Field(0, ge=0, le=50000, description="80D health insurance parents max 50k")
    section_80ccd_nps: float = Field(0, ge=0, le=50000, description="80CCD(1B) NPS additional contribution max 50k")
    home_loan_interest: float = Field(0, ge=0, le=200000, description="Home loan interest 24(b) max 2L")
    other_deductions: float = Field(0, ge=0, description="Any other eligible deductions in INR")

    # Age
    age: int = Field(30, ge=18, le=100, description="Age for senior citizen benefit check")


class DeductionBreakdown(BaseModel):
    name: str
    amount: float
    section: str
    applicable: bool
    note: str


class RegimeComparison(BaseModel):
    regime: str
    gross_income: float
    total_deductions: float
    taxable_income: float
    tax_before_cess: float
    cess: float
    total_tax: float
    effective_tax_rate: float
    monthly_tax: float
    in_hand_monthly: float
    slab_breakdown: List[dict]


class TaxOutput(BaseModel):
    gross_total_income: float
    recommended_regime: str
    tax_savings_by_switching: float

    old_regime: RegimeComparison
    new_regime: RegimeComparison

    deduction_breakdown: List[DeductionBreakdown]
    total_deductions_old: float
    hra_exemption: float

    ai_explanation: str
    tax_saving_tips: List[str]

    financial_year: str
    assessment_year: str
    disclaimer: str