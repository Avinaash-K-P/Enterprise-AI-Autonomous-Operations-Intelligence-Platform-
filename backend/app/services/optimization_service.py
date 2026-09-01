from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.anomaly import AnomalyEvent
from app.models.forecast_run import ForecastRun
from app.models.optimization import OptimizationRecommendation
from app.models.scenario import ScenarioSimulation


ALLOWED_SOURCE_TYPES = {
    "forecast_run",
    "anomaly_event",
    "simulation_scenario",
    "root_cause_analysis",
}

ALLOWED_RECOMMENDATION_TYPES = {
    "load_balancing",
    "resource_redistribution",
    "predictive_shutdown",
    "cost_optimization",
    "capacity_planning",
    "dynamic_scheduling",
}


def generate_optimization_recommendations(
    db: Session,
    payload,
    current_user,
):
    if payload.source_type not in ALLOWED_SOURCE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid optimization source type",
        )

    requested_types = payload.include_types or list(ALLOWED_RECOMMENDATION_TYPES)

    invalid_types = set(requested_types) - ALLOWED_RECOMMENDATION_TYPES

    if invalid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid recommendation types: {', '.join(invalid_types)}",
        )

    source_context = _get_optimization_source_context(
        db=db,
        source_type=payload.source_type,
        source_id=payload.source_id,
        tenant_id=current_user.tenant_id,
    )

    recommendations = []

    for recommendation_type in requested_types:
        recommendation_data = _build_recommendation_data(
            recommendation_type=recommendation_type,
            source_type=payload.source_type,
            source_context=source_context,
            entity_type=payload.entity_type,
            entity_id=payload.entity_id,
        )

        recommendation = OptimizationRecommendation(
            tenant_id=current_user.tenant_id,
            source_type=payload.source_type,
            source_id=payload.source_id,
            recommendation_type=recommendation_type,
            title=recommendation_data["title"],
            description=recommendation_data["description"],
            entity_type=payload.entity_type,
            entity_id=payload.entity_id,
            priority=recommendation_data["priority"],
            rank=1,
            confidence_score=recommendation_data["confidence_score"],
            estimated_cost_savings=recommendation_data["estimated_cost_savings"],
            estimated_operational_impact=recommendation_data[
                "estimated_operational_impact"
            ],
            estimated_resource_change=recommendation_data["estimated_resource_change"],
            estimated_performance_improvement=recommendation_data[
                "estimated_performance_improvement"
            ],
            risk_level=recommendation_data["risk_level"],
            reason=recommendation_data["reason"],
            action_plan=recommendation_data["action_plan"],
            status="pending",
            created_by=current_user.id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=7),
        )

        recommendations.append(recommendation)

    recommendations = _rank_recommendations(recommendations)

    db.add_all(recommendations)
    db.commit()

    for recommendation in recommendations:
        db.refresh(recommendation)

    return {
        "message": "Optimization recommendations generated successfully",
        "source_type": payload.source_type,
        "source_id": payload.source_id,
        "recommendations_count": len(recommendations),
        "recommendations": recommendations,
    }


def list_optimization_recommendations(
    db: Session,
    current_user,
    source_type: Optional[str] = None,
    recommendation_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
):
    query = db.query(OptimizationRecommendation).filter(
        OptimizationRecommendation.tenant_id == current_user.tenant_id,
    )

    if source_type:
        query = query.filter(OptimizationRecommendation.source_type == source_type)

    if recommendation_type:
        query = query.filter(
            OptimizationRecommendation.recommendation_type == recommendation_type
        )

    if status_filter:
        query = query.filter(OptimizationRecommendation.status == status_filter)

    if entity_type:
        query = query.filter(OptimizationRecommendation.entity_type == entity_type)

    if entity_id:
        query = query.filter(OptimizationRecommendation.entity_id == entity_id)

    return query.order_by(
        OptimizationRecommendation.rank.asc(),
        OptimizationRecommendation.created_at.desc(),
    ).all()


def get_optimization_recommendation_by_id(
    db: Session,
    recommendation_id: int,
    current_user,
):
    recommendation = db.query(OptimizationRecommendation).filter(
        OptimizationRecommendation.id == recommendation_id,
        OptimizationRecommendation.tenant_id == current_user.tenant_id,
    ).first()

    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Optimization recommendation not found",
        )

    return recommendation


def _get_optimization_source_context(
    db: Session,
    source_type: str,
    source_id: int,
    tenant_id: int,
):
    if source_type == "forecast_run":
        source = db.query(ForecastRun).filter(
            ForecastRun.id == source_id,
            ForecastRun.tenant_id == tenant_id,
        ).first()

    elif source_type == "anomaly_event":
        source = db.query(AnomalyEvent).filter(
            AnomalyEvent.id == source_id,
            AnomalyEvent.tenant_id == tenant_id,
        ).first()

    elif source_type == "simulation_scenario":
        source = db.query(ScenarioSimulation).filter(
            ScenarioSimulation.id == source_id,
            ScenarioSimulation.tenant_id == tenant_id,
        ).first()

    else:
        source = None

    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Optimization source not found",
        )

    return source


def _build_recommendation_data(
    recommendation_type: str,
    source_type: str,
    source_context,
    entity_type: str,
    entity_id: int,
):
    severity_factor = _estimate_source_severity_factor(
        source_type=source_type,
        source_context=source_context,
    )

    base_savings = Decimal("10000") * severity_factor
    operational_impact = Decimal("15.0000") * severity_factor
    resource_change = Decimal("8.0000") * severity_factor
    performance_improvement = Decimal("12.0000") * severity_factor
    confidence_score = min(Decimal("0.6500") + (severity_factor * Decimal("0.2000")), Decimal("0.9500"))

    templates = {
        "load_balancing": {
            "title": f"Rebalance load for {entity_type} {entity_id}",
            "description": (
                "Redistribute workload from overloaded assets to healthier available "
                "capacity during projected peak windows."
            ),
            "reason": (
                "Forecasted or detected operational pressure indicates risk of "
                "localized overload."
            ),
            "action_plan": [
                {"step": 1, "action": "Identify overloaded entity"},
                {"step": 2, "action": "Find lower-utilization backup capacity"},
                {"step": 3, "action": "Shift non-critical workload during peak hours"},
            ],
        },
        "resource_redistribution": {
            "title": f"Redistribute resources for {entity_type} {entity_id}",
            "description": (
                "Move available resources toward the affected operational unit to "
                "reduce shortage or consumption imbalance."
            ),
            "reason": (
                "Resource usage patterns indicate imbalance across operating units."
            ),
            "action_plan": [
                {"step": 1, "action": "Measure resource gap"},
                {"step": 2, "action": "Prioritize high-impact operations"},
                {"step": 3, "action": "Reallocate resources from low-risk units"},
            ],
        },
        "predictive_shutdown": {
            "title": f"Schedule predictive shutdown for {entity_type} {entity_id}",
            "description": (
                "Temporarily shut down or throttle the affected asset before failure "
                "risk becomes critical."
            ),
            "reason": (
                "Anomaly or simulation signals suggest increasing failure probability."
            ),
            "action_plan": [
                {"step": 1, "action": "Notify operations manager"},
                {"step": 2, "action": "Schedule controlled shutdown window"},
                {"step": 3, "action": "Route dependent load to backup systems"},
            ],
        },
        "cost_optimization": {
            "title": f"Optimize cost profile for {entity_type} {entity_id}",
            "description": (
                "Reduce cost exposure by adjusting utilization during inefficient "
                "operating windows."
            ),
            "reason": (
                "Expected cost impact can be reduced through targeted scheduling and "
                "capacity adjustment."
            ),
            "action_plan": [
                {"step": 1, "action": "Identify high-cost operating window"},
                {"step": 2, "action": "Reduce non-essential consumption"},
                {"step": 3, "action": "Shift flexible workloads to lower-cost periods"},
            ],
        },
        "capacity_planning": {
            "title": f"Plan additional capacity for {entity_type} {entity_id}",
            "description": (
                "Prepare additional operational capacity to absorb projected demand "
                "or infrastructure pressure."
            ),
            "reason": (
                "Forecasted demand indicates possible capacity saturation."
            ),
            "action_plan": [
                {"step": 1, "action": "Estimate required reserve capacity"},
                {"step": 2, "action": "Activate temporary capacity buffers"},
                {"step": 3, "action": "Monitor utilization after adjustment"},
            ],
        },
        "dynamic_scheduling": {
            "title": f"Apply dynamic scheduling for {entity_type} {entity_id}",
            "description": (
                "Adjust workforce, machine, or workload schedules based on predicted "
                "operational pressure."
            ),
            "reason": (
                "Demand and utilization patterns suggest schedule optimization can "
                "reduce operational stress."
            ),
            "action_plan": [
                {"step": 1, "action": "Detect peak pressure window"},
                {"step": 2, "action": "Shift flexible tasks to lower-pressure periods"},
                {"step": 3, "action": "Rebalance workforce or equipment allocation"},
            ],
        },
    }

    template = templates[recommendation_type]

    return {
        "title": template["title"],
        "description": template["description"],
        "priority": _priority_from_factor(severity_factor),
        "confidence_score": confidence_score.quantize(Decimal("0.0001")),
        "estimated_cost_savings": base_savings.quantize(Decimal("0.0001")),
        "estimated_operational_impact": operational_impact.quantize(Decimal("0.0001")),
        "estimated_resource_change": resource_change.quantize(Decimal("0.0001")),
        "estimated_performance_improvement": performance_improvement.quantize(
            Decimal("0.0001")
        ),
        "risk_level": _priority_from_factor(severity_factor),
        "reason": template["reason"],
        "action_plan": template["action_plan"],
    }


def _estimate_source_severity_factor(
    source_type: str,
    source_context,
) -> Decimal:
    if source_type == "anomaly_event":
        score = Decimal(str(source_context.score or 1))
        return min(max(score / Decimal("5"), Decimal("0.25")), Decimal("1.00"))

    if source_type == "simulation_scenario":
        impact = Decimal(str(source_context.operational_impact or 50))
        return min(max(impact / Decimal("100"), Decimal("0.25")), Decimal("1.00"))

    if source_type == "forecast_run":
        metrics = source_context.performance_metrics or {}
        mape = Decimal(str(metrics.get("mape", 10)))
        return min(max(mape / Decimal("25"), Decimal("0.25")), Decimal("1.00"))

    return Decimal("0.50")


def _priority_from_factor(factor: Decimal) -> str:
    if factor >= Decimal("0.85"):
        return "critical"

    if factor >= Decimal("0.65"):
        return "high"

    if factor >= Decimal("0.40"):
        return "medium"

    return "low"


def _rank_recommendations(
    recommendations: list[OptimizationRecommendation],
) -> list[OptimizationRecommendation]:
    ranked = sorted(
        recommendations,
        key=lambda item: (
            Decimal(str(item.estimated_cost_savings or 0))
            + Decimal(str(item.estimated_operational_impact or 0)) * Decimal("100")
            + Decimal(str(item.estimated_performance_improvement or 0)) * Decimal("100")
        ),
        reverse=True,
    )

    for index, recommendation in enumerate(ranked, start=1):
        recommendation.rank = index # type: ignore

    return ranked

ALLOWED_OPTIMIZATION_STATUSES = {
    "pending",
    "approved",
    "rejected",
    "applied",
    "expired",
}


def update_optimization_recommendation(
    db: Session,
    recommendation_id: int,
    payload,
    current_user,
):
    recommendation = get_optimization_recommendation_by_id(
        db=db,
        recommendation_id=recommendation_id,
        current_user=current_user,
    )

    update_data = payload.model_dump(exclude_unset=True)

    if "status" in update_data:
        if update_data["status"] not in ALLOWED_OPTIMIZATION_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid optimization recommendation status",
            )

    if "recommendation_type" in update_data:
        if update_data["recommendation_type"] not in ALLOWED_RECOMMENDATION_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid recommendation type",
            )

    for field, value in update_data.items():
        setattr(recommendation, field, value)

    recommendation.updated_at = datetime.utcnow() # type: ignore

    db.commit()
    db.refresh(recommendation)

    return recommendation


def delete_optimization_recommendation(
    db: Session,
    recommendation_id: int,
    current_user,
):
    recommendation = get_optimization_recommendation_by_id(
        db=db,
        recommendation_id=recommendation_id,
        current_user=current_user,
    )

    db.delete(recommendation)
    db.commit()

    return {
        "message": "Optimization recommendation deleted successfully",
        "recommendation_id": recommendation_id,
    }


def apply_optimization_recommendation(
    db: Session,
    recommendation_id: int,
    current_user,
):
    recommendation = get_optimization_recommendation_by_id(
        db=db,
        recommendation_id=recommendation_id,
        current_user=current_user,
    )

    if recommendation.status == "applied": # type: ignore
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Optimization recommendation is already applied",
        )

    if recommendation.status in {"rejected", "expired"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot apply recommendation with status '{recommendation.status}'",
        )

    recommendation.status = "applied" # type: ignore
    recommendation.updated_at = datetime.utcnow() # type: ignore

    db.commit()
    db.refresh(recommendation)

    return {
        "message": "Optimization recommendation applied successfully",
        "recommendation": recommendation,
        "execution_summary": {
            "recommendation_id": recommendation.id,
            "recommendation_type": recommendation.recommendation_type,
            "entity_type": recommendation.entity_type,
            "entity_id": recommendation.entity_id,
            "estimated_cost_savings": recommendation.estimated_cost_savings,
            "estimated_performance_improvement": recommendation.estimated_performance_improvement,
            "note": "This first version marks the recommendation as applied. Actual automation execution can be connected later.",
        },
    }