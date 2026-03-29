from datetime import date

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.portfolio_schemas import PortfolioAnalysisResponse
from app.services.portfolio_service import analyze_portfolio_csv

router = APIRouter(prefix="/portfolio", tags=["Portfolio X-Ray"])


@router.post("/analyze", response_model=PortfolioAnalysisResponse)
async def analyze_portfolio(file: UploadFile = File(...)):
    """
    Upload a mock CAMS-style CSV and return portfolio analysis.

    Expected file type: .csv
    """
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file was uploaded.")

        if not file.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail="Only CSV files are supported.")

        file_content = await file.read()

        if not file_content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        result = analyze_portfolio_csv(
            file_content=file_content,
            as_of_date=date(2026, 3, 29),
        )
        return result

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portfolio analysis error: {str(e)}")