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

