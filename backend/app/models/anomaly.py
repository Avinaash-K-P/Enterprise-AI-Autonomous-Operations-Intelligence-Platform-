from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.db.database import Base


class AnomalyEvent(Base):
    __tablename__ = "anomaly_events"

    id = Column(Integer, primary_key=True, index=True)

    tenant_id = Column(
        Integer,
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    metric_id = Column(
        Integer,
        ForeignKey("forecast_metrics.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    observation_id = Column(
        Integer,
        ForeignKey("observations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    entity_type = Column(String(50), nullable=False, index=True)

    entity_id = Column(Integer, nullable=False, index=True)

    anomaly_type = Column(String(50), nullable=False)

    severity = Column(String(30), nullable=False)

    score = Column(Numeric(6, 4), nullable=False)

    actual_value = Column(Numeric(14, 4), nullable=True)

    expected_value = Column(Numeric(14, 4), nullable=True)

    deviation_percentage = Column(Numeric(8, 4), nullable=True)

    root_cause_hint = Column(String(255), nullable=True)

    description = Column(Text, nullable=True)

    status = Column(String(30), default="open", nullable=False)

    extra_data = Column("metadata", JSONB, nullable=True)

    detected_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )