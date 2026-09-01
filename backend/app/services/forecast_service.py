from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any, Optional

from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.tenant import Tenant
from app.models.observation import Observation
from app.models.forecast_result import ForecastResult
from app.models.forecast_metric import ForecastMetric
from app.models.forecast_model import ForecastModel
from app.models.forecast_run import ForecastRun, ForecastRunStatus
from app.schemas.forecast_model import CreateForecastModel 
from app.ml.model_manager import train_and_forecast
from app.ml.model_manager import compare_models

# Helper functions 

def get_forecast_model_by_id(
    db: Session,
    model_id: int,
    current_user,
) -> ForecastModel:
    query = db.query(ForecastModel).filter(
        ForecastModel.id == model_id,
    )

    if current_user.tenant_id is not None:
        query = query.filter(
            ForecastModel.tenant_id == current_user.tenant_id,
        )

    forecast_model = query.first()

    if not forecast_model:
        raise HTTPException(
            status_code=404,
            detail="Forecast model not found",
        )

    return forecast_model

def _get_forecast_periods_from_horizon(horizon: str, frequency: str) -> int:
    horizon_map = {
        "24h": 24,
        "7d": 7 * 24,
        "30d": 30 * 24,
        "90d": 90 * 24,
    }

    periods = horizon_map.get(horizon)

    if periods is None:
        raise HTTPException(
            status_code=400,
            detail="Unsupported forecast horizon",
        )

    if frequency in {"h", "hour", "hourly"}:
        return periods

    if frequency in {"d", "day", "daily"}:
        return max(periods // 24, 1)

    raise HTTPException(
        status_code=404,
        detail="Unsupported forecast frequency",
    )


def _normalize_frequency(frequency: str) -> str:
    frequency_map = {
        "hourly": "h",
        "hour": "h",
        "h": "h",
        "daily": "d",
        "day": "d",
        "d": "d",
    }

    normalized = frequency_map.get(frequency)

    if not normalized:
        raise HTTPException(
            status_code=400,
            detail="Unsupported forecast frequency",
        )

    return normalized

# Main functions

def create_forecast_model(db, payload: CreateForecastModel, current_user):

    tenant_exist = db.query(ForecastMetric).filter(
        ForecastMetric.tenant_id == current_user.tenant_id
    ).first()

    if not tenant_exist:
        raise HTTPException(status_code=404, detail="tenant not found") 

    new_forecast_model = ForecastModel(
        tenant_id = payload.tenant_id,
        metric_id =  payload.tenant_id,
        name = payload.name, 
        model_type = payload.model_type, 
        entity_type = payload.entity_type,  
        horizon = payload.horizon, 
        frequency = payload.frequency, 
        config = payload.config, 
        status = payload.status, 
        version = payload.version
    )

    db.add(new_forecast_model)
    db.commit()
    db.refresh(new_forecast_model)

    return {
        "message": "New forecast model added",
        "data": new_forecast_model
    }

def get_forecast_models(db:Session, current_user):

    forecast_models = db.query(ForecastModel).filter(
        ForecastModel.tenant_id == current_user.tenant_id
    ).all()

    return {
        "message":"Forecast model list fetched",
        "data": forecast_models
    } 

def run_forecast(
    db: Session,
    model_id: int,
    entity_id: int,
    current_user,
):
    forecast_model = db.query(ForecastModel).filter(
        ForecastModel.id == model_id,
        ForecastModel.tenant_id == current_user.tenant_id,
    ).first()

    if not forecast_model:
        raise HTTPException(
            status_code=404,
            detail="Forecast model not found",
        )

    observations = db.query(Observation).filter(
        Observation.tenant_id == current_user.tenant_id,
        Observation.metric_id == forecast_model.metric_id,
        Observation.entity_type == forecast_model.entity_type,
        Observation.entity_id == entity_id,
    ).order_by(Observation.timestamp.asc()).all()

    if len(observations) < 20:
        raise HTTPException(
            status_code=400,
            detail="At least 20 observations are required to run forecast",
        )

    rows = [
        {
            "timestamp": observation.timestamp,
            "value": float(observation.value), # type: ignore
            "entity_type": observation.entity_type,
            "entity_id": observation.entity_id,
        }
        for observation in observations
        if observation.value is not None
    ]

    if len(rows) < 20:
        raise HTTPException(
            status_code=400,
            detail="At least 20 valid numeric observations are required to run forecast",
        )

    frequency = _normalize_frequency(forecast_model.frequency) # type: ignore
    forecast_periods = _get_forecast_periods_from_horizon(
        horizon=forecast_model.horizon, # type: ignore
        frequency=frequency,
    )

    input_window_start = observations[0].timestamp
    input_window_end = observations[-1].timestamp

    forecast_start = input_window_end
    forecast_end = (
        forecast_start + timedelta(hours=forecast_periods)
        if frequency == "h"
        else forecast_start + timedelta(days=forecast_periods)
    )

    forecast_run = ForecastRun(
        tenant_id=current_user.tenant_id,
        model_id=forecast_model.id,
        run_type="manual",
        status=ForecastRunStatus.RUNNING,
        training_start=datetime.utcnow(),
        forecast_start=forecast_start,
        forecast_end=forecast_end,
        input_window_start=input_window_start,
        input_window_end=input_window_end,
        created_at=datetime.utcnow(),
    )

    db.add(forecast_run)
    db.commit()
    db.refresh(forecast_run)

    try:
        output = train_and_forecast(
            rows=rows,
            model_type=forecast_model.model_type, # type: ignore
            forecast_periods=forecast_periods,
            frequency=frequency,
            config=forecast_model.config or {}, # type: ignore
        )

        forecast_results = []

        for item in output.forecast:
            result = ForecastResult(
                tenant_id=current_user.tenant_id,
                run_id=forecast_run.id,
                metric_id=forecast_model.metric_id,
                entity_type=forecast_model.entity_type,
                entity_id=entity_id,
                forecast_timestamp=item["forecast_timestamp"],
                predicted_value=Decimal(str(item["predicted_value"])),
                lower_bound=Decimal(str(item["lower_bound"])),
                upper_bound=Decimal(str(item["upper_bound"])),
                confidence_score=Decimal(str(item["confidence_score"])),
                created_at=datetime.utcnow(),
            )

            forecast_results.append(result)

        db.add_all(forecast_results)

        forecast_run.status = ForecastRunStatus.COMPLETED # type: ignore
        forecast_run.training_end = datetime.utcnow() # type: ignore
        forecast_run.completed_at = datetime.utcnow() # type: ignore
        forecast_run.performance_metrics = output.metrics # type: ignore

        db.commit()
        db.refresh(forecast_run)

        return {
            "message": "Forecast completed successfully",
            "run_id": forecast_run.id,
            "model_id": forecast_model.id,
            "model_type": forecast_model.model_type,
            "metric_id": forecast_model.metric_id,
            "entity_type": forecast_model.entity_type,
            "entity_id": entity_id,
            "horizon": forecast_model.horizon,
            "frequency": forecast_model.frequency,
            "performance_metrics": output.metrics,
            "forecast": output.forecast,
        }

    except Exception as exc: 
        forecast_run.status = ForecastRunStatus.FAILED # type: ignore
        forecast_run.error_message = str(exc) # type: ignore
        forecast_run.completed_at = datetime.utcnow() # type: ignore

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=f"Forecast failed: {str(exc)}",
        )

    
def compare_forecast_models(
    db: Session,
    metric_id: int,
    entity_type: str,
    entity_id: int,
    horizon: str,
    frequency: str,
    current_user,
    model_types: Optional[list[str]] = None,
    config: Optional[dict] = None,
):
    metric = db.query(ForecastMetric).filter(
        ForecastMetric.id == metric_id,
        ForecastMetric.tenant_id == current_user.tenant_id,
    ).first()

    if not metric:
        raise HTTPException(
            status_code=404,
            detail="Forecast metric not found for this tenant",
        )

    normalized_frequency = _normalize_frequency(frequency)

    forecast_periods = _get_forecast_periods_from_horizon(
        horizon=horizon,
        frequency=normalized_frequency,
    )

    observations = db.query(Observation).filter(
        Observation.tenant_id == current_user.tenant_id,
        Observation.metric_id == metric_id,
        Observation.entity_type == entity_type,
        Observation.entity_id == entity_id,
    ).order_by(Observation.timestamp.asc()).all()

    if len(observations) < 50:
        raise HTTPException(
            status_code=400,
            detail="At least 50 observations are recommended for model comparison",
        )

    rows = [
        {
            "timestamp": observation.timestamp,
            "value": float(observation.value), # type: ignore
            "entity_type": observation.entity_type,
            "entity_id": observation.entity_id,
        }
        for observation in observations
        if observation.value is not None
    ]

    if len(rows) < 50:
        raise HTTPException(
            status_code=400,
            detail="At least 50 valid numeric observations are required for model comparison",
        )

    selected_model_types = model_types or ["prophet", "sarima", "xgboost"]

    input_window_start = observations[0].timestamp
    input_window_end = observations[-1].timestamp

    forecast_start = input_window_end
    forecast_end = (
        forecast_start + timedelta(hours=forecast_periods)
        if normalized_frequency == "h"
        else forecast_start + timedelta(days=forecast_periods)
    )

    forecast_run = ForecastRun(
        tenant_id=current_user.tenant_id,
        model_id=None,
        run_type="model_comparison",
        status="running",
        training_start=datetime.utcnow(),
        forecast_start=forecast_start,
        forecast_end=forecast_end,
        input_window_start=input_window_start,
        input_window_end=input_window_end,
        created_at=datetime.utcnow(),
    )

    db.add(forecast_run)
    db.commit()
    db.refresh(forecast_run)

    try:
        comparison_result = compare_models(
            rows=rows,
            model_types=selected_model_types,
            forecast_periods=forecast_periods,
            frequency=normalized_frequency,
            config=config or {},
        )

        saved_results = []

        for item in comparison_result["forecast"]:
            result = ForecastResult(
                tenant_id=current_user.tenant_id,
                run_id=forecast_run.id,
                metric_id=metric_id,
                entity_type=entity_type,
                entity_id=entity_id,
                forecast_timestamp=item["forecast_timestamp"],
                predicted_value=Decimal(str(item["predicted_value"])),
                lower_bound=Decimal(str(item["lower_bound"])),
                upper_bound=Decimal(str(item["upper_bound"])),
                confidence_score=Decimal(str(item["confidence_score"])),
                created_at=datetime.utcnow(),
            )

            saved_results.append(result)

        db.add_all(saved_results)

        forecast_run.status = "completed" # type: ignore
        forecast_run.training_end = datetime.utcnow() # type: ignore
        forecast_run.completed_at = datetime.utcnow() # type: ignore
        forecast_run.performance_metrics = {   # type: ignore
            "comparison": comparison_result["models"],
            "best_model": comparison_result["best_model"],
        }

        db.commit()
        db.refresh(forecast_run)

        return {
            "message": "Model comparison completed successfully",
            "run_id": forecast_run.id,
            "metric_id": metric_id,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "horizon": horizon,
            "frequency": frequency,
            "best_model": comparison_result["best_model"],
            "models": comparison_result["models"],
            "forecast": comparison_result["forecast"],
        }

    except Exception as exc:
        forecast_run.status = "failed" # type: ignore
        forecast_run.error_message = str(exc) # type: ignore
        forecast_run.completed_at = datetime.utcnow() # type: ignore

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=f"Model comparison failed: {str(exc)}",
        )

def save_forecast_results(
    db,
    tenant_id: int,
    run_id: int,
    metric_id: int,
    entity_type: str,
    entity_id: int,
    forecast_rows: list[dict[str, Any]],
) -> list[ForecastResult]:
    saved_results = []

    for item in forecast_rows:
        result = ForecastResult(
            tenant_id=tenant_id,
            run_id=run_id,
            metric_id=metric_id,
            entity_type=entity_type,
            entity_id=entity_id,
            forecast_timestamp=item["forecast_timestamp"],
            predicted_value=Decimal(str(item["predicted_value"])),
            lower_bound=Decimal(str(item.get("lower_bound")))
            if item.get("lower_bound") is not None
            else None,
            upper_bound=Decimal(str(item.get("upper_bound")))
            if item.get("upper_bound") is not None
            else None,
            confidence_score=Decimal(str(item.get("confidence_score")))
            if item.get("confidence_score") is not None
            else None,
            created_at=datetime.utcnow(),
        )

        saved_results.append(result)

    db.add_all(saved_results)

    return saved_results

def get_forecast_results(
    db: Session,
    run_id: int,
    current_user,
):
    forecast_run = db.query(ForecastRun).filter(
        ForecastRun.id == run_id,
        ForecastRun.tenant_id == current_user.tenant_id,
    ).first()

    if not forecast_run:
        raise HTTPException(
            status_code=404,
            detail="Forecast run not found",
        )

    results = db.query(ForecastResult).filter(
        ForecastResult.run_id == run_id,
        ForecastResult.tenant_id == current_user.tenant_id,
    ).order_by(ForecastResult.forecast_timestamp.asc()).all()

    return {
        "run": {
            "id": forecast_run.id,
            "model_id": forecast_run.model_id,
            "run_type": forecast_run.run_type,
            "status": forecast_run.status,
            "forecast_start": forecast_run.forecast_start,
            "forecast_end": forecast_run.forecast_end,
            "input_window_start": forecast_run.input_window_start,
            "input_window_end": forecast_run.input_window_end,
            "performance_metrics": forecast_run.performance_metrics,
            "created_at": forecast_run.created_at,
            "completed_at": forecast_run.completed_at,
        },
        "results_count": len(results),
        "results": [
            {
                "id": result.id,
                "metric_id": result.metric_id,
                "entity_type": result.entity_type,
                "entity_id": result.entity_id,
                "forecast_timestamp": result.forecast_timestamp,
                "predicted_value": float(result.predicted_value) # type: ignore
                if result.predicted_value is not None
                else None,
                "lower_bound": float(result.lower_bound) # type: ignore
                if result.lower_bound is not None
                else None,
                "upper_bound": float(result.upper_bound) # type: ignore
                if result.upper_bound is not None
                else None,
                "confidence_score": float(result.confidence_score) # type: ignore
                if result.confidence_score is not None
                else None,
                "created_at": result.created_at,
            }
            for result in results
        ],
    }