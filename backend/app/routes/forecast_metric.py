from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import verify_role
from app.schemas.forecast_metric import (
    CreateMetrics,
    UpdateMetrics
)
from app.services.forecast_metric_service import (
    create_metrics,
    get_metrics,
    get_metrics_by_id,
    update_metrics,
    delete_metric
)
from app.core.security import verify_role

router = APIRouter(tags=["Forecast Metrics"])

@router.post("/forecast-metrics")
def add_metrics(
    payload: CreateMetrics,
    db:Session = Depends(get_db),
    current_user = Depends(verify_role("analyst"))
):
    return create_metrics(db=db, payload=payload)

@router.get("/forecast-metrics")
def list_metrics(
    db:Session = Depends(get_db),
    current_user = Depends(verify_role("analyst"))
):
    return get_metrics(db=db, current_user=current_user)

@router.get("/forecast-metrics/{id}")
def view_metrics(
    id:int,
    db:Session = Depends(get_db),
    current_user = Depends(verify_role("analyst"))
):
    return get_metrics_by_id(db=db, metric_id=id)

@router.put("/forecast-metrics/{id}")
def edit_metrics(
    id:int,
    payload: UpdateMetrics,
    db:Session = Depends(get_db),
    current_user = Depends(verify_role("analyst"))
):
    return update_metrics(
        db=db,
        payload=payload,
        metric_id=id
    )    

@router.delete("/forecast-metrics/{id}")
def remove_metrics(
    id:int,
    db:Session = Depends(get_db),
    current_user = Depends(verify_role("analyst"))
):
    return delete_metric(db=db, metric_id=id)

