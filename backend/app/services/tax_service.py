from app.schemas.tax_schemas import (
    TaxInput, TaxOutput, RegimeComparison, DeductionBreakdown
)

# ─── FY 2024-25 Tax Slabs ────────────────────────────────────────────────────

# Old Regime slabs (below 60 years)
OLD_REGIME_SLABS = [
    (250000, 0.00),
    (500000, 0.05),
    (1000000, 0.20),
    (float("inf"), 0.30),
]

# Old Regime slabs for Senior Citizens (60-80 years)
OLD_REGIME_SLABS_SENIOR = [
    (300000, 0.00),
    (500000, 0.05),
    (1000000, 0.20),
    (float("inf"), 0.30),
]

# Old Regime slabs for Super Senior Citizens (80+ years)
OLD_REGIME_SLABS_SUPER_SENIOR = [
    (500000, 0.00),
    (1000000, 0.20),
    (float("inf"), 0.30),
]

# New Regime slabs FY 2024-25 (revised)
NEW_REGIME_SLABS = [
    (300000, 0.00),
    (700000, 0.05),
    (1000000, 0.10),
    (1200000, 0.15),
    (1500000, 0.20),
    (float("inf"), 0.30),
]

CESS_RATE = 0.04  # 4% health and education cess
STANDARD_DEDUCTION_OLD = 50000
STANDARD_DEDUCTION_NEW = 75000  # increased in Budget 2024
REBATE_87A_OLD = 12500   # rebate if taxable income <= 5L old regime
REBATE_87A_NEW = 25000   # rebate if taxable income <= 7L new regime


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _calculate_tax_from_slabs(taxable_income: float, slabs: list) -> tuple[float, list]:
    """
    Calculate tax from slab structure.
    Returns (total_tax_before_cess, slab_breakdown)
    """
    tax = 0.0
    breakdown = []
    previous_limit = 0

    for limit, rate in slabs:
        if taxable_income <= previous_limit:
            break

        slab_income = min(taxable_income, limit) - previous_limit
        slab_tax = slab_income * rate

        if slab_income > 0:
            breakdown.append({
                "slab": f"₹{previous_limit:,.0f} – {'Above ₹' + f'{previous_limit:,.0f}' if limit == float('inf') else '₹' + f'{limit:,.0f}'}",
                "income_in_slab": round(slab_income, 2),
                "rate": f"{rate * 100:.0f}%",
                "tax": round(slab_tax, 2),
            })

        tax += slab_tax
        previous_limit = limit

    return tax, breakdown


def _get_old_regime_slabs(age: int) -> list:
    if age >= 80:
        return OLD_REGIME_SLABS_SUPER_SENIOR
    elif age >= 60:
        return OLD_REGIME_SLABS_SENIOR
    return OLD_REGIME_SLABS


def _calculate_hra_exemption(
    basic_salary: float,
    hra_received: float,
    rent_paid_annual: float,
    is_metro: bool,
) -> float:
    """
    HRA exemption = minimum of:
    1. Actual HRA received
    2. 50% of basic (metro) or 40% of basic (non-metro)
    3. Rent paid - 10% of basic salary
    """
    if hra_received <= 0 or rent_paid_annual <= 0:
        return 0.0

    rule1 = hra_received
    rule2 = basic_salary * (0.50 if is_metro else 0.40)
    rule3 = max(0, rent_paid_annual - (basic_salary * 0.10))

    return min(rule1, rule2, rule3)


def _apply_rebate_87a(tax: float, taxable_income: float, regime: str) -> float:
    """Apply Section 87A rebate."""
    if regime == "old" and taxable_income <= 500000:
        return max(0, tax - REBATE_87A_OLD)
    elif regime == "new" and taxable_income <= 700000:
        return max(0, tax - REBATE_87A_NEW)
    return tax


def _build_regime(
    taxable_income: float,
    gross_income: float,
    total_deductions: float,
    slabs: list,
    regime: str,
    monthly_gross: float,
) -> RegimeComparison:
    taxable_income = max(0, taxable_income)
    tax_before_cess, slab_breakdown = _calculate_tax_from_slabs(taxable_income, slabs)
    tax_after_rebate = _apply_rebate_87a(tax_before_cess, taxable_income, regime)
    cess = tax_after_rebate * CESS_RATE
    total_tax = tax_after_rebate + cess
    effective_rate = (total_tax / gross_income * 100) if gross_income > 0 else 0
    monthly_tax = total_tax / 12
    in_hand = monthly_gross - monthly_tax

    return RegimeComparison(
        regime=regime,
        gross_income=round(gross_income, 2),
        total_deductions=round(total_deductions, 2),
        taxable_income=round(taxable_income, 2),
        tax_before_cess=round(tax_after_rebate, 2),
        cess=round(cess, 2),
        total_tax=round(total_tax, 2),
        effective_tax_rate=round(effective_rate, 2),
        monthly_tax=round(monthly_tax, 2),
        in_hand_monthly=round(in_hand, 2),
        slab_breakdown=slab_breakdown,
    )


# ─── Main calculation ─────────────────────────────────────────────────────────

def calculate_tax(data: TaxInput) -> TaxOutput:
    # Step 1: Gross total income
    gross_income = (
        data.basic_salary
        + data.hra_received
        + data.special_allowance
        + data.other_income
    )
    monthly_gross = gross_income / 12

    # Step 2: HRA exemption
    hra_exemption = _calculate_hra_exemption(
        data.basic_salary,
        data.hra_received,
        data.rent_paid_annual,
        data.is_metro,
    )

    # Step 3: Build deduction breakdown for old regime
    deductions = []

    deductions.append(DeductionBreakdown(
        name="Standard deduction",
        amount=STANDARD_DEDUCTION_OLD,
        section="16(ia)",
        applicable=True,
        note="Flat ₹50,000 deduction for salaried employees"
    ))

    deductions.append(DeductionBreakdown(
        name="HRA exemption",
        amount=round(hra_exemption, 2),
        section="10(13A)",
        applicable=hra_exemption > 0,
        note="Min of: actual HRA, 50%/40% of basic, rent paid - 10% of basic"
    ))

    deductions.append(DeductionBreakdown(
        name="Section 80C",
        amount=min(data.section_80c, 150000),
        section="80C",
        applicable=data.section_80c > 0,
        note="PF, ELSS, PPF, LIC, tuition fees — max ₹1.5L"
    ))

    deductions.append(DeductionBreakdown(
        name="Health insurance (self)",
        amount=min(data.section_80d_self, 25000),
        section="80D",
        applicable=data.section_80d_self > 0,
        note="Health insurance premium for self and family — max ₹25,000"
    ))

    deductions.append(DeductionBreakdown(
        name="Health insurance (parents)",
        amount=min(data.section_80d_parents, 50000),
        section="80D",
        applicable=data.section_80d_parents > 0,
        note="Health insurance for parents — max ₹50,000 (₹25k if below 60)"
    ))

    deductions.append(DeductionBreakdown(
        name="NPS contribution",
        amount=min(data.section_80ccd_nps, 50000),
        section="80CCD(1B)",
        applicable=data.section_80ccd_nps > 0,
        note="Additional NPS contribution over and above 80C — max ₹50,000"
    ))

    deductions.append(DeductionBreakdown(
        name="Home loan interest",
        amount=min(data.home_loan_interest, 200000),
        section="24(b)",
        applicable=data.home_loan_interest > 0,
        note="Interest on home loan for self-occupied property — max ₹2L"
    ))

    if data.other_deductions > 0:
        deductions.append(DeductionBreakdown(
            name="Other deductions",
            amount=data.other_deductions,
            section="Various",
            applicable=True,
            note="Other eligible deductions"
        ))

    # Step 4: Total deductions for old regime
    total_deductions_old = sum(d.amount for d in deductions if d.applicable)

    # Taxable income for old regime
    # Note: HRA exemption reduces gross income directly (not from taxable income)
    gross_after_hra = gross_income - hra_exemption
    taxable_old = gross_after_hra - total_deductions_old + hra_exemption
    # Correct approach: standard deductions from gross, HRA already exempt
    taxable_old = (
        gross_income
        - hra_exemption
        - STANDARD_DEDUCTION_OLD
        - min(data.section_80c, 150000)
        - min(data.section_80d_self, 25000)
        - min(data.section_80d_parents, 50000)
        - min(data.section_80ccd_nps, 50000)
        - min(data.home_loan_interest, 200000)
        - data.other_deductions
    )

    # Step 5: New regime — only standard deduction allowed
    taxable_new = gross_income - STANDARD_DEDUCTION_NEW

    # Step 6: Build both regimes
    old_slabs = _get_old_regime_slabs(data.age)

    old_regime = _build_regime(
        taxable_income=taxable_old,
        gross_income=gross_income,
        total_deductions=total_deductions_old,
        slabs=old_slabs,
        regime="old",
        monthly_gross=monthly_gross,
    )

    new_regime = _build_regime(
        taxable_income=taxable_new,
        gross_income=gross_income,
        total_deductions=STANDARD_DEDUCTION_NEW,
        slabs=NEW_REGIME_SLABS,
        regime="new",
        monthly_gross=monthly_gross,
    )

    # Step 7: Recommendation
    recommended = "new" if new_regime.total_tax <= old_regime.total_tax else "old"
    savings = abs(old_regime.total_tax - new_regime.total_tax)

    # Step 8: AI explanation
    better = "New Regime" if recommended == "new" else "Old Regime"
    worse = "Old Regime" if recommended == "new" else "New Regime"
    ai_explanation = (
        f"Based on your salary structure, the {better} saves you ₹{savings:,.0f} in tax this year. "
        f"Under the Old Regime your taxable income is ₹{old_regime.taxable_income:,.0f} after deductions of "
        f"₹{total_deductions_old:,.0f} (80C, HRA, 80D etc). "
        f"Under the New Regime your taxable income is ₹{new_regime.taxable_income:,.0f} with only the "
        f"₹75,000 standard deduction. "
        f"The Old Regime benefits you more if your total deductions exceed approximately "
        f"₹{STANDARD_DEDUCTION_NEW + 150000 + 50000:,.0f}. "
        f"Your current deductions are ₹{total_deductions_old:,.0f} — "
        f"{'which justifies staying in the Old Regime.' if recommended == 'old' else 'which is not enough to beat the New Regime slabs.'}"
    )

    # Step 9: Tax saving tips
    tips = []
    if data.section_80c < 150000:
        gap = 150000 - data.section_80c
        tips.append(
            f"You have ₹{gap:,.0f} unused 80C limit. Invest in ELSS, PPF, or increase PF "
            f"contribution to save up to ₹{gap * 0.30:,.0f} in tax."
        )
    if data.section_80ccd_nps < 50000:
        tips.append(
            "Contribute to NPS under 80CCD(1B) to get an additional ₹50,000 deduction "
            "over and above the 80C limit — saves up to ₹15,600 extra."
        )
    if data.section_80d_self < 25000:
        tips.append(
            "Buy a health insurance policy to claim up to ₹25,000 under 80D. "
            "This also protects you from medical emergencies."
        )
    if data.home_loan_interest == 0:
        tips.append(
            "If you plan to buy a home, home loan interest up to ₹2L is deductible under 24(b) "
            "in the Old Regime — a significant tax saver."
        )
    if data.rent_paid_annual > 0 and hra_exemption == 0:
        tips.append(
            "You're paying rent but not claiming HRA. Ensure your employer includes HRA "
            "in your salary structure to claim this exemption."
        )
    tips.append(
        "File your ITR on time to avoid penalties and carry forward any losses. "
        "The deadline for salaried individuals is July 31st."
    )

    return TaxOutput(
        gross_total_income=round(gross_income, 2),
        recommended_regime=recommended,
        tax_savings_by_switching=round(savings, 2),
        old_regime=old_regime,
        new_regime=new_regime,
        deduction_breakdown=deductions,
        total_deductions_old=round(total_deductions_old, 2),
        hra_exemption=round(hra_exemption, 2),
        ai_explanation=ai_explanation,
        tax_saving_tips=tips,
        financial_year="2024-25",
        assessment_year="2025-26",
        disclaimer="Tax calculations are indicative only. Consult a CA for filing. Rules subject to change.",
    )