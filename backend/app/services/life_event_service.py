from app.schemas.life_event import LifeEventRequest, LifeEventResponse

def analyze_life_event(data: LifeEventRequest) -> LifeEventResponse:
    actions = []
    risks = []
    adjustments = ""

    # Mock AI Logic - Using standard Python 'if' statements!
    if data.event_type == "BABY":
        actions = [
            "Add newborn to corporate health insurance immediately.",
            "Open a PPF",
            f"Adjust monthly budget for an estimated ₹{data.event_amount} in new expenses."
        ]
        risks = [
            "Underestimating out-of-pocket vaccination and pediatrician costs.",
            "Spouse taking unpaid maternity/paternity leave causing a cash flow dip."
        ]
        adjustments = "Your FIRE timeline will likely be delayed by 2-3 years due to increased monthly burn rate and future education corpus needs."
    
    elif data.event_type == "BONUS":
        actions = [
            f"Route 30% (₹{int(data.event_amount * 0.3)}) to guilt-free spending.",
            f"Invest the remaining 70% (₹{int(data.event_amount * 0.7)}) into your core equity portfolio."
        ]
        risks = [
            "Lifestyle creep: using the bonus to buy a depreciating asset with high maintenance.",
            "Ignoring high-interest personal loans if you have them."
        ]
        adjustments = "Injecting this lumpsum will accelerate your FIRE target by approximately 4-6 months!"
    
    else:
        # Generic fallback for Job Switch, Marriage, Home
        actions = [
            "Re-evaluate your emergency fund to ensure 6 months of new expenses are covered.",
            "Update your nominee details across all mutual funds and bank accounts."
        ]
        risks = [
            "Locking up too much liquidity in illiquid assets.",
            "Failing to account for the new tax bracket implications."
        ]
        adjustments = "We need to recalculate your SIPs to align with your new financial baseline."

    return LifeEventResponse(
        immediate_actions=actions,
        hidden_risks=risks,
        plan_adjustments=adjustments
    )