from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import verify_role
from app.db.database import get_db
from app.schemas.forecast_model import CreateForecastModel
from app.schemas.forecast_run import ForecastRunCompareRequest
from app.services.forecast_service import (
    compare_forecast_models,
    create_forecast_model,
    get_forecast_models,
    get_forecast_model_by_id,
    get_forecast_results,
    run_forecast,
)

router = APIRouter(
    tags=["Forecast Models"],
)

@router.post("/forecast-models")
def create_model(
    payload: CreateForecastModel,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst")),
):
    return create_forecast_model(
        db=db,
        payload=payload,
        current_user=current_user,
    )

@router.get("/forecast-models")
def get_models(
    db:Session = Depends(get_db),
    current_user=Depends(verify_role("analyst"))
):
    return get_forecast_models(
        db=db,
        current_user=current_user
    )

@router.get("/forecast-models/{model_id}")
def get_model_by_id(
    model_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst"))
):
    return get_forecast_model_by_id(
        db=db,
        model_id=model_id,
        current_user=current_user,
    )

@router.post("/forecast-models/{model_id}/run")
def run_model_forecast(
    model_id: int,
    entity_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst"))
):
    return run_forecast(
        db=db,
        model_id=model_id,
        entity_id=entity_id,
        current_user=current_user,
    )

@router.post("/compare")
def compare_models_api(
    payload: ForecastRunCompareRequest,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst"))
):
    return compare_forecast_models(
        db=db,
        metric_id=payload.metric_id,
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        horizon=payload.horizon,
        frequency=payload.frequency,
        model_types=payload.model_types,
        config=payload.config,
        current_user=current_user,
    )

@router.get("/forecast-models/runs/{run_id}/results")
def get_results(
    run_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst"))
):
    return get_forecast_results(
        db=db,
        run_id=run_id,
        current_user=current_user,
    )