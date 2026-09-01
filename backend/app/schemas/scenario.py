from datetime import datetime
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel, Field

class SimulationScenarioBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    scenario_type: str = Field(..., max_length=50)

    entity_type: str = Field(..., max_length=50)
    entity_id: int

    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

    severity: str = Field(default="medium", max_length=30)

    input_parameters: Optional[dict[str, Any]] = None


class SimulationScenarioCreate(SimulationScenarioBase):
    pass


class SimulationScenarioUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    scenario_type: Optional[str] = Field(default=None, max_length=50)

    entity_type: Optional[str] = Field(default=None, max_length=50)
    entity_id: Optional[int] = None

    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

    severity: Optional[str] = Field(default=None, max_length=30)
    input_parameters: Optional[dict[str, Any]] = None

    status: Optional[str] = Field(default=None, max_length=30)


class SimulationScenarioResponse(SimulationScenarioBase):
    id: int
    tenant_id: int

    operational_impact: Optional[Decimal] = None
    cost_change: Optional[Decimal] = None
    resource_consumption_change: Optional[Decimal] = None
    failure_probability: Optional[Decimal] = None
    performance_degradation: Optional[Decimal] = None
    predicted_savings: Optional[Decimal] = None

    recommendation_summary: Optional[str] = None
    status: str

    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SimulationRunRequest(BaseModel):
    scenario_id: int


class SimulationRunResponse(BaseModel):
    scenario_id: int
    status: str
    operational_impact: Decimal
    cost_change: Decimal
    resource_consumption_change: Decimal
    failure_probability: Decimal
    performance_degradation: Decimal
    predicted_savings: Decimal
    recommendation_summary: str