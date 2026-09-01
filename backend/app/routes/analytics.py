from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import verify_role
from app.db.database import get_db
from app.services.analytics_service import (
    get_anomaly_heatmap,
    get_dashboard_overview,
    get_facility_device_comparison,
    get_forecast_confidence_intervals,
    get_historical_vs_predicted_analytics,
    get_kpi_monitoring,
    get_model_performance_tracking,
    get_optimization_recommendation_panel,
    get_root_cause_visualization,
    get_simulation_dashboard,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Analytics Dashboard"],
)


@router.get("/overview")
def dashboard_overview(
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("all")),
):
    return get_dashboard_overview(
        db=db,
        current_user=current_user,
    )


@router.get("/historical-vs-predicted")
def historical_vs_predicted(
    metric_id: int,
    entity_type: str,
    entity_id: int,
    run_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("all")),
):
    return get_historical_vs_predicted_analytics(
        db=db,
        current_user=current_user,
        metric_id=metric_id,
        entity_type=entity_type,
        entity_id=entity_id,
        run_id=run_id,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/anomaly-heatmap")
def anomaly_heatmap(
    metric_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("all")),
):
    return get_anomaly_heatmap(
        db=db,
        current_user=current_user,
        metric_id=metric_id,
        entity_type=entity_type,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/optimization-panel")
def optimization_panel(
    status_filter: Optional[str] = None,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("all")),
):
    return get_optimization_recommendation_panel(
        db=db,
        current_user=current_user,
        status_filter=status_filter,
        limit=limit,
    )


@router.get("/forecast-confidence/{run_id}")
def forecast_confidence_intervals(
    run_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("all")),
):
    return get_forecast_confidence_intervals(
        db=db,
        current_user=current_user,
        run_id=run_id,
    )


@router.get("/kpis")
def kpi_monitoring(
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("all")),
):
    return get_kpi_monitoring(
        db=db,
        current_user=current_user,
    )


@router.get("/entity-comparison")
def facility_device_comparison(
    metric_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("all")),
):
    return get_facility_device_comparison(
        db=db,
        current_user=current_user,
        metric_id=metric_id,
        entity_type=entity_type,
    )


@router.get("/root-cause-visualization/{anomaly_id}")
def root_cause_visualization(
    anomaly_id: int,
    lookback_hours: int = 24,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("all")),
):
    return get_root_cause_visualization(
        db=db,
        current_user=current_user,
        anomaly_id=anomaly_id,
        lookback_hours=lookback_hours,
    )


@router.get("/simulation")
def simulation_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("all")),
):
    return get_simulation_dashboard(
        db=db,
        current_user=current_user,
    )


@router.get("/model-performance")
def model_performance_tracking(
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("all")),
):
    return get_model_performance_tracking(
        db=db,
        current_user=current_user,
    )