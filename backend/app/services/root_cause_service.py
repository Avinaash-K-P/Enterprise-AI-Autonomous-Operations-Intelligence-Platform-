from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any

import numpy as np
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.anomaly import AnomalyEvent
from app.models.forecast_metric import ForecastMetric
from app.models.observation import Observation


def analyze_root_cause(
    db: Session,
    anomaly_id: int,
    payload,
    current_user,
) -> dict[str, Any]:
    anomaly = _get_anomaly_for_tenant(
        db=db,
        anomaly_id=anomaly_id,
        tenant_id=current_user.tenant_id,
    )

    anomaly_metric = _get_metric_for_tenant(
        db=db,
        metric_id=anomaly.metric_id, # type: ignore
        tenant_id=current_user.tenant_id,
    )

    window_start = anomaly.detected_at - timedelta(hours=payload.lookback_hours)
    window_end = anomaly.detected_at + timedelta(hours=1)

    target_series = _get_observation_series(
        db=db,
        tenant_id=current_user.tenant_id,
        metric_id=anomaly.metric_id, # type: ignore
        entity_type=anomaly.entity_type, # type: ignore
        entity_id=anomaly.entity_id,# type: ignore
        start_time=window_start,# type: ignore
        end_time=window_end,# type: ignore
    )

    correlated_metrics = _find_correlated_metrics(
        db=db,
        tenant_id=current_user.tenant_id,
        anomaly=anomaly,
        target_series=target_series,
        start_time=window_start,# type: ignore
        end_time=window_end,# type: ignore
    )

    likely_causes = _generate_likely_causes(
        anomaly=anomaly,
        anomaly_metric=anomaly_metric,
        correlated_metrics=correlated_metrics,
    )

    feature_importance = (
        _generate_feature_importance(
            anomaly=anomaly,
            correlated_metrics=correlated_metrics,
        )
        if payload.include_feature_importance
        else []
    )

    impact_chain = (
        _generate_impact_chain(
            anomaly=anomaly,
            correlated_metrics=correlated_metrics,
        )
        if payload.include_impact_chain
        else []
    )

    confidence_score = _calculate_rca_confidence(
        anomaly_score=float(anomaly.score), # type: ignore
        correlated_metrics=correlated_metrics,
        likely_causes=likely_causes,
    )

    summary = _build_rca_summary(
        anomaly=anomaly,
        anomaly_metric=anomaly_metric,
        likely_causes=likely_causes,
        correlated_metrics=correlated_metrics,
    )

    return {
        "anomaly_id": anomaly.id,
        "tenant_id": anomaly.tenant_id,
        "metric_id": anomaly.metric_id,
        "entity_type": anomaly.entity_type,
        "entity_id": anomaly.entity_id,
        "anomaly_type": anomaly.anomaly_type,
        "severity": anomaly.severity,
        "anomaly_score": anomaly.score,
        "summary": summary,
        "likely_causes": likely_causes,
        "correlated_metrics": correlated_metrics,
        "feature_importance": feature_importance,
        "impact_chain": impact_chain,
        "confidence_score": Decimal(str(confidence_score)),
        "generated_at": datetime.utcnow(),
        "metadata": {
            "lookback_hours": payload.lookback_hours,
            "analysis_window_start": window_start.isoformat(),
            "analysis_window_end": window_end.isoformat(),
            "method": "correlation_rule_based_rca",
        },
    }


def _get_anomaly_for_tenant(
    db: Session,
    anomaly_id: int,
    tenant_id: int,
) -> AnomalyEvent:
    anomaly = db.query(AnomalyEvent).filter(
        AnomalyEvent.id == anomaly_id,
        AnomalyEvent.tenant_id == tenant_id,
    ).first()

    if not anomaly:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anomaly event not found",
        )

    return anomaly


def _get_metric_for_tenant(
    db: Session,
    metric_id: int,
    tenant_id: int,
) -> ForecastMetric:
    metric = db.query(ForecastMetric).filter(
        ForecastMetric.id == metric_id,
        ForecastMetric.tenant_id == tenant_id,
    ).first()

    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Forecast metric not found",
        )

    return metric


def _get_observation_series(
    db: Session,
    tenant_id: int,
    metric_id: int,
    entity_type: str,
    entity_id: int,
    start_time: datetime,
    end_time: datetime,
) -> list[dict[str, Any]]:
    observations = db.query(Observation).filter(
        Observation.tenant_id == tenant_id,
        Observation.metric_id == metric_id,
        Observation.entity_type == entity_type,
        Observation.entity_id == entity_id,
        Observation.timestamp >= start_time,
        Observation.timestamp <= end_time,
    ).order_by(Observation.timestamp.asc()).all()

    return [
        {
            "timestamp": observation.timestamp,
            "value": float(observation.value), # type: ignore
        }
        for observation in observations
        if observation.value is not None
    ]


def _find_correlated_metrics(
    db: Session,
    tenant_id: int,
    anomaly: AnomalyEvent,
    target_series: list[dict[str, Any]],
    start_time: datetime,
    end_time: datetime,
) -> list[dict[str, Any]]:
    if len(target_series) < 5:
        return []

    target_values = np.array([item["value"] for item in target_series], dtype=float)

    related_metric_ids = db.query(Observation.metric_id).filter(
        Observation.tenant_id == tenant_id,
        Observation.entity_type == anomaly.entity_type,
        Observation.entity_id == anomaly.entity_id,
        Observation.metric_id != anomaly.metric_id,
        Observation.timestamp >= start_time,
        Observation.timestamp <= end_time,
    ).distinct().all()

    insights = []

    for metric_id_tuple in related_metric_ids:
        related_metric_id = metric_id_tuple[0]

        related_metric = db.query(ForecastMetric).filter(
            ForecastMetric.id == related_metric_id,
            ForecastMetric.tenant_id == tenant_id,
        ).first()

        related_series = _get_observation_series(
            db=db,
            tenant_id=tenant_id,
            metric_id=related_metric_id,
            entity_type=anomaly.entity_type, # type: ignore
            entity_id=anomaly.entity_id, # type: ignore
            start_time=start_time,
            end_time=end_time,
        )

        if len(related_series) < 5:
            continue

        related_values = np.array(
            [item["value"] for item in related_series],
            dtype=float,
        )

        min_length = min(len(target_values), len(related_values))

        if min_length < 5:
            continue

        correlation = float(
            np.corrcoef(
                target_values[-min_length:],
                related_values[-min_length:],
            )[0, 1]
        )

        if np.isnan(correlation):
            continue

        if abs(correlation) >= 0.5:
            relationship_type = (
                "positive_correlation"
                if correlation > 0
                else "negative_correlation"
            )

            metric_name = related_metric.name if related_metric else None

            insights.append(
                {
                    "metric_id": related_metric_id,
                    "metric_name": metric_name,
                    "correlation_score": Decimal(str(round(correlation, 4))),
                    "relationship_type": relationship_type,
                    "explanation": (
                        f"{metric_name or 'Related metric'} shows a "
                        f"{relationship_type.replace('_', ' ')} of "
                        f"{correlation:.2f} with the anomaly metric."
                    ),
                }
            )

    return sorted(
        insights,
        key=lambda item: abs(float(item["correlation_score"])),
        reverse=True,
    )


def _generate_likely_causes(
    anomaly: AnomalyEvent,
    anomaly_metric: ForecastMetric,
    correlated_metrics: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    causes = []

    metric_text = f"{anomaly_metric.name} anomaly"

    if anomaly.anomaly_type in {"spike", "statistical_outlier"}:
        causes.append(
            {
                "cause_type": "usage_spike",
                "confidence_score": Decimal("0.72"),
                "explanation": (
                    f"{metric_text} may be caused by abnormal demand, "
                    "equipment overuse, or sudden operational load increase."
                ),
                "supporting_evidence": [
                    f"Anomaly score: {anomaly.score}",
                    f"Deviation percentage: {anomaly.deviation_percentage}",
                ],
            }
        )

    if anomaly.actual_value and anomaly.expected_value: # type: ignore
        if anomaly.actual_value > anomaly.expected_value: # type: ignore
            causes.append(
                {
                    "cause_type": "above_expected_baseline",
                    "confidence_score": Decimal("0.68"),
                    "explanation": (
                        f"Actual value exceeded the expected baseline for "
                        f"{anomaly_metric.name}."
                    ),
                    "supporting_evidence": [
                        f"Actual value: {anomaly.actual_value}",
                        f"Expected value: {anomaly.expected_value}",
                    ],
                }
            )
        else:
            causes.append(
                {
                    "cause_type": "below_expected_baseline",
                    "confidence_score": Decimal("0.64"),
                    "explanation": (
                        f"Actual value dropped below the expected baseline for "
                        f"{anomaly_metric.name}."
                    ),
                    "supporting_evidence": [
                        f"Actual value: {anomaly.actual_value}",
                        f"Expected value: {anomaly.expected_value}",
                    ],
                }
            )

    for correlated_metric in correlated_metrics[:2]:
        causes.append(
            {
                "cause_type": "correlated_metric_influence",
                "confidence_score": Decimal("0.76"),
                "explanation": (
                    f"{correlated_metric['metric_name']} may have contributed "
                    f"to the anomaly due to strong correlation."
                ),
                "supporting_evidence": [
                    f"Correlation score: {correlated_metric['correlation_score']}",
                    correlated_metric["explanation"],
                ],
            }
        )

    return causes


def _generate_feature_importance(
    anomaly: AnomalyEvent,
    correlated_metrics: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    features = [
        {
            "feature_name": "anomaly_score",
            "importance_score": Decimal(str(min(float(anomaly.score) / 5, 1))), # type: ignore
            "explanation": "Higher anomaly score increases root-cause confidence.",
        },
        {
            "feature_name": "deviation_percentage",
            "importance_score": Decimal(
                str(
                    min(
                        float(anomaly.deviation_percentage or 0) / 100, # type: ignore
                        1,
                    )
                )
            ),
            "explanation": "Large deviation from expected baseline increases severity.",
        },
    ]

    for correlated_metric in correlated_metrics[:3]:
        features.append(
            {
                "feature_name": f"correlation_metric_{correlated_metric['metric_id']}",
                "importance_score": Decimal(
                    str(abs(float(correlated_metric["correlation_score"])))
                ),
                "explanation": (
                    f"{correlated_metric['metric_name']} had strong relationship "
                    "with the anomaly window."
                ),
            }
        )

    return sorted(
        features,
        key=lambda item: float(item["importance_score"]),
        reverse=True,
    )


def _generate_impact_chain(
    anomaly: AnomalyEvent,
    correlated_metrics: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    impact_chain = []

    for correlated_metric in correlated_metrics[:3]:
        if correlated_metric["relationship_type"] == "positive_correlation":
            impact_type = "amplifies"
        else:
            impact_type = "inversely_related"

        impact_chain.append(
            {
                "source": correlated_metric["metric_name"] or "Related metric",
                "target": f"{anomaly.entity_type}:{anomaly.entity_id}",
                "impact_type": impact_type,
                "severity": anomaly.severity,
                "explanation": (
                    f"{correlated_metric['metric_name']} appears to "
                    f"{impact_type.replace('_', ' ')} the anomaly behavior."
                ),
            }
        )

    return impact_chain


def _calculate_rca_confidence(
    anomaly_score: float,
    correlated_metrics: list[dict[str, Any]],
    likely_causes: list[dict[str, Any]],
) -> float:
    base_confidence = min(anomaly_score / 5, 0.7)

    correlation_boost = min(len(correlated_metrics) * 0.08, 0.2)
    cause_boost = min(len(likely_causes) * 0.04, 0.1)

    return round(min(base_confidence + correlation_boost + cause_boost, 0.95), 4)


def _build_rca_summary(
    anomaly: AnomalyEvent,
    anomaly_metric: ForecastMetric,
    likely_causes: list[dict[str, Any]],
    correlated_metrics: list[dict[str, Any]],
) -> str:
    if correlated_metrics:
        top_metric = correlated_metrics[0]["metric_name"] or "a related metric"

        return (
            f"{anomaly_metric.name} anomaly for {anomaly.entity_type} "
            f"{anomaly.entity_id} is likely associated with {top_metric}. "
            f"The anomaly was classified as {anomaly.severity} severity."
        )

    if likely_causes:
        return (
            f"{anomaly_metric.name} anomaly for {anomaly.entity_type} "
            f"{anomaly.entity_id} is likely caused by "
            f"{likely_causes[0]['cause_type'].replace('_', ' ')}."
        )

    return (
        f"{anomaly_metric.name} anomaly for {anomaly.entity_type} "
        f"{anomaly.entity_id} was detected, but no strong correlated cause "
        "was found in the selected analysis window."
    )