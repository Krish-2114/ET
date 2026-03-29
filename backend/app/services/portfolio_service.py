from __future__ import annotations

import csv
import io
import math
from collections import defaultdict
from datetime import date, datetime
from typing import Dict, List, Optional, Tuple

from app.schemas.portfolio_schemas import (
    ConcentrationAnalysis,
    OverlapAnalysis,
    OverlapPair,
    PortfolioAnalysisResponse,
    PortfolioHolding,
    PortfolioSummary,
)

REQUIRED_COLUMNS = {
    "investor_name",
    "folio_no",
    "amc",
    "scheme_name",
    "isin",
    "category",
    "transaction_type",
    "transaction_date",
    "units",
    "nav",
    "amount",
    "expense_ratio",
    "current_nav",
}

BUY_TYPES = {"BUY", "SIP", "SWITCH_IN"}
SELL_TYPES = {"SELL", "REDEEM", "SWITCH_OUT"}
SUPPORTED_TRANSACTION_TYPES = BUY_TYPES | SELL_TYPES

# Mock underlying holdings dataset for overlap analysis
FUND_CONSTITUENTS: Dict[str, Dict[str, float]] = {
    "Axis Bluechip Fund": {
        "HDFC Bank": 8.2,
        "ICICI Bank": 7.8,
        "Infosys": 6.5,
        "TCS": 5.4,
        "Larsen & Toubro": 4.3,
    },
    "HDFC Flexi Cap Fund": {
        "HDFC Bank": 6.9,
        "ICICI Bank": 5.8,
        "Infosys": 4.9,
        "TCS": 4.5,
        "Reliance Industries": 4.1,
    },
    "SBI Small Cap Fund": {
        "Karur Vysya Bank": 3.5,
        "Elgi Equipments": 3.1,
        "Blue Star": 2.8,
        "Fine Organic": 2.6,
        "KEI Industries": 2.5,
    },
}


def _clean_str(value: Optional[str]) -> str:
    return (value or "").strip()


def _parse_float(value: Optional[str], field_name: str, row_number: int) -> float:
    cleaned = _clean_str(value).replace(",", "")
    if cleaned == "":
        raise ValueError(f"Missing value for '{field_name}' in row {row_number}")
    try:
        return float(cleaned)
    except ValueError:
        raise ValueError(f"Invalid number for '{field_name}' in row {row_number}: {value}")


def _parse_date(value: Optional[str], row_number: int) -> date:
    cleaned = _clean_str(value)
    try:
        return datetime.strptime(cleaned, "%Y-%m-%d").date()
    except ValueError:
        raise ValueError(
            f"Invalid date format in row {row_number}: '{value}'. Expected YYYY-MM-DD."
        )


def _read_csv_rows(file_content: bytes) -> List[dict]:
    try:
        decoded = file_content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise ValueError("CSV must be UTF-8 encoded.")

    reader = csv.DictReader(io.StringIO(decoded))
    fieldnames = set(reader.fieldnames or [])
    missing = REQUIRED_COLUMNS - fieldnames
    if missing:
        raise ValueError(f"CSV is missing required columns: {', '.join(sorted(missing))}")

    rows: List[dict] = []
    for row_number, row in enumerate(reader, start=2):
        if not any(_clean_str(v) for v in row.values()):
            continue

        transaction_type = _clean_str(row["transaction_type"]).upper()
        if transaction_type not in SUPPORTED_TRANSACTION_TYPES:
            raise ValueError(
                f"Unsupported transaction_type '{row['transaction_type']}' in row {row_number}. "
                f"Allowed values: {', '.join(sorted(SUPPORTED_TRANSACTION_TYPES))}"
            )

        units = _parse_float(row["units"], "units", row_number)
        nav = _parse_float(row["nav"], "nav", row_number)
        amount = _parse_float(row["amount"], "amount", row_number)
        expense_ratio = _parse_float(row["expense_ratio"], "expense_ratio", row_number)
        current_nav = _parse_float(row["current_nav"], "current_nav", row_number)

        if units < 0 or nav < 0 or amount < 0 or expense_ratio < 0 or current_nav < 0:
            raise ValueError(f"Negative values are not allowed in row {row_number}")

        rows.append(
            {
                "investor_name": _clean_str(row["investor_name"]),
                "folio_no": _clean_str(row["folio_no"]),
                "amc": _clean_str(row["amc"]),
                "scheme_name": _clean_str(row["scheme_name"]),
                "isin": _clean_str(row["isin"]),
                "category": _clean_str(row["category"]),
                "transaction_type": transaction_type,
                "transaction_date": _parse_date(row["transaction_date"], row_number),
                "units": units,
                "nav": nav,
                "amount": amount,
                "expense_ratio": expense_ratio,
                "current_nav": current_nav,
            }
        )

    if not rows:
        raise ValueError("CSV has no transaction rows.")

    rows.sort(key=lambda x: x["transaction_date"])
    return rows


def _xnpv(rate: float, cashflows: List[Tuple[date, float]]) -> float:
    if rate <= -0.999999:
        return float("inf")

    start_date = cashflows[0][0]
    total = 0.0
    for cashflow_date, amount in cashflows:
        years = (cashflow_date - start_date).days / 365.0
        total += amount / ((1 + rate) ** years)
    return total


def _xnpv_derivative(rate: float, cashflows: List[Tuple[date, float]]) -> float:
    if rate <= -0.999999:
        return float("inf")

    start_date = cashflows[0][0]
    total = 0.0
    for cashflow_date, amount in cashflows:
        years = (cashflow_date - start_date).days / 365.0
        total += (-years * amount) / ((1 + rate) ** (years + 1))
    return total


def _calculate_xirr(cashflows: List[Tuple[date, float]]) -> Optional[float]:
    has_positive = any(amount > 0 for _, amount in cashflows)
    has_negative = any(amount < 0 for _, amount in cashflows)
    if not (has_positive and has_negative):
        return None

    # Newton-Raphson
    guess = 0.10
    for _ in range(100):
        value = _xnpv(guess, cashflows)
        derivative = _xnpv_derivative(guess, cashflows)

        if abs(derivative) < 1e-12:
            break

        new_guess = guess - (value / derivative)

        if (
            new_guess <= -0.9999
            or math.isnan(new_guess)
            or math.isinf(new_guess)
            or new_guess > 1000
        ):
            break

        if abs(new_guess - guess) < 1e-7:
            return round(new_guess * 100, 2)

        guess = new_guess

    # Bisection fallback
    low = -0.9999
    high = 10.0
    f_low = _xnpv(low, cashflows)
    f_high = _xnpv(high, cashflows)

    expand_count = 0
    while f_low * f_high > 0 and expand_count < 20:
        high *= 2
        f_high = _xnpv(high, cashflows)
        expand_count += 1

    if f_low * f_high > 0:
        return None

    mid = 0.0
    for _ in range(200):
        mid = (low + high) / 2
        f_mid = _xnpv(mid, cashflows)

        if abs(f_mid) < 1e-7:
            return round(mid * 100, 2)

        if f_low * f_mid <= 0:
            high = mid
            f_high = f_mid
        else:
            low = mid
            f_low = f_mid

    return round(mid * 100, 2)


def _build_holdings_and_cashflows(rows: List[dict]) -> Tuple[List[PortfolioHolding], List[Tuple[date, float]]]:
    grouped: Dict[Tuple[str, str, str], dict] = {}
    cashflows: List[Tuple[date, float]] = []

    for row in rows:
        key = (row["scheme_name"], row["folio_no"], row["isin"])

        if key not in grouped:
            grouped[key] = {
                "scheme_name": row["scheme_name"],
                "amc": row["amc"],
                "category": row["category"],
                "folio_no": row["folio_no"],
                "isin": row["isin"],
                "units_held": 0.0,
                "invested_amount": 0.0,
                "current_nav": row["current_nav"],
                "expense_ratio": row["expense_ratio"],
            }

        holding = grouped[key]
        holding["current_nav"] = row["current_nav"] or holding["current_nav"]

        if row["expense_ratio"] > 0:
            holding["expense_ratio"] = row["expense_ratio"]

        if row["transaction_type"] in BUY_TYPES:
            holding["units_held"] += row["units"]
            holding["invested_amount"] += row["amount"]
            cashflows.append((row["transaction_date"], -row["amount"]))

        elif row["transaction_type"] in SELL_TYPES:
            if row["units"] > holding["units_held"] + 1e-9:
                raise ValueError(
                    f"Sell/redeem units exceed available units for scheme '{row['scheme_name']}'"
                )

            avg_cost_before_sale = (
                holding["invested_amount"] / holding["units_held"]
                if holding["units_held"] > 0
                else 0
            )
            cost_reduction = avg_cost_before_sale * row["units"]

            holding["units_held"] -= row["units"]
            holding["invested_amount"] = max(0.0, holding["invested_amount"] - cost_reduction)

            cashflows.append((row["transaction_date"], row["amount"]))

    holdings: List[PortfolioHolding] = []
    total_current_value = 0.0

    for holding in grouped.values():
        if holding["units_held"] <= 1e-9:
            continue

        current_value = holding["units_held"] * holding["current_nav"]
        avg_cost = (
            holding["invested_amount"] / holding["units_held"]
            if holding["units_held"] > 0
            else 0.0
        )
        gain_loss = current_value - holding["invested_amount"]

        holdings.append(
            PortfolioHolding(
                scheme_name=holding["scheme_name"],
                amc=holding["amc"],
                category=holding["category"],
                folio_no=holding["folio_no"],
                isin=holding["isin"],
                units_held=round(holding["units_held"], 4),
                invested_amount=round(holding["invested_amount"], 2),
                avg_cost=round(avg_cost, 2),
                current_nav=round(holding["current_nav"], 2),
                current_value=round(current_value, 2),
                gain_loss=round(gain_loss, 2),
                weight_percent=0.0,  # filled later
                expense_ratio=round(holding["expense_ratio"], 2),
            )
        )
        total_current_value += current_value

    if total_current_value <= 0:
        raise ValueError("No active holdings found in the uploaded CSV.")

    updated_holdings: List[PortfolioHolding] = []
    for holding in holdings:
        weight_percent = (holding.current_value / total_current_value) * 100
        updated_holdings.append(
            holding.model_copy(update={"weight_percent": round(weight_percent, 2)})
        )

    updated_holdings.sort(key=lambda x: x.current_value, reverse=True)
    return updated_holdings, cashflows


def _compute_concentration(holdings: List[PortfolioHolding]) -> ConcentrationAnalysis:
    amc_weights: Dict[str, float] = defaultdict(float)
    category_weights: Dict[str, float] = defaultdict(float)

    for holding in holdings:
        amc_weights[holding.amc] += holding.weight_percent
        category_weights[holding.category] += holding.weight_percent

    top_fund_weight = max((h.weight_percent for h in holdings), default=0.0)
    top_amc_weight = max(amc_weights.values(), default=0.0)
    top_category_weight = max(category_weights.values(), default=0.0)

    if top_fund_weight > 40:
        risk_level = "high"
    elif top_fund_weight >= 25:
        risk_level = "medium"
    else:
        risk_level = "low"

    rounded_category_weights = {
        category: round(weight, 2) for category, weight in category_weights.items()
    }

    return ConcentrationAnalysis(
        top_fund_weight=round(top_fund_weight, 2),
        top_amc_weight=round(top_amc_weight, 2),
        top_category_weight=round(top_category_weight, 2),
        category_weights=rounded_category_weights,
        risk_level=risk_level,
    )


def _pair_overlap_percent(fund_a: str, fund_b: str) -> float:
    a = FUND_CONSTITUENTS.get(fund_a, {})
    b = FUND_CONSTITUENTS.get(fund_b, {})

    if not a or not b:
        return 0.0

    common_stocks = set(a.keys()) & set(b.keys())
    overlap = sum(min(a[stock], b[stock]) for stock in common_stocks)
    return round(overlap, 2)


def _compute_overlap(holdings: List[PortfolioHolding]) -> Tuple[OverlapAnalysis, List[str]]:
    warnings: List[str] = []
    missing_data = [h.scheme_name for h in holdings if h.scheme_name not in FUND_CONSTITUENTS]

    if missing_data:
        warnings.append(
            "Overlap data was unavailable for: " + ", ".join(sorted(set(missing_data)))
        )

    pairs: List[OverlapPair] = []
    weighted_scores: List[Tuple[float, float]] = []

    for i in range(len(holdings)):
        for j in range(i + 1, len(holdings)):
            h1 = holdings[i]
            h2 = holdings[j]
            overlap_percent = _pair_overlap_percent(h1.scheme_name, h2.scheme_name)

            if overlap_percent > 0:
                pairs.append(
                    OverlapPair(
                        fund_a=h1.scheme_name,
                        fund_b=h2.scheme_name,
                        overlap_percent=overlap_percent,
                    )
                )
                pair_weight = ((h1.weight_percent / 100) + (h2.weight_percent / 100)) / 2
                weighted_scores.append((overlap_percent, pair_weight))

    pairs.sort(key=lambda x: x.overlap_percent, reverse=True)

    if weighted_scores:
        numerator = sum(score * weight for score, weight in weighted_scores)
        denominator = sum(weight for _, weight in weighted_scores)
        portfolio_overlap_score = numerator / denominator if denominator else 0.0
    else:
        portfolio_overlap_score = 0.0

    return (
        OverlapAnalysis(
            portfolio_overlap_score=round(portfolio_overlap_score, 2),
            pairs=pairs[:10],
        ),
        warnings,
    )


def _build_insights_and_suggestions(
    summary: PortfolioSummary,
    concentration: ConcentrationAnalysis,
    overlap: OverlapAnalysis,
    holdings: List[PortfolioHolding],
) -> Tuple[List[str], List[str]]:
    insights: List[str] = []
    suggestions: List[str] = []

    if concentration.top_fund_weight > 40:
        insights.append("Your portfolio is highly concentrated in a single fund.")
        suggestions.append("Reduce single-fund exposure below 35% to improve diversification.")
    elif concentration.top_fund_weight >= 25:
        insights.append("Your portfolio has moderate concentration in one fund.")
        suggestions.append("Review whether your largest fund allocation can be trimmed gradually.")

    if concentration.top_amc_weight > 50:
        insights.append("A large portion of your portfolio is managed by one AMC.")
        suggestions.append("Spread your core allocation across more than one AMC.")

    if overlap.portfolio_overlap_score > 30:
        insights.append("There is high overlap between some of your funds.")
        suggestions.append("Remove duplicate core funds that hold many of the same stocks.")
    elif overlap.portfolio_overlap_score > 15:
        insights.append("There is noticeable overlap between parts of your portfolio.")
        suggestions.append("Compare overlapping funds and keep the stronger one for your strategy.")

    if summary.weighted_expense_ratio > 1.0:
        insights.append("Your weighted expense ratio is high for long-term compounding.")
        suggestions.append("Shift core long-term allocation toward lower-cost funds where possible.")
    elif summary.weighted_expense_ratio > 0.75:
        insights.append("Your expense ratio drag is moderate and worth monitoring.")
        suggestions.append("Check whether any high-cost fund can be replaced by a cheaper equivalent.")

    small_cap_weight = concentration.category_weights.get("Small Cap", 0.0)
    if small_cap_weight > 35:
        insights.append("Your small-cap allocation is high and may increase volatility.")
        suggestions.append("Balance aggressive categories with more stable diversified exposure.")

    if not insights:
        insights.append("Your portfolio looks reasonably diversified on the current inputs.")
        suggestions.append("Continue periodic reviews and rebalance only when allocations drift materially.")

    # Remove duplicate suggestions while keeping order
    deduped_suggestions = list(dict.fromkeys(suggestions))
    return insights, deduped_suggestions


def analyze_portfolio_csv(
    file_content: bytes,
    as_of_date: Optional[date] = None,
) -> PortfolioAnalysisResponse:
    rows = _read_csv_rows(file_content)
    investor_name = rows[0]["investor_name"] or "Unknown Investor"

    holdings, cashflows = _build_holdings_and_cashflows(rows)

    total_invested = round(sum(h.invested_amount for h in holdings), 2)
    current_value = round(sum(h.current_value for h in holdings), 2)
    absolute_gain = round(current_value - total_invested, 2)
    absolute_gain_percent = round((absolute_gain / total_invested) * 100, 2) if total_invested else 0.0

    weighted_expense_ratio = round(
        sum((h.weight_percent * h.expense_ratio) for h in holdings) / 100, 2
    )
    annual_expense_drag_inr = round(current_value * weighted_expense_ratio / 100, 2)

    analysis_date = as_of_date or date.today()
    xirr_cashflows = list(cashflows) + [(analysis_date, current_value)]
    xirr = _calculate_xirr(xirr_cashflows)

    warnings: List[str] = []
    if xirr is None:
        warnings.append("XIRR could not be computed from the provided cashflows.")

    summary = PortfolioSummary(
        total_invested=total_invested,
        current_value=current_value,
        absolute_gain=absolute_gain,
        absolute_gain_percent=absolute_gain_percent,
        xirr=xirr,
        weighted_expense_ratio=weighted_expense_ratio,
        annual_expense_drag_inr=annual_expense_drag_inr,
    )

    concentration = _compute_concentration(holdings)
    overlap, overlap_warnings = _compute_overlap(holdings)
    warnings.extend(overlap_warnings)

    insights, rebalance_suggestions = _build_insights_and_suggestions(
        summary=summary,
        concentration=concentration,
        overlap=overlap,
        holdings=holdings,
    )

    return PortfolioAnalysisResponse(
        investor_name=investor_name,
        as_of_date=analysis_date.isoformat(),
        summary=summary,
        holdings=holdings,
        concentration=concentration,
        overlap=overlap,
        insights=insights,
        rebalance_suggestions=rebalance_suggestions,
        warnings=warnings,
    )