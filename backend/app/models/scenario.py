from app.db.database import Base 
from sqlalchemy import JSON, Column, Integer, ForeignKey, String, DateTime, Numeric, Text, Enum as SQLEnum
from datetime import datetime
from enum import Enum

class ScenarioSimulationStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed" 
    FAILED = "failed" 
    CANCELLED = "cancelled"
                
                
class ScenarioSimulation(Base):

    __tablename__ = "scenario_simulations"

    id = Column(Integer, primary_key=True, index=True)

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)

    name = Column(String(150), nullable=False)

    scenario_type = Column(String(50),nullable=False)

    entity_type = Column(String(50),nullable=False)

    entity_id = Column(Integer, nullable=False)

    start_time = Column(DateTime, nullable=False)

    end_time = Column(DateTime, nullable=False)

    severity = Column(String(30),nullable=False)

    input_parameters = Column(JSON, nullable=False)

    operational_impact = Column(Numeric(8,4), nullable=True)

    cost_change = Column(Numeric(14,4),nullable=True)

    resource_consumption_change = Column(Numeric(14,4),nullable=True)

    failure_probability = Column(Numeric(6,4),nullable=True)

    performance_degradation = Column(Numeric(6,4),nullable=True)

    predicted_savings = Column(Numeric(14,4),nullable=True)

    recommendation_summary  = Column(Text,nullable=True)

    status = Column(SQLEnum(ScenarioSimulationStatus), default=ScenarioSimulationStatus.PENDING, nullable=False)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    updated_at = Column(DateTime, nullable=True)

    completed_at = Column(DateTime, nullable=True)


