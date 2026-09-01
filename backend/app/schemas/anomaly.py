from datetime import datetime
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel, Field


class AnomalyEventBase(BaseModel):
    metric_id: int
    entity_type: str = Field(..., max_length=50)
    entity_id: int
    observation_id: Optional[int] = None

    anomaly_type: str = Field(..., max_length=50)
    severity: str = Field(..., max_length=30)

    score: Decimal
    actual_value: Optional[Decimal] = None
    expected_value: Optional[Decimal] = None
    deviation_percentage: Optional[Decimal] = None

    root_cause_hint: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    status: str = Field(default="open", max_length=30)
    extra_data: Optional[dict[str, Any]] = None


class AnomalyEventCreate(AnomalyEventBase):
    pass
    

class AnomalyEventUpdate(BaseModel):
    anomaly_type: Optional[str] = Field(default=None, max_length=50)
    severity: Optional[str] = Field(default=None, max_length=30)

    score: Optional[Decimal] = None
    actual_value: Optional[Decimal] = None
    expected_value: Optional[Decimal] = None
    deviation_percentage: Optional[Decimal] = None

    root_cause_hint: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(default=None, max_length=30)
    extra_data: Optional[dict[str, Any]] = None


class AnomalyEventResponse(AnomalyEventBase):
    id: int
    tenant_id: int
    detected_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AnomalyDetectionRequest(BaseModel):
    metric_id: int
    entity_type: str = Field(..., max_length=50)
    entity_id: int
    method: str = Field(default="statistical", max_length=50)
    sensitivity: float