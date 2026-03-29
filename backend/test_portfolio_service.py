from datetime import date
from pathlib import Path

from app.services.portfolio_service import analyze_portfolio_csv

csv_path = Path(__file__).parent / "sample_data" / "mock_cams_portfolio.csv"
result = analyze_portfolio_csv(
    csv_path.read_bytes(),
    as_of_date=date(2026, 3, 29),
)

try:
    print(result.model_dump_json(indent=2))
except AttributeError:
    print(result.json(indent=2))