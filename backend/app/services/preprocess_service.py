from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.ml.preprocess import preprocess_time_series
from app.models.forecast_metric import ForecastMetric
from app.models.observation import Observation

def get_preprocessed_observations(
    db: Session,
    metric_id: int,
    current_user,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    frequency: str = "h",
):
    metric = db.query(ForecastMetric).filter(
        ForecastMetric.id == metric_id,
        ForecastMetric.tenant_id == current_user.tenant_id,
    ).first()

    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Forecast metric not found for this tenant",
        )

    query = db.query(Observation).filter(
        Observation.tenant_id == current_user.tenant_id,
        Observation.metric_id == metric_id,
    )

    if entity_type:
        query = query.filter(Observation.entity_type == entity_type)

    if entity_id:
        query = query.filter(Observation.entity_id == entity_id)

    if start_date:
        query = query.filter(Observation.timestamp >= start_date)

    if end_date:
        query = query.filter(Observation.timestamp <= end_date)

    observations = query.order_by(Observation.timestamp.asc()).all()

    if not observations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No observations found for preprocessing",
        )

    rows = [
        {
            "entity_type": observation.entity_type,
            "entity_id": observation.entity_id,
            "timestamp": observation.timestamp,
            "value": float(observation.value), # type: ignore
        }
        for observation in observations
    ]

    result = preprocess_time_series(
        rows=rows,
        frequency=frequency,
    )

    return {
        "metric": {
            "id": metric.id,
            "name": metric.name,
            "code": metric.code,
            "unit": metric.unit,
            "category": metric.category,
        },
        "filters": {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "start_date": start_date,
            "end_date": end_date,
            "frequency": frequency,
        },
        "preprocessing": result,
    }