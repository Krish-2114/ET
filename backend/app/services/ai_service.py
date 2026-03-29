from typing import Any


def generate_ai_explanation(module: str, context: dict[str, Any]) -> dict[str, Any]:
    """
    Placeholder abstraction layer for AI providers.
    Future phases can swap model vendors without changing route logic.
    """
    return {
        "module": module,
        "message": "AI explanation will be enabled in upcoming phases.",
        "context": context,
    }
from app.schemas.couple import CoupleProfileRequest

def generate_couple_report(data: CoupleProfileRequest) -> str:
    return (
        f"Based on the provided profiles, a {data.expense_split_preference} split aligns best with your "
        f"current financial dynamic. Since {data.user.name} and {data.partner.name} have shared goals, "
        "automating your proportional SIPs into a joint account is highly recommended to avoid friction."
    )

