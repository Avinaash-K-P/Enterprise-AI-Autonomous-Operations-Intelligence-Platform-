from app.db.database import Base
from sqlalchemy import Column, Numeric, Integer, String, DateTime, ForeignKey
from datetime import datetime

class ForecastResult(Base):

    __tablename__ = "forecast_results"

    id = Column(Integer, primary_key=True, index=True)

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)

    run_id = Column(Integer, ForeignKey("forecast_runs.id", ondelete="CASCADE"), nullable=False, index=True)

    metric_id = Column(Integer, ForeignKey("forecast_metrics.id"), nullable=False)

    entity_type = Column(String(50), nullable=False)

    entity_id = Column(Integer, nullable=False)

    forecast_timestamp = Column(DateTime, nullable=False)

    predicted_value = Column(Numeric(14,4), nullable=False)

    lower_bound = Column(Numeric(14,4), nullable=False)

    upper_bound = Column(Numeric(14,4), nullable=False)

    confidence_score = Column(Numeric(5,4), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


'''
id
tenant_id
run_id
metric_id
entity_type
entity_id
forecast_timestamp
predicted_value
lower_bound
upper_bound
confidence_score
created_at
'''