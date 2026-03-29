from app.schemas.couple import CoupleProfileRequest, CouplePlanResponse, GoalSplit
from app.services.ai_service import generate_couple_report

def calculate_couple_plan(data: CoupleProfileRequest) -> CouplePlanResponse:
    total_income = data.user.income + data.partner.income
    total_expenses = data.user.expenses + data.partner.expenses

    # Calculate equity split ratio
    if data.expense_split_preference == "proportional" and total_income > 0:
        user_ratio = data.user.income / total_income
        partner_ratio = data.partner.income / total_income
    else:
        user_ratio = 0.5
        partner_ratio = 0.5

    ratio_str = f"{data.user.name}: {int(user_ratio*100)}% | {data.partner.name}: {int(partner_ratio*100)}%"

    goal_splits = []
    expected_return_rate = 0.12  # 12% assumption for Indian mutual funds
    
    for goal in data.shared_goals:
        # Standard SIP Formula: P = (M * ((1 + r)^n - 1) * (1 + r)) / r
        r = expected_return_rate / 12
        n = goal.years * 12
        
        if r > 0 and n > 0:
            monthly_sip = (goal.target_amount * r) / (((1 + r)**n - 1) * (1 + r))
        else:
            monthly_sip = goal.target_amount / n if n > 0 else 0

        goal_splits.append(GoalSplit(
            goal_name=goal.goal_name,
            total_monthly_sip=round(monthly_sip, 2),
            user_contribution=round(monthly_sip * user_ratio, 2),
            partner_contribution=round(monthly_sip * partner_ratio, 2)
        ))

    # Basic Tax Optimization Logic
    tax_tips = []
    higher_earner = data.user if data.user.income > data.partner.income else data.partner
    tax_tips.append(
        f"Why this recommendation: Since {higher_earner.name} is in a higher tax bracket, "
        f"they should prioritize claiming Section 24b Home Loan deductions if you buy property together."
    )

    # Fetch AI Insights
    ai_report = generate_couple_report(data)

    return CouplePlanResponse(
        total_combined_income=total_income,
        total_combined_expenses=total_expenses,
        suggested_split_ratio=ratio_str,
        goal_splits=goal_splits,
        tax_optimization_tips=tax_tips,
        ai_compatibility_report=ai_report
    )