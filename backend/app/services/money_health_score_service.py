from app.schemas.money_health_score import (
    CategoryScore,
    MoneyHealthScoreInputs,
    MoneyHealthScoreResponse,
)


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def _bucket_score(value: float, buckets: list[tuple[float, float]]) -> float:
    """
    buckets: list of (threshold, score) sorted descending by threshold.
    Returns first matching threshold.
    """
    for threshold, score in buckets:
        if value >= threshold:
            return score
    return buckets[-1][1]


def compute_money_health_score(payload: MoneyHealthScoreInputs) -> MoneyHealthScoreResponse:
    income = payload.income_inr_monthly
    expenses = payload.expenses_inr_monthly
    savings = payload.savings_inr
    insurance = payload.insurance_inr
    loans_emi = payload.loans_inr_monthly
    investments = payload.investments_inr

    monthly_surplus = max(income - expenses, 0.0)
    expenses_safe = max(expenses, 1.0)
    annual_expenses = expenses_safe * 12.0
    annual_income = max(income, 1.0) * 12.0

    # Emergency Fund
    emergency_months = savings / expenses_safe
    emergency_score = _bucket_score(
        emergency_months,
        buckets=[
            (6.0, 100.0),
            (4.0, 85.0),
            (2.0, 65.0),
            (1.0, 40.0),
            (0.0, 15.0),
        ],
    )

    # Insurance (proxy)
    insurance_coverage_ratio = insurance / annual_expenses
    insurance_score = _bucket_score(
        insurance_coverage_ratio,
        buckets=[
            (10.0, 100.0),
            (5.0, 85.0),
            (2.0, 65.0),
            (1.0, 40.0),
            (0.0, 15.0),
        ],
    )

    # Debt (inverse: EMI burden)
    emi_burden = loans_emi / max(income, 1.0)
    debt_score = _bucket_score(
        -emi_burden,  # we invert so "more negative" becomes lower bucket
        buckets=[
            (-0.10, 100.0),
            (-0.20, 85.0),
            (-0.35, 65.0),
            (-0.50, 40.0),
            (-10.0, 15.0),
        ],
    )
    # Explanation uses original burden.

    # Diversification (proxy: scale of diversified investments)
    invest_multiple = investments / annual_income
    diversification_score = _bucket_score(
        invest_multiple,
        buckets=[
            (3.0, 100.0),
            (2.0, 85.0),
            (1.0, 65.0),
            (0.5, 40.0),
            (0.0, 15.0),
        ],
    )

    # Tax efficiency (proxy: investing a good portion of surplus)
    surplus_annual = monthly_surplus * 12.0
    if surplus_annual <= 0:
        tax_efficiency_score = 15.0
        tax_why = "With expenses at or above income, there is little surplus to allocate to tax-advantaged investments."
        tax_improvement = "Reduce expenses or increase income to create surplus, then allocate it to eligible tax-saving instruments (as applicable)."
    else:
        invest_vs_surplus = investments / max(surplus_annual, 1.0)
        tax_efficiency_score = _bucket_score(
            invest_vs_surplus,
            buckets=[
                (1.5, 85.0),
                (0.8, 65.0),
                (0.4, 40.0),
                (0.0, 20.0),
            ],
        )
        tax_why = (
            "Tax efficiency is approximated using how much of your annual surplus is already invested. "
            "Actual tax savings depend on your salary structure and the specific instruments you choose."
        )
        tax_improvement = (
            "Increase the portion of surplus that goes into suitable tax-advantaged investments, and confirm eligibility with your tax records."
        )

    # Retirement readiness (proxy: long-term investment scale)
    if annual_income <= 0:
        retirement_readiness_score = 15.0
        retirement_why = "Retirement readiness is hard to estimate without income."
        retirement_improvement = "Provide your income and current investments to enable a proxy estimate."
    else:
        if invest_multiple >= 5:
            retirement_readiness_score = 100.0
        elif invest_multiple >= 3:
            retirement_readiness_score = 85.0
        elif invest_multiple >= 2:
            retirement_readiness_score = 65.0
        elif invest_multiple >= 1:
            retirement_readiness_score = 40.0
        else:
            retirement_readiness_score = 15.0

        retirement_why = (
            "Retirement readiness is approximated from current investment scale relative to annual income. "
            "Precise planning needs age, retirement goals, and contribution timeline (handled in FIRE Planner)."
        )
        retirement_improvement = (
            "Increase long-term investing via disciplined SIP/top-ups and re-check in FIRE Planner once you add age and goals."
        )

    # Weighted overall score
    weights = {
        "emergency_fund": 25.0,
        "insurance": 20.0,
        "diversification": 15.0,
        "debt": 20.0,
        "tax_efficiency": 10.0,
        "retirement_readiness": 10.0,
    }

    categories_scores = {
        "emergency_fund": emergency_score,
        "insurance": insurance_score,
        "diversification": diversification_score,
        "debt": debt_score,
        "tax_efficiency": tax_efficiency_score,
        "retirement_readiness": retirement_readiness_score,
    }

    total_weight = sum(weights.values())
    overall_score = sum(categories_scores[k] * weights[k] for k in categories_scores) / total_weight
    overall_score = _clamp(overall_score, 0.0, 100.0)

    # Category "why" + improvement with clear targets.
    emergency_target_savings = expenses_safe * 6.0
    if emergency_months >= 6.0:
        emergency_why = "Your liquid savings cover at least ~6 months of expenses."
        emergency_improvement = "Maintain and periodically review your emergency fund with changing expenses."
    else:
        emergency_why = f"Your emergency fund is ~{emergency_months:.1f} months of expenses."
        emergency_improvement = (
            f"Target ~6 months coverage => approx INR {emergency_target_savings:,.0f} liquid savings."
        )

    if insurance_coverage_ratio >= 5.0:
        insurance_why = "Your life cover is broadly aligned with higher emergency/contingency protection."
        insurance_improvement = "Maintain adequate coverage and review after major life events."
    else:
        insurance_why = f"Your insurance cover ratio is ~{insurance_coverage_ratio:.1f}x annual expenses (proxy)."
        insurance_improvement = (
            f"Consider reviewing coverage towards ~5x annual expenses => approx INR {(annual_expenses * 5.0):,.0f}."
        )

    emi_burden_pct = emi_burden * 100.0
    if emi_burden <= 0.2:
        debt_why = f"Your loan EMI burden is ~{emi_burden_pct:.1f}% of monthly income."
        debt_improvement = "Keep EMIs manageable and prioritize high-interest debt if any."
    else:
        debt_why = f"Your loan EMI burden is ~{emi_burden_pct:.1f}% of monthly income."
        debt_improvement = (
            "Work towards reducing EMI burden (below ~20% of income) by accelerating repayments or refinancing, if appropriate."
        )

    if invest_multiple >= 2.0:
        diversification_why = "Your current investments scale relative to annual income looks reasonably strong."
        diversification_improvement = "Keep diversified investing and periodically rebalance."
    else:
        diversification_why = f"Your diversified investment scale is ~{invest_multiple:.1f}x annual income (proxy)."
        diversification_improvement = (
            f"Aim for at least ~2x annual income in diversified investments => approx INR {(annual_income * 2.0):,.0f}."
        )

    if investments <= 0:
        retirement_readiness_why = "No current investments were provided, so retirement readiness is estimated as low."
        retirement_readiness_improvement = "Start a disciplined long-term investment plan (monthly SIP) and revisit later."
    else:
        retirement_readiness_why = retirement_why
        retirement_readiness_improvement = retirement_improvement

    categories: dict[str, CategoryScore] = {
        "emergency_fund": CategoryScore(
            score=emergency_score,
            why=emergency_why,
            improvement=emergency_improvement,
        ),
        "insurance": CategoryScore(
            score=insurance_score,
            why=insurance_why,
            improvement=insurance_improvement,
        ),
        "diversification": CategoryScore(
            score=diversification_score,
            why=diversification_why,
            improvement=diversification_improvement,
        ),
        "debt": CategoryScore(
            score=debt_score,
            why=debt_why,
            improvement=debt_improvement,
        ),
        "tax_efficiency": CategoryScore(
            score=tax_efficiency_score,
            why=tax_why,
            improvement=tax_improvement,
        ),
        "retirement_readiness": CategoryScore(
            score=retirement_readiness_score,
            why=retirement_readiness_why,
            improvement=retirement_readiness_improvement,
        ),
    }

    # Turn the worst 2-3 categories into top suggestions.
    sorted_by_low = sorted(categories.items(), key=lambda kv: kv[1].score)
    worst = sorted_by_low[:3]
    improvement_suggestions = [f"{k.replace('_', ' ').title()}: {v.improvement}" for k, v in worst]

    assumptions = {
        "units": "All values are in INR. Inputs are treated as monthly amounts for income/expenses and EMIs.",
        "emergency_fund": "savings_inr is treated as liquid emergency money available today.",
        "insurance": "insurance_inr is treated as life cover amount (proxy); exact recommended cover depends on age/depends (not provided here).",
        "diversification": "diversification_score is a proxy based on current investment scale vs annual income (no asset-class split provided).",
        "tax_efficiency": "tax_efficiency_score is approximated from annual surplus allocation to investments (not a real tax calculation).",
        "retirement": "retirement_readiness_score is a proxy based on investment scale vs annual income. Precise projections require age and goals (FIRE Planner).",
    }

    return MoneyHealthScoreResponse(
        overall_score=overall_score,
        categories=categories,
        improvement_suggestions=improvement_suggestions,
        assumptions=assumptions,
    )

