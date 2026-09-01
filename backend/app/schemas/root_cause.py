from datetime import datetime
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel, Field


class CorrelatedMetricInsight(BaseModel):
    metric_id: int
    metric_name: Optional[str] = None
    correlation_score: Decimal
    relationship_type: str
    explanation: str


class FeatureImportanceInsight(BaseModel):
    feature_name: str
    importance_score: Decimal
    explanation: str


class ImpactChainItem(BaseModel):
    source: str
    target: str
    impact_type: str
    severity: str
    explanation: str


class LikelyCauseInsight(BaseModel):
    cause_type: str
    confidence_score: Decimal
    explanation: str
    supporting_evidence: list[str] = []


class RootCauseAnalysisRequest(BaseModel):
    lookback_hours: int = Field(default=24, ge=1, le=168)
    include_feature_importance: bool = True
    include_impact_chain: bool = True


class RootCauseAnalysisResponse(BaseModel):
    anomaly_id: int
    tenant_id: int
    metric_id: int
    entity_type: str
    entity_id: int

    anomaly_type: str
    severity: str
    anomaly_score: Decimal

    summary: str
    likely_causes: list[LikelyCauseInsight]
    correlated_metrics: list[CorrelatedMetricInsight]
    feature_importance: list[FeatureImportanceInsight]
    impact_chain: list[ImpactChainItem]

    confidence_score: Decimal
    generated_at: datetime
    metadata: Optional[dict[str, Any]] = None