from app.db.database import Base
from sqlalchemy import Column, Numeric, Integer, String, DateTime, ForeignKey, JSON 
from datetime import datetime

class Observation(Base):

    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, index=True)

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)

    metric_id = Column(Integer, ForeignKey("forecast_metrics.id"), nullable=False)

    entity_type = Column(String(50), nullable=False)

    entity_id = Column(Integer, nullable=True)

    timestamp = Column(DateTime, nullable=False)

    value = Column(Numeric(14,4), nullable=False)

    source = Column(String(30), nullable=False)

    quality_flag = Column(String(30), nullable=False)

    extra_data = Column("metadata", JSON, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)  