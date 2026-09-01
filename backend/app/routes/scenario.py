from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import verify_role
from app.db.database import get_db
from app.schemas.scenario import (
    SimulationScenarioCreate,
    SimulationScenarioResponse,
    SimulationScenarioUpdate,
)
from app.services.scenario_service import (
    create_simulation_scenario,
    delete_simulation_scenario,
    get_simulation_scenario_by_id,
    list_simulation_scenarios,
    run_simulation_scenario,
    update_simulation_scenario,
)


router = APIRouter(
    prefix="/simulations",
    tags=["Scenario Simulation"],
)


@router.post("", response_model=SimulationScenarioResponse)
def create_scenario(
    payload: SimulationScenarioCreate,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst")),
):
    return create_simulation_scenario(
        db=db,
        payload=payload,
        current_user=current_user,
    )


@router.get("", response_model=list[SimulationScenarioResponse])
def list_scenarios(
    scenario_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst")),
):
    return list_simulation_scenarios(
        db=db,
        current_user=current_user,
        scenario_type=scenario_type,
        status_filter=status_filter,
        entity_type=entity_type,
        entity_id=entity_id,
    )


@router.get("/{scenario_id}", response_model=SimulationScenarioResponse)
def get_scenario_by_id(
    scenario_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst")),
):
    return get_simulation_scenario_by_id(
        db=db,
        scenario_id=scenario_id,
        current_user=current_user,
    )


@router.patch("/{scenario_id}", response_model=SimulationScenarioResponse)
def update_scenario(
    scenario_id: int,
    payload: SimulationScenarioUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst")),
):
    return update_simulation_scenario(
        db=db,
        scenario_id=scenario_id,
        payload=payload,
        current_user=current_user,
    )


@router.delete("/{scenario_id}")
def delete_scenario(
    scenario_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst")),
):
    return delete_simulation_scenario(
        db=db,
        scenario_id=scenario_id,
        current_user=current_user,
    )


@router.post("/{scenario_id}/run", response_model=SimulationScenarioResponse)
def run_scenario(
    scenario_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(verify_role("analyst")),
):
    return run_simulation_scenario(
        db=db,
        scenario_id=scenario_id,
        current_user=current_user,
    )

'''
{
  "name": "Facility 1 Demand Surge Simulation",
  "scenario_type": "demand_surge",
  "entity_type": "facility",
  "entity_id": 1,
  "start_time": "2026-08-28T10:00:00",
  "end_time": "2026-08-28T18:00:00",
  "severity": "high",
  "input_parameters": {
    "base_cost": 120000,
    "base_resource_consumption": 6200,
    "base_failure_probability": 0.12
  }
}
'''
