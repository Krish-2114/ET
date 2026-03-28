from app.schemas.fire_schemas import FIREInput, FIREOutput, MilestoneCard, YearlyProjection
from app.core.config import settings
import math

INFLATION_RATE = settings.inflation_rate
EQUITY_RETURN = settings.expected_annual_return
FIRE_MULTIPLIER = 25
EQUITY_ALLOCATION_AGGRESSIVE = 0.80
EQUITY_ALLOCATION_MODERATE = 0.60
EQUITY_ALLOCATION_CONSERVATIVE = 0.40


def _get_blended_return(years_to_retirement: int) -> tuple[float, float]:
    if years_to_retirement >= 15:
        equity = EQUITY_ALLOCATION_AGGRESSIVE
    elif years_to_retirement >= 8:
        equity = EQUITY_ALLOCATION_MODERATE
    else:
        equity = EQUITY_ALLOCATION_CONSERVATIVE

    debt = 1 - equity
    blended = (equity * EQUITY_RETURN) + (debt * 0.07)
    return round(blended, 4), equity


def _future_value_lumpsum(present_value: float, rate: float, years: int) -> float:
    return present_value * math.pow(1 + rate, years)


def _future_value_sip(monthly_sip: float, annual_rate: float, years: int) -> float:
    if monthly_sip <= 0:
        return 0.0
    monthly_rate = annual_rate / 12
    n = years * 12
    if monthly_rate == 0:
        return monthly_sip * n
    fv = monthly_sip * (((math.pow(1 + monthly_rate, n) - 1) / monthly_rate) * (1 + monthly_rate))
    return fv


def _sip_needed_for_target(target: float, existing_fv: float, annual_rate: float, years: int) -> float:
    gap = target - existing_fv
    if gap <= 0:
        return 0.0
    monthly_rate = annual_rate / 12
    n = years * 12
    if monthly_rate == 0:
        return gap / n
    sip = gap * monthly_rate / ((math.pow(1 + monthly_rate, n) - 1) * (1 + monthly_rate))
    return max(0.0, sip)


def _corpus_duration(corpus: float, monthly_withdrawal: float, annual_return: float) -> int:
    if monthly_withdrawal <= 0:
        return 60
    monthly_return = annual_return / 12
    if monthly_return == 0:
        return int(corpus / monthly_withdrawal / 12)
    try:
        val = 1 - (corpus * monthly_return / monthly_withdrawal)
        if val <= 0:
            return 60
        n_months = -math.log(val) / math.log(1 + monthly_return)
        return min(60, int(n_months / 12))
    except (ValueError, ZeroDivisionError):
        return 60


def _build_yearly_projections(
    current_savings: float,
    monthly_sip: float,
    annual_return: float,
    years: int,
    current_age: int,
) -> list[YearlyProjection]:
    projections = []
    corpus = current_savings
    total_sip_contributed = 0.0

    for y in range(1, years + 1):
        growth = corpus * annual_return
        sip_this_year = monthly_sip * 12
        corpus = corpus + growth + sip_this_year
        total_sip_contributed += sip_this_year

        projections.append(YearlyProjection(
            year=y,
            age=current_age + y,
            corpus=round(corpus, 2),
            sip_contributed=round(total_sip_contributed, 2),
            growth_from_existing=round(growth, 2),
        ))

    return projections


def _build_milestones(
    projections: list[YearlyProjection],
    fire_corpus: float,
    current_age: int,
) -> list[MilestoneCard]:
    milestones = []
    targets = [
        (0.25, "25% of FIRE corpus", "You've built a solid base. Keep the SIP running."),
        (0.50, "Halfway to FIRE", "Compounding is now your biggest ally. Don't stop."),
        (0.75, "75% of FIRE corpus", "You're in the final stretch. Review your allocation."),
        (1.00, "FIRE corpus reached!", "Financial independence achieved. You can retire now."),
    ]
    added = set()

    for proj in projections:
        for ratio, label, desc in targets:
            target_val = fire_corpus * ratio
            key = ratio
            if key not in added and proj.corpus >= target_val:
                milestones.append(MilestoneCard(
                    year=proj.year,
                    age=proj.age,
                    corpus_value=round(proj.corpus, 2),
                    label=label,
                    description=desc,
                    achieved=(ratio <= 1.0),
                ))
                added.add(key)

    return milestones


def _improvement_tips(
    savings_rate: float,
    years_to_fire: int,
    is_achievable: bool,
    sip_needed: float,
    monthly_income: float,
) -> list[str]:
    tips = []

    if savings_rate < 0.20:
        tips.append(
            "Your savings rate is below 20%. Try to cut discretionary expenses — "
            "even a 5% increase in savings rate can shave years off your FIRE timeline."
        )
    if not is_achievable:
        tips.append(
            "The required SIP exceeds your current savings capacity. "
            "Consider increasing income, reducing expenses, or extending your retirement age by 2-3 years."
        )
    if years_to_fire > 20:
        tips.append(
            "With 20+ years, you can afford 80%+ equity allocation for higher compounding. "
            "Index funds and diversified equity mutual funds work well for this horizon."
        )
    if sip_needed > 0 and (sip_needed / monthly_income) > 0.5:
        tips.append(
            "The required SIP is more than 50% of your income. "
            "Explore side income streams or look at tax-saving instruments like ELSS to reduce tax burden."
        )
    tips.append(
        "Review your FIRE plan annually. Salary increments, bonuses, and lifestyle changes "
        "all affect your timeline. Step up SIP by 10% every year if possible."
    )
    tips.append(
        "Maintain 6 months of expenses as an emergency fund in a liquid fund — "
        "this prevents breaking your long-term investments in a crisis."
    )

    return tips


def calculate_fire(data: FIREInput) -> FIREOutput:
    years_to_fire = data.target_retirement_age - data.current_age
    blended_return, equity_allocation = _get_blended_return(years_to_fire)

    if data.expected_monthly_expenses_at_retirement:
        monthly_expense_at_retirement = data.expected_monthly_expenses_at_retirement
    else:
        monthly_expense_at_retirement = data.monthly_expenses * math.pow(
            1 + INFLATION_RATE, years_to_fire
        )

    annual_expense_at_retirement = monthly_expense_at_retirement * 12
    fire_corpus = annual_expense_at_retirement * FIRE_MULTIPLIER
    existing_savings_fv = _future_value_lumpsum(data.current_savings, blended_return, years_to_fire)
    sip_needed = _sip_needed_for_target(fire_corpus, existing_savings_fv, blended_return, years_to_fire)
    corpus_gap = max(0.0, fire_corpus - existing_savings_fv)

    monthly_surplus = data.monthly_income - data.monthly_expenses
    savings_rate = round(monthly_surplus / data.monthly_income, 4)
    is_achievable = sip_needed <= monthly_surplus

    feasibility_note = (
        "Achievable with your current income and savings capacity."
        if is_achievable
        else (
            f"Requires ₹{sip_needed:,.0f}/month SIP which exceeds your current monthly surplus of "
            f"₹{monthly_surplus:,.0f}. Consider extending retirement age or increasing income."
        )
    )

    effective_sip = max(data.monthly_sip or 0, sip_needed)
    projections = _build_yearly_projections(
        data.current_savings, effective_sip, blended_return, years_to_fire, data.current_age
    )

    milestones = _build_milestones(projections, fire_corpus, data.current_age)

    corpus_lasts = data.target_retirement_age + _corpus_duration(
        fire_corpus, monthly_expense_at_retirement, 0.08
    )

    ai_explanation = (
        f"Based on your inputs, you need a retirement corpus of ₹{fire_corpus:,.0f} "
        f"to sustain ₹{monthly_expense_at_retirement:,.0f}/month at age {data.target_retirement_age}. "
        f"This is calculated using the 25x rule — your inflation-adjusted annual expenses multiplied by 25, "
        f"which allows a safe 4% annual withdrawal. "
        f"Your current savings of ₹{data.current_savings:,.0f} will grow to approximately "
        f"₹{existing_savings_fv:,.0f} by retirement at {blended_return*100:.1f}% blended return. "
        f"You need a monthly SIP of ₹{sip_needed:,.0f} to bridge the remaining gap. "
        f"All projections assume {INFLATION_RATE*100:.0f}% annual inflation and "
        f"{blended_return*100:.1f}% annual portfolio return ({equity_allocation*100:.0f}% equity). "
        f"These are estimates — actual returns will vary."
    )

    tips = _improvement_tips(savings_rate, years_to_fire, is_achievable, sip_needed, data.monthly_income)

    return FIREOutput(
        fire_corpus_needed=round(fire_corpus, 2),
        current_corpus=round(data.current_savings, 2),
        corpus_gap=round(corpus_gap, 2),
        years_to_fire=years_to_fire,
        monthly_sip_needed=round(sip_needed, 2),
        current_savings_rate=savings_rate,
        yearly_projections=projections,
        milestones=milestones,
        inflation_adjusted_monthly_expense=round(monthly_expense_at_retirement, 2),
        annual_expense_at_retirement=round(annual_expense_at_retirement, 2),
        corpus_lasts_till_age=corpus_lasts,
        assumed_return_rate=blended_return,
        assumed_inflation_rate=INFLATION_RATE,
        equity_allocation=equity_allocation,
        ai_explanation=ai_explanation,
        improvement_tips=tips,
        is_achievable=is_achievable,
        feasibility_note=feasibility_note,
    )