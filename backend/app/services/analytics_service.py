from datetime import datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.anomaly import AnomalyEvent
from app.models.forecast_result import ForecastResult
from app.models.observation import Observation
from sqlalchemy import func

from app.models.forecast_metric import ForecastMetric
from app.models.forecast_run import ForecastRun
from app.models.optimization import OptimizationRecommendation
from app.models.scenario import ScenarioSimulation
from app.services.root_cause_service import analyze_root_cause
from app.schemas.root_cause import RootCauseAnalysisRequest

def get_historical_vs_predicted_analytics(
    db: Session,
    current_user,
    metric_id: int,
    entity_type: str,
    entity_id: int,
    run_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    historical_query = db.query(Observation).filter(
        Observation.tenant_id == current_user.tenant_id,
        Observation.metric_id == metric_id,
        Observation.entity_type == entity_type,
        Observation.entity_id == entity_id,
    )

    if start_date:
        historical_query = historical_query.filter(
            Observation.timestamp >= start_date
        )

    if end_date:
        historical_query = historical_query.filter(
            Observation.timestamp <= end_date
        )

    historical_rows = historical_query.order_by(
        Observation.timestamp.asc()
    ).all()

    forecast_query = db.query(ForecastResult).filter(
        ForecastResult.tenant_id == current_user.tenant_id,
        ForecastResult.metric_id == metric_id,
        ForecastResult.entity_type == entity_type,
        ForecastResult.entity_id == entity_id,
    )

    if run_id:
        forecast_query = forecast_query.filter(ForecastResult.run_id == run_id)

    forecast_rows = forecast_query.order_by(
        ForecastResult.forecast_timestamp.asc()
    ).all()

    return {
        "metric_id": metric_id,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "run_id": run_id,
        "historical": [
            {
                "timestamp": row.timestamp,
                "value": float(row.value) if row.value is not None else None, # type: ignore
                "quality_flag": row.quality_flag,
                "source": row.source,
            }
            for row in historical_rows
        ],
        "predicted": [
            {
                "timestamp": row.forecast_timestamp,
                "predicted_value": float(row.predicted_value) # type: ignore
                if row.predicted_value is not None
                else None,
                "lower_bound": float(row.lower_bound) # type: ignore
                if row.lower_bound is not None
                else None,
                "upper_bound": float(row.upper_bound) # type: ignore
                if row.upper_bound is not None
                else None,
                "confidence_score": float(row.confidence_score) # type: ignore
                if row.confidence_score is not None
                else None,
            }
            for row in forecast_rows
        ],
    }


def get_anomaly_heatmap(
    db: Session,
    current_user,
    metric_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    query = db.query(
        AnomalyEvent.entity_type,
        AnomalyEvent.entity_id,
        AnomalyEvent.severity,
        func.count(AnomalyEvent.id).label("anomaly_count"),
        func.avg(AnomalyEvent.score).label("average_score"),
    ).filter(
        AnomalyEvent.tenant_id == current_user.tenant_id,
    )

    if metric_id:
        query = query.filter(AnomalyEvent.metric_id == metric_id)

    if entity_type:
        query = query.filter(AnomalyEvent.entity_type == entity_type)

    if start_date:
        query = query.filter(AnomalyEvent.detected_at >= start_date)

    if end_date:
        query = query.filter(AnomalyEvent.detected_at <= end_date)

    rows = query.group_by(
        AnomalyEvent.entity_type,
        AnomalyEvent.entity_id,
        AnomalyEvent.severity,
    ).order_by(
        func.count(AnomalyEvent.id).desc()
    ).all()

    severity_weight = {
        "low": 1,
        "medium": 2,
        "high": 3,
        "critical": 4,
    }

    heatmap_points = []

    for row in rows:
        heatmap_points.append(
            {
                "entity_type": row.entity_type,
                "entity_id": row.entity_id,
                "severity": row.severity,
                "anomaly_count": row.anomaly_count,
                "average_score": float(row.average_score)
                if row.average_score is not None
                else 0,
                "heat_value": row.anomaly_count
                * severity_weight.get(row.severity, 1),
            }
        )

    return {
        "metric_id": metric_id,
        "entity_type": entity_type,
        "start_date": start_date,
        "end_date": end_date,
        "heatmap": heatmap_points,
    }


def get_optimization_recommendation_panel(
    db: Session,
    current_user,
    status_filter: Optional[str] = None,
    limit: int = 10,
):
    query = db.query(OptimizationRecommendation).filter(
        OptimizationRecommendation.tenant_id == current_user.tenant_id,
    )

    if status_filter:
        query = query.filter(OptimizationRecommendation.status == status_filter)

    recommendations = query.order_by(
        OptimizationRecommendation.rank.asc(),
        OptimizationRecommendation.estimated_cost_savings.desc(),
    ).limit(limit).all()

    return {
        "total": len(recommendations),
        "recommendations": [
            {
                "id": rec.id,
                "recommendation_type": rec.recommendation_type,
                "title": rec.title,
                "description": rec.description,
                "entity_type": rec.entity_type,
                "entity_id": rec.entity_id,
                "priority": rec.priority,
                "rank": rec.rank,
                "confidence_score": float(rec.confidence_score) # type: ignore
                if rec.confidence_score is not None
                else None,
                "estimated_cost_savings": float(rec.estimated_cost_savings) # type: ignore
                if rec.estimated_cost_savings is not None
                else None,
                "estimated_operational_impact": float(rec.estimated_operational_impact) # type: ignore
                if rec.estimated_operational_impact is not None
                else None,
                "estimated_resource_change": float(rec.estimated_resource_change) # type: ignore
                if rec.estimated_resource_change is not None
                else None,
                "estimated_performance_improvement": float(
                    rec.estimated_performance_improvement # type: ignore
                )
                if rec.estimated_performance_improvement is not None
                else None,
                "risk_level": rec.risk_level,
                "reason": rec.reason,
                "action_plan": rec.action_plan,
                "status": rec.status,
                "expires_at": rec.expires_at,
            }
            for rec in recommendations
        ],
    }


def get_forecast_confidence_intervals(
    db: Session,
    current_user,
    run_id: int,
):
    forecast_rows = db.query(ForecastResult).filter(
        ForecastResult.tenant_id == current_user.tenant_id,
        ForecastResult.run_id == run_id,
    ).order_by(ForecastResult.forecast_timestamp.asc()).all()

    return {
        "run_id": run_id,
        "points": [
            {
                "timestamp": row.forecast_timestamp,
                "predicted_value": float(row.predicted_value) # type: ignore
                if row.predicted_value is not None
                else None,
                "lower_bound": float(row.lower_bound)# type: ignore
                if row.lower_bound is not None
                else None,
                "upper_bound": float(row.upper_bound)# type: ignore
                if row.upper_bound is not None
                else None,
                "confidence_score": float(row.confidence_score)# type: ignore
                if row.confidence_score is not None
                else None,
            }
            for row in forecast_rows
        ],
    }


def get_kpi_monitoring(
    db: Session,
    current_user,
):
    total_forecast_results = db.query(ForecastResult).filter(
        ForecastResult.tenant_id == current_user.tenant_id,
    ).count()

    average_predicted_value = db.query(
        func.avg(ForecastResult.predicted_value)
    ).filter(
        ForecastResult.tenant_id == current_user.tenant_id,
    ).scalar()

    total_estimated_savings = db.query(
        func.coalesce(func.sum(OptimizationRecommendation.estimated_cost_savings), 0)
    ).filter(
        OptimizationRecommendation.tenant_id == current_user.tenant_id,
    ).scalar()

    active_recommendations = db.query(OptimizationRecommendation).filter(
        OptimizationRecommendation.tenant_id == current_user.tenant_id,
        OptimizationRecommendation.status.in_(["pending", "approved"]),
    ).count()

    average_failure_probability = db.query(
        func.avg(ScenarioSimulation.failure_probability)
    ).filter(
        ScenarioSimulation.tenant_id == current_user.tenant_id,
    ).scalar()

    average_performance_degradation = db.query(
        func.avg(ScenarioSimulation.performance_degradation)
    ).filter(
        ScenarioSimulation.tenant_id == current_user.tenant_id,
    ).scalar()

    return {
        "total_forecast_results": total_forecast_results,
        "average_predicted_value": float(average_predicted_value)
        if average_predicted_value is not None
        else 0,
        "total_estimated_savings": float(total_estimated_savings)
        if total_estimated_savings is not None
        else 0,
        "active_recommendations": active_recommendations,
        "average_failure_probability": float(average_failure_probability)
        if average_failure_probability is not None
        else 0,
        "average_performance_degradation": float(average_performance_degradation)
        if average_performance_degradation is not None
        else 0,
    }

def get_dashboard_overview(
    db: Session,
    current_user,
):
    total_metrics = db.query(ForecastMetric).filter(
        ForecastMetric.tenant_id == current_user.tenant_id,
    ).count()

    total_forecast_runs = db.query(ForecastRun).filter(
        ForecastRun.tenant_id == current_user.tenant_id,
    ).count()

    total_anomalies = db.query(AnomalyEvent).filter(
        AnomalyEvent.tenant_id == current_user.tenant_id,
    ).count()

    open_anomalies = db.query(AnomalyEvent).filter(
        AnomalyEvent.tenant_id == current_user.tenant_id,
        AnomalyEvent.status == "open",
    ).count()

    total_recommendations = db.query(OptimizationRecommendation).filter(
        OptimizationRecommendation.tenant_id == current_user.tenant_id,
    ).count()

    total_simulations = db.query(ScenarioSimulation).filter(
        ScenarioSimulation.tenant_id == current_user.tenant_id,
    ).count()

    estimated_savings = db.query(
        func.coalesce(func.sum(OptimizationRecommendation.estimated_cost_savings), 0)
    ).filter(
        OptimizationRecommendation.tenant_id == current_user.tenant_id,
    ).scalar()

    return {
        "tenant_id": current_user.tenant_id,
        "generated_at": datetime.utcnow(),
        "cards": {
            "total_metrics": total_metrics,
            "total_forecast_runs": total_forecast_runs,
            "total_anomalies": total_anomalies,
            "open_anomalies": open_anomalies,
            "total_recommendations": total_recommendations,
            "total_simulations": total_simulations,
            "estimated_savings": float(estimated_savings or 0),
        },
    }


def get_facility_device_comparison(
    db: Session,
    current_user,
    metric_id: Optional[int] = None,
    entity_type: Optional[str] = None,
):
    query = db.query(
        AnomalyEvent.entity_type,
        AnomalyEvent.entity_id,
        func.count(AnomalyEvent.id).label("anomaly_count"),
        func.avg(AnomalyEvent.score).label("average_anomaly_score"),
    ).filter(
        AnomalyEvent.tenant_id == current_user.tenant_id,
    )

    if metric_id:
        query = query.filter(AnomalyEvent.metric_id == metric_id)

    if entity_type:
        query = query.filter(AnomalyEvent.entity_type == entity_type)

    rows = query.group_by(
        AnomalyEvent.entity_type,
        AnomalyEvent.entity_id,
    ).order_by(
        func.count(AnomalyEvent.id).desc()
    ).all()

    return {
        "metric_id": metric_id,
        "entity_type": entity_type,
        "comparisons": [
            {
                "entity_type": row.entity_type,
                "entity_id": row.entity_id,
                "anomaly_count": row.anomaly_count,
                "average_anomaly_score": float(row.average_anomaly_score)
                if row.average_anomaly_score is not None
                else 0,
            }
            for row in rows
        ],
    }

def get_root_cause_visualization(
    db: Session,
    current_user,
    anomaly_id: int,
    lookback_hours: int = 24,
):
    payload = RootCauseAnalysisRequest(
        lookback_hours=lookback_hours,
        include_feature_importance=True,
        include_impact_chain=True,
    )

    analysis = analyze_root_cause(
        db=db,
        anomaly_id=anomaly_id,
        payload=payload,
        current_user=current_user,
    )

    nodes = [
        {
            "id": f"anomaly-{analysis['anomaly_id']}",
            "label": f"Anomaly {analysis['anomaly_id']}",
            "type": "anomaly",
            "severity": analysis["severity"],
        }
    ]

    edges = []

    for cause in analysis["likely_causes"]:
        cause_id = f"cause-{cause['cause_type']}"

        nodes.append(
            {
                "id": cause_id,
                "label": cause["cause_type"].replace("_", " ").title(),
                "type": "likely_cause",
                "confidence_score": float(cause["confidence_score"]),
            }
        )

        edges.append(
            {
                "source": cause_id,
                "target": f"anomaly-{analysis['anomaly_id']}",
                "label": "likely caused",
            }
        )

    for metric in analysis["correlated_metrics"]:
        metric_id = f"metric-{metric['metric_id']}"

        nodes.append(
            {
                "id": metric_id,
                "label": metric["metric_name"],
                "type": "correlated_metric",
                "correlation_score": float(metric["correlation_score"]),
            }
        )

        edges.append(
            {
                "source": metric_id,
                "target": f"anomaly-{analysis['anomaly_id']}",
                "label": metric["relationship_type"],
            }
        )

    return {
        "anomaly_id": anomaly_id,
        "summary": analysis["summary"],
        "confidence_score": float(analysis["confidence_score"]),
        "nodes": nodes,
        "edges": edges,
        "feature_importance": analysis["feature_importance"],
        "impact_chain": analysis["impact_chain"],
    }

def get_simulation_dashboard(
    db: Session,
    current_user,
):
    scenarios = db.query(ScenarioSimulation).filter(
        ScenarioSimulation.tenant_id == current_user.tenant_id,
    ).order_by(ScenarioSimulation.created_at.desc()).limit(20).all()

    return {
        "total": len(scenarios),
        "scenarios": [
            {
                "id": scenario.id,
                "name": scenario.name,
                "scenario_type": scenario.scenario_type,
                "entity_type": scenario.entity_type,
                "entity_id": scenario.entity_id,
                "severity": scenario.severity,
                "operational_impact": float(scenario.operational_impact) # type: ignore
                if scenario.operational_impact is not None
                else 0,
                "cost_change": float(scenario.cost_change) # type: ignore
                if scenario.cost_change is not None
                else 0,
                "resource_consumption_change": float(
                    scenario.resource_consumption_change # type: ignore
                )
                if scenario.resource_consumption_change is not None
                else 0,
                "failure_probability": float(scenario.failure_probability) # type: ignore
                if scenario.failure_probability is not None
                else 0,
                "performance_degradation": float(scenario.performance_degradation) # type: ignore
                if scenario.performance_degradation is not None
                else 0,
                "predicted_savings": float(scenario.predicted_savings) # type: ignore
                if scenario.predicted_savings is not None
                else 0,
                "status": scenario.status,
                "created_at": scenario.created_at,
            }
            for scenario in scenarios
        ],
    }

def get_model_performance_tracking(
    db: Session,
    current_user,
):
    runs = db.query(ForecastRun).filter(
        ForecastRun.tenant_id == current_user.tenant_id,
    ).order_by(ForecastRun.created_at.desc()).limit(30).all()

    performance_rows = []

    for run in runs:
        metrics = run.performance_metrics or {}

        performance_rows.append(
            {
                "run_id": run.id,
                "model_id": run.model_id,
                "run_type": run.run_type,
                "status": run.status,
                "mae": metrics.get("mae"),
                "rmse": metrics.get("rmse"),
                "mape": metrics.get("mape"),
                "created_at": run.created_at,
                "completed_at": run.completed_at,
            }
        )

    return {
        "total": len(performance_rows),
        "performance": performance_rows,
    }