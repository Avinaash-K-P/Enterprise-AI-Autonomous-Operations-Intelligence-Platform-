from datetime import datetime
from decimal import Decimal
from typing import Optional

import numpy as np
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.anomaly import AnomalyEvent
from app.models.forecast_metric import ForecastMetric
from app.models.observation import Observation

from app.schemas.anomaly import (
    AnomalyDetectionRequest,
    AnomalyEventCreate,
    AnomalyEventUpdate,
)

ALLOWED_STATUSES = {"open", "acknowledged", "resolved", "ignored"}
ALLOWED_SEVERITIES = {"low", "medium", "high", "critical"}


def create_anomaly_event(
    db: Session,
    payload: AnomalyEventCreate,
    current_user,
):
    metric = db.query(ForecastMetric).filter(
        ForecastMetric.id == payload.metric_id,
        ForecastMetric.tenant_id == current_user.tenant_id,
    ).first()

    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Forecast metric not found for this tenant",
        )

    anomaly = AnomalyEvent(
        tenant_id=current_user.tenant_id,
        metric_id=payload.metric_id,
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        observation_id=payload.observation_id,
        anomaly_type=payload.anomaly_type,
        severity=payload.severity,
        score=payload.score,
        actual_value=payload.actual_value,
        expected_value=payload.expected_value,
        deviation_percentage=payload.deviation_percentage,
        root_cause_hint=payload.root_cause_hint,
        description=payload.description,
        status=payload.status,
        extra_data=payload.extra_data,
        detected_at=datetime.utcnow(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.add(anomaly)
    db.commit()
    db.refresh(anomaly)

    return anomaly


def list_anomaly_events(
    db: Session,
    current_user,
    metric_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    severity: Optional[str] = None,
    status_filter: Optional[str] = None,
):
    query = db.query(AnomalyEvent).filter(
        AnomalyEvent.tenant_id == current_user.tenant_id,
    )

    if metric_id:
        query = query.filter(AnomalyEvent.metric_id == metric_id)

    if entity_type:
        query = query.filter(AnomalyEvent.entity_type == entity_type)

    if entity_id:
        query = query.filter(AnomalyEvent.entity_id == entity_id)

    if severity:
        query = query.filter(AnomalyEvent.severity == severity)

    if status_filter:
        query = query.filter(AnomalyEvent.status == status_filter)

    return query.order_by(AnomalyEvent.detected_at.desc()).all()


def get_anomaly_event_by_id(
    db: Session,
    anomaly_id: int,
    current_user,
):
    anomaly = db.query(AnomalyEvent).filter(
        AnomalyEvent.id == anomaly_id,
        AnomalyEvent.tenant_id == current_user.tenant_id,
    ).first()

    if not anomaly:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anomaly event not found",
        )

    return anomaly


def update_anomaly_event(
    db: Session,
    anomaly_id: int,
    payload: AnomalyEventUpdate,
    current_user,
):
    anomaly = get_anomaly_event_by_id(
        db=db,
        anomaly_id=anomaly_id,
        current_user=current_user,
    )

    update_data = payload.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid anomaly status",
        )

    if "severity" in update_data and update_data["severity"] not in ALLOWED_SEVERITIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid anomaly severity",
        )

    for field, value in update_data.items():
        setattr(anomaly, field, value)

    anomaly.updated_at = datetime.utcnow() # type: ignore

    db.commit()
    db.refresh(anomaly)

    return anomaly


def delete_anomaly_event(
    db: Session,
    anomaly_id: int,
    current_user,
):
    anomaly = get_anomaly_event_by_id(
        db=db,
        anomaly_id=anomaly_id,
        current_user=current_user,
    )

    db.delete(anomaly)
    db.commit()

    return {
        "message": "Anomaly event deleted successfully",
        "anomaly_id": anomaly_id,
    }


def _classify_severity(score: float) -> str:
    if score >= 4:
        return "critical"

    if score >= 3:
        return "high"

    if score >= 2:
        return "medium"

    return "low"


def _build_root_cause_hint(value: float, mean_value: float, deviation_percentage: float) -> str:
    if value > mean_value and deviation_percentage >= 50:
        return "Unusual usage spike or possible resource leakage"

    if value < mean_value and deviation_percentage >= 50:
        return "Unexpected operational drop or possible device failure"

    if value > mean_value:
        return "Above normal operating range"

    return "Below normal operating range"


def detect_anomalies(
    db: Session,
    payload: AnomalyDetectionRequest,
    current_user,
):
    metric = db.query(ForecastMetric).filter(
        ForecastMetric.id == payload.metric_id,
        ForecastMetric.tenant_id == current_user.tenant_id,
    ).first()

    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Forecast metric not found for this tenant",
        )

    observations = db.query(Observation).filter(
        Observation.tenant_id == current_user.tenant_id,
        Observation.metric_id == payload.metric_id,
        Observation.entity_type == payload.entity_type,
        Observation.entity_id == payload.entity_id,
    ).order_by(Observation.timestamp.asc()).all()

    valid_observations = [
        observation for observation in observations if observation.value is not None
    ]

    if len(valid_observations) < 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 20 valid observations are required for anomaly detection",
        )

    values = np.array([float(observation.value) for observation in valid_observations]) # type: ignore

    mean_value = float(np.mean(values))
    std_value = float(np.std(values))

    if std_value == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot detect anomalies when all values are identical",
        )

    sensitivity = float(payload.sensitivity)
    detected_events = []

    for observation in valid_observations:
        actual_value = float(observation.value) # type: ignore
        z_score = abs((actual_value - mean_value) / std_value)

        if z_score >= sensitivity:
            deviation_percentage = (
                abs(actual_value - mean_value) / mean_value * 100
                if mean_value != 0
                else 0
            )

            severity = _classify_severity(z_score)

            anomaly = AnomalyEvent(
                tenant_id=current_user.tenant_id,
                metric_id=payload.metric_id,
                observation_id=observation.id,
                entity_type=payload.entity_type,
                entity_id=payload.entity_id,
                anomaly_type="statistical_outlier",
                severity=severity,
                score=Decimal(str(round(z_score, 4))),
                actual_value=Decimal(str(actual_value)),
                expected_value=Decimal(str(round(mean_value, 4))),
                deviation_percentage=Decimal(str(round(deviation_percentage, 4))),
                root_cause_hint=_build_root_cause_hint(
                    value=actual_value,
                    mean_value=mean_value,
                    deviation_percentage=deviation_percentage,
                ),
                description=(
                    f"Observed value {actual_value:.2f} deviates from expected "
                    f"baseline {mean_value:.2f} with anomaly score {z_score:.2f}."
                ),
                status="open",
                extra_data={
                    "method": payload.method,
                    "sensitivity": sensitivity,
                    "std_value": round(std_value, 4),
                },
                detected_at=observation.timestamp,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )

            db.add(anomaly)
            detected_events.append(anomaly)

    db.commit()

    for anomaly in detected_events:
        db.refresh(anomaly)

    return {
        "message": "Anomaly detection completed successfully",
        "metric_id": payload.metric_id,
        "entity_type": payload.entity_type,
        "entity_id": payload.entity_id,
        "method": payload.method,
        "total_observations": len(valid_observations),
        "anomalies_detected": len(detected_events),
        "anomalies": detected_events,
    }