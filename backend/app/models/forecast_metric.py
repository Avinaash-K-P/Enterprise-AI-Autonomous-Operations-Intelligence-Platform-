from app.db.database import Base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime

class ForecastMetric(Base):

    __tablename__ = "forecast_metrics"

    id = Column(Integer, primary_key=True, index=True)

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)

    name = Column(String(50), nullable=False)

    code = Column(String(50), nullable=False)

    description = Column(String(255), nullable=False)

    unit = Column(String(30), nullable=False)

    category = Column(String(30), nullable=False)

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    

