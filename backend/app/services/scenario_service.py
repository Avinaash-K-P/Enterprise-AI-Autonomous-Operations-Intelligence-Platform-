from datetime import datetime
from decimal import Decimal
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.scenario import ScenarioSimulation


ALLOWED_SCENARIO_TYPES = {
    "traffic_spike",
    "facility_shutdown",
    "extreme_weather",
    "resource_shortage",
    "device_failure",
    "workforce_reduction",
    "demand_surge",
    "supply_chain_delay",
}

ALLOWED_SEVERITIES = {
    "low",
    "medium",
    "high",
    "critical",
}


def create_simulation_scenario(
    db: Session,
    payload,
    current_user,
):
    if payload.scenario_type not in ALLOWED_SCENARIO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid scenario type",
        )

    if payload.severity not in ALLOWED_SEVERITIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid scenario severity",
        )

    scenario = ScenarioSimulation(
        tenant_id=current_user.tenant_id,
        name=payload.name,
        scenario_type=payload.scenario_type,
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        severity=payload.severity,
        input_parameters=payload.input_parameters,
        operational_impact=None,
        cost_change=None,
        resource_consumption_change=None,
        failure_probability=None,
        performance_degradation=None,
        predicted_savings=None,
        recommendation_summary=None,
        status="pending",
        created_by=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        completed_at=None,
    )

    db.add(scenario)
    db.commit()
    db.refresh(scenario)

    return scenario


def list_simulation_scenarios(
    db: Session,
    current_user,
    scenario_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
):
    query = db.query(ScenarioSimulation).filter(
        ScenarioSimulation.tenant_id == current_user.tenant_id,
    )

    if scenario_type:
        query = query.filter(ScenarioSimulation.scenario_type == scenario_type)

    if status_filter:
        query = query.filter(ScenarioSimulation.status == status_filter)

    if entity_type:
        query = query.filter(ScenarioSimulation.entity_type == entity_type)

    if entity_id:
        query = query.filter(ScenarioSimulation.entity_id == entity_id)

    return query.order_by(ScenarioSimulation.created_at.desc()).all()


def get_simulation_scenario_by_id(
    db: Session,
    scenario_id: int,
    current_user,
):
    scenario = db.query(ScenarioSimulation).filter(
        ScenarioSimulation.id == scenario_id,
        ScenarioSimulation.tenant_id == current_user.tenant_id,
    ).first()

    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation scenario not found",
        )

    return scenario

def update_simulation_scenario(
    db: Session,
    scenario_id: int,
    payload,
    current_user,
):
    scenario = get_simulation_scenario_by_id(
        db=db,
        scenario_id=scenario_id,
        current_user=current_user,
    )

    update_data = payload.model_dump(exclude_unset=True)

    if "scenario_type" in update_data:
        if update_data["scenario_type"] not in ALLOWED_SCENARIO_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid scenario type",
            )

    if "severity" in update_data:
        if update_data["severity"] not in ALLOWED_SEVERITIES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid scenario severity",
            )

    for field, value in update_data.items():
        setattr(scenario, field, value)

    scenario.updated_at = datetime.utcnow() # type: ignore

    db.commit()
    db.refresh(scenario)

    return scenario


def delete_simulation_scenario(
    db: Session,
    scenario_id: int,
    current_user,
):
    scenario = get_simulation_scenario_by_id(
        db=db,
        scenario_id=scenario_id,
        current_user=current_user,
    )

    db.delete(scenario)
    db.commit()

    return {
        "message": "Simulation scenario deleted successfully",
        "scenario_id": scenario_id,
    }


def run_simulation_scenario(
    db: Session,
    scenario_id: int,
    current_user,
):
    scenario = get_simulation_scenario_by_id(
        db=db,
        scenario_id=scenario_id,
        current_user=current_user,
    )

    if scenario.status == "running":# type: ignore
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Simulation scenario is already running",
        )

    scenario.status = "running"# type: ignore
    scenario.updated_at = datetime.utcnow()# type: ignore
    db.commit()
    db.refresh(scenario)

    try:
        severity_multiplier = {
            "low": Decimal("0.25"),# type: ignore
            "medium": Decimal("0.50"),# type: ignore
            "high": Decimal("0.75"),# type: ignore
            "critical": Decimal("1.00"),# type: ignore
        }.get(scenario.severity, Decimal("0.50"))# type: ignore

        scenario_multiplier = {
            "traffic_spike": Decimal("0.65"),# type: ignore
            "facility_shutdown": Decimal("0.95"),
            "extreme_weather": Decimal("0.80"),
            "resource_shortage": Decimal("0.70"),
            "device_failure": Decimal("0.85"),
            "workforce_reduction": Decimal("0.60"),
            "demand_surge": Decimal("0.75"),
            "supply_chain_delay": Decimal("0.68"),
        }.get(scenario.scenario_type, Decimal("0.50")) # type: ignore

        input_parameters = scenario.input_parameters or {}

        base_cost = Decimal(str(input_parameters.get("base_cost", 100000)))
        base_resource_consumption = Decimal(
            str(input_parameters.get("base_resource_consumption", 5000))
        )
        base_failure_probability = Decimal(
            str(input_parameters.get("base_failure_probability", 0.10))
        )

        operational_impact = severity_multiplier * scenario_multiplier * Decimal("100")
        cost_change = base_cost * severity_multiplier * scenario_multiplier
        resource_consumption_change = (
            base_resource_consumption * severity_multiplier * scenario_multiplier
        )
        failure_probability = min(
            base_failure_probability
            + (severity_multiplier * scenario_multiplier * Decimal("0.35")),
            Decimal("0.95"),
        )
        performance_degradation = severity_multiplier * scenario_multiplier * Decimal("100")
        predicted_savings = cost_change * Decimal("0.18")

        scenario.operational_impact = operational_impact.quantize(Decimal("0.0001"))
        scenario.cost_change = cost_change.quantize(Decimal("0.0001"))
        scenario.resource_consumption_change = resource_consumption_change.quantize(
            Decimal("0.0001")
        )
        scenario.failure_probability = failure_probability.quantize(Decimal("0.0001")) # type: ignore
        scenario.performance_degradation = performance_degradation.quantize(
            Decimal("0.0001")
        )
        scenario.predicted_savings = predicted_savings.quantize(Decimal("0.0001")) # type: ignore
        scenario.recommendation_summary = _build_simulation_recommendation(scenario) # type: ignore
        scenario.status = "completed" # type: ignore
        scenario.completed_at = datetime.utcnow() # type: ignore
        scenario.updated_at = datetime.utcnow() # type: ignore

        db.commit()
        db.refresh(scenario)

        return scenario

    except Exception as exc:
        scenario.status = "failed" # type: ignore
        scenario.updated_at = datetime.utcnow() # type: ignore

        db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation failed: {str(exc)}",
        )


def _build_simulation_recommendation(scenario: SimulationScenario) -> str: # type: ignore
    recommendations = {
        "traffic_spike": (
            "Redistribute workload across available facilities and enable temporary "
            "capacity buffers during peak traffic windows."
        ),
        "facility_shutdown": (
            "Shift critical operations to backup facilities and prioritize essential "
            "workloads until the affected facility is restored."
        ),
        "extreme_weather": (
            "Increase resource buffers, adjust workforce scheduling, and reduce "
            "non-critical operations during weather impact periods."
        ),
        "resource_shortage": (
            "Reallocate available resources to high-priority operations and delay "
            "low-impact workloads."
        ),
        "device_failure": (
            "Trigger predictive maintenance workflow and reroute dependent operations "
            "to healthy devices."
        ),
        "workforce_reduction": (
            "Reschedule shifts, automate repetitive workloads, and prioritize core "
            "production tasks."
        ),
        "demand_surge": (
            "Increase production capacity, rebalance inventory, and activate dynamic "
            "scheduling for high-demand periods."
        ),
        "supply_chain_delay": (
            "Use alternate suppliers, consume buffer inventory, and reprioritize "
            "customer-critical orders."
        ),
    }

    return recommendations.get(
        scenario.scenario_type,
        "Review scenario impact and apply operational mitigation strategy.",
    )