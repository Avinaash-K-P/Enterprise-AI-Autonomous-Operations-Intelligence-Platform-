from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.db.database import Base


class OptimizationRecommendation(Base):
    __tablename__ = "optimization_recommendations"

    id = Column(Integer, primary_key=True, index=True)

    tenant_id = Column(
        Integer,
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    source_type = Column(String(50), nullable=False, index=True)

    source_id = Column(Integer, nullable=False, index=True)

    recommendation_type = Column(String(50), nullable=False, index=True)

    title = Column(String(150), nullable=False)

    description = Column(Text, nullable=True)

    entity_type = Column(String(50), nullable=False, index=True)

    entity_id = Column(Integer, nullable=False, index=True)

    priority = Column(String(30), nullable=False, default="medium")

    rank = Column(Integer, nullable=False, default=1)

    confidence_score = Column(Numeric(5, 4), nullable=True)

    estimated_cost_savings = Column(Numeric(14, 4), nullable=True)

    estimated_operational_impact = Column(Numeric(8, 4), nullable=True)

    estimated_resource_change = Column(Numeric(14, 4), nullable=True)

    estimated_performance_improvement = Column(Numeric(8, 4), nullable=True)

    risk_level = Column(String(30), nullable=False, default="medium")

    reason = Column(Text, nullable=True)

    action_plan = Column(JSONB, nullable=True)

    status = Column(String(30), nullable=False, default="pending")

    created_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    expires_at = Column(DateTime, nullable=True)