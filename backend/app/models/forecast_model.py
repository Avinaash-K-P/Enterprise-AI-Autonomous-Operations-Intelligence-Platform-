from app.db.database import Base
from sqlalchemy import Column, JSON, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from enum import Enum
from datetime import datetime

class ForcastModelStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class ForecastModel(Base):

    __tablename__ = "forecast_models"

    id = Column(Integer, primary_key=True, index=True)

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)

    metric_id = Column(Integer, ForeignKey("forecast_metrics.id"), nullable=False)

    name = Column(String(50), nullable=False)

    model_type = Column(String(30), nullable=False)

    entity_type = Column(String(50), nullable=False)

    horizon = Column(String(30), nullable=False)

    frequency = Column(String(30), nullable=False)

    config = Column(JSON, nullable=False)

    status = Column(SQLEnum(ForcastModelStatus), default=ForcastModelStatus.ACTIVE, nullable=False)

    version = Column(String(10), default="1.0.0", nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)  

    updated_at = Column(DateTime, nullable=True)      
