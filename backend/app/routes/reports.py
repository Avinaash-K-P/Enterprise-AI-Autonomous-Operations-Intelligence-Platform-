from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import verify_role
from app.services.reports_service import (
    export_report_csv,
    export_report_pdf,
    get_forecast_summary,
    get_anomaly_summary,
    get_optimization_summary,
    get_simulation_summary,
    get_executive_dashboard
)

router = APIRouter(tags=["Enterprise Reports"])

'''
GET /reports/forecast-summary
GET /reports/anomaly-summary
GET /reports/optimization-summary
GET /reports/executive-dashboard
GET /reports/export/csv
GET /reports/export/pdf
'''

@router.get("/reports/forecast-summary")
def view_forecast_summary(
    db:Session = Depends(get_db),
    current_user = Depends(verify_role("all"))
):
    return get_forecast_summary(db, current_user)

@router.get("/reports/anomaly-summary")
def view_anomaly_summary(
    db:Session = Depends(get_db),
    current_user = Depends(verify_role("all"))
):
    return get_anomaly_summary(db, current_user)

@router.get("/reports/optimization-summary")
def view_optimization_summary(
    db:Session = Depends(get_db),
    current_user = Depends(verify_role("all"))
):
    return get_optimization_summary(db, current_user)

@router.get("/reports/executable_dashboard")
def view_executable_dashboard(
    db:Session = Depends(get_db),
    current_user = Depends(verify_role("all"))
):
    return get_executive_dashboard(db, current_user)

@router.get("/export/csv")
def export_csv(
    report_type: str,    
    db:Session = Depends(get_db),
    current_user = Depends(verify_role("all")) 
):
    return export_report_csv(db, report_type, current_user)


@router.get("/export/pdf")
def export_pdf(
    report_type: str,    
    db:Session = Depends(get_db),
    current_user = Depends(verify_role("all")) 
):
    return export_report_pdf(db, report_type, current_user)