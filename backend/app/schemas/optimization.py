from datetime import datetime
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel, Field


class OptimizationRecommendationBase(BaseModel):
    source_type: str = Field(..., max_length=50)
    source_id: int

    recommendation_type: str = Field(..., max_length=50)

    title: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = None

    entity_type: str = Field(..., max_length=50)
    entity_id: int

    priority: str = Field(default="medium", max_length=30)
    rank: int = Field(default=1, ge=1)

    confidence_score: Optional[Decimal] = None

    estimated_cost_savings: Optional[Decimal] = None
    estimated_operational_impact: Optional[Decimal] = None
    estimated_resource_change: Optional[Decimal] = None
    estimated_performance_improvement: Optional[Decimal] = None

    risk_level: str = Field(default="medium", max_length=30)

    reason: Optional[str] = None
    action_plan: Optional[list[dict[str, Any]]] = None

    status: str = Field(default="pending", max_length=30)
    expires_at: Optional[datetime] = None


class OptimizationRecommendationCreate(OptimizationRecommendationBase):
    pass


class OptimizationRecommendationUpdate(BaseModel):
    priority: Optional[str] = Field(default=None, max_length=30)
    rank: Optional[int] = Field(default=None, ge=1)
    status: Optional[str] = Field(default=None, max_length=30)

    title: Optional[str] = Field(default=None, min_length=3, max_length=150)
    description: Optional[str] = None

    confidence_score: Optional[Decimal] = None
    estimated_cost_savings: Optional[Decimal] = None
    estimated_operational_impact: Optional[Decimal] = None
    estimated_resource_change: Optional[Decimal] = None
    estimated_performance_improvement: Optional[Decimal] = None

    risk_level: Optional[str] = Field(default=None, max_length=30)
    reason: Optional[str] = None
    action_plan: Optional[list[dict[str, Any]]] = None
    expires_at: Optional[datetime] = None


class OptimizationRecommendationResponse(OptimizationRecommendationBase):
    id: int
    tenant_id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OptimizationGenerateRequest(BaseModel):
    source_type: str = Field(..., max_length=50)
    source_id: int
    entity_type: str = Field(..., max_length=50)
    entity_id: int
    include_types: Optional[list[str]] = None