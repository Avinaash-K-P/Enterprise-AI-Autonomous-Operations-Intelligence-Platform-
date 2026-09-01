from app.db.database import Base
from sqlalchemy import JSON, Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Text
from enum import Enum
from datetime import datetime

class ForecastRunStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    FAILED = "failed"
    COMPLETED = "completed"

class ForecastRun(Base):

    __tablename__ = "forecast_runs"

    id = Column(Integer, primary_key=True, index=True)

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)

    model_id = Column(Integer, ForeignKey("forecast_models.id"), nullable=False)

    run_type = Column(String(30), nullable=False)

    status = Column(SQLEnum(ForecastRunStatus), default=ForecastRunStatus.PENDING, nullable=False)

    training_start = Column(DateTime, nullable=True)

    training_end = Column(DateTime, nullable=True)

    forecast_start = Column(DateTime, nullable=True)

    forecast_end = Column(DateTime, nullable=True)

    input_window_start = Column(DateTime, nullable=True)

    input_window_end = Column(DateTime, nullable=True)

    performance_metrics = Column(JSON, nullable=True)

    error_message = Column(Text, nullable=True)

    created_at  = Column(DateTime, default=datetime.utcnow, nullable=False)

    completed_at = Column(DateTime, nullable=True)



